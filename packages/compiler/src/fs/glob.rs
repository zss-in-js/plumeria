use std::path::{Component, Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};

use globset::{Candidate, Glob, GlobSet, GlobSetBuilder};
use ignore::Match;
use ignore::gitignore::{Gitignore, GitignoreBuilder};

#[allow(dead_code)]
enum WalkWidth {
    FastestCoreClass,
    Full,
}

#[cfg(target_os = "macos")]
const WALK_WIDTH: WalkWidth = WalkWidth::FastestCoreClass;

#[cfg(not(target_os = "macos"))]
const WALK_WIDTH: WalkWidth = WalkWidth::Full;

fn performance_cores() -> Option<usize> {
    platform::performance_cores()
}

#[cfg(target_os = "macos")]
mod platform {
    unsafe extern "C" {
        fn sysctlbyname(
            name: *const std::ffi::c_char,
            oldp: *mut std::ffi::c_void,
            oldlen: *mut usize,
            newp: *mut std::ffi::c_void,
            newlen: usize,
        ) -> i32;
    }

    fn sysctl_u32(name: &std::ffi::CStr) -> Option<u32> {
        let mut value: u32 = 0;
        let mut len = std::mem::size_of::<u32>();
        let ok = unsafe {
            sysctlbyname(
                name.as_ptr(),
                &mut value as *mut u32 as *mut std::ffi::c_void,
                &mut len,
                std::ptr::null_mut(),
                0,
            )
        };
        (ok == 0 && len == std::mem::size_of::<u32>()).then_some(value)
    }

    pub fn performance_cores() -> Option<usize> {
        let fastest = sysctl_u32(c"hw.perflevel0.logicalcpu").filter(|n| *n > 0)?;
        let total = sysctl_u32(c"hw.logicalcpu").unwrap_or(0);
        (total == 0 || fastest < total).then_some(fastest as usize)
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    pub fn performance_cores() -> Option<usize> {
        None
    }
}

fn pool_threads() -> usize {
    let available = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1);

    if let Some(requested) = std::env::var("RUST_GEAR_GLOB_THREADS")
        .ok()
        .and_then(|value| value.trim().parse::<usize>().ok())
        .filter(|n| *n > 0)
    {
        return requested;
    }

    match WALK_WIDTH {
        WalkWidth::Full => available,
        WalkWidth::FastestCoreClass => {
            performance_cores().map_or(available, |cores| cores.clamp(1, available))
        }
    }
}

fn width_for(files: usize) -> usize {
    let full = pool_threads();
    if std::env::var_os("RUST_GEAR_GLOB_THREADS").is_some() {
        return full;
    }
    match files {
        1..384 => full.min(2),
        _ => full,
    }
}

type Pools = Mutex<rustc_hash::FxHashMap<usize, &'static rayon::ThreadPool>>;

pub(crate) fn pool(files: usize) -> &'static rayon::ThreadPool {
    static POOLS: OnceLock<Pools> = OnceLock::new();
    let width = width_for(files);
    let mut pools = POOLS
        .get_or_init(Default::default)
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    pools.entry(width).or_insert_with(|| {
        Box::leak(Box::new(
            rayon::ThreadPoolBuilder::new()
                .num_threads(width)
                .thread_name(|i| format!("plumeria-compiler-{i}"))
                .build()
                .expect("failed to build glob thread pool"),
        ))
    })
}

pub struct GlobOptions<'o> {
    pub cwd: &'o Path,
    pub exclude: &'o [String],
    pub expected_files: usize,
}

fn build_globset(patterns: &[String]) -> Result<GlobSet, String> {
    let mut builder = GlobSetBuilder::new();
    for pattern in patterns {
        builder
            .add(Glob::new(pattern).map_err(|e| format!("Invalid glob pattern '{pattern}': {e}"))?);
    }
    builder.build().map_err(|e| e.to_string())
}

fn static_prefix(pattern: &str) -> &str {
    let glob_chars = ['*', '?', '[', '{'];
    let prefix = match pattern.find(|c| glob_chars.contains(&c)) {
        Some(index) => {
            let prefix = &pattern[..index];
            match prefix.rfind(['/', '\\']) {
                Some(last) => &prefix[..last],
                None => "",
            }
        }
        None => match pattern.rfind(['/', '\\']) {
            Some(last) => &pattern[..last],
            None => "",
        },
    };
    if Path::new(prefix)
        .components()
        .any(|component| matches!(component, Component::Normal(_)))
    {
        prefix
    } else {
        ""
    }
}

fn gitignore_base(search_root: &Path) -> (PathBuf, bool) {
    let mut dir = Some(search_root);
    while let Some(current) = dir {
        if current.join(".git").exists() || current.join(".jj").exists() {
            return (current.to_path_buf(), true);
        }
        dir = current.parent();
    }
    (search_root.to_path_buf(), false)
}

fn reject_patterns_outside_cwd(cwd: &Path, patterns: &[String]) -> Result<(), String> {
    let mut cwd_real: Option<PathBuf> = None;
    for pattern in patterns {
        if !Path::new(pattern).is_absolute() {
            continue;
        }
        let prefix = static_prefix(pattern);
        if prefix.is_empty() {
            continue;
        }
        let Ok(prefix_real) = std::fs::canonicalize(prefix) else {
            continue;
        };
        let cwd_real = cwd_real.get_or_insert_with(|| {
            std::fs::canonicalize(cwd).unwrap_or_else(|_| cwd.to_path_buf())
        });
        if !prefix_real.starts_with(&*cwd_real) {
            return Err(format!(
                "Absolute pattern '{}' resolves to '{}', which is outside cwd '{}'. Pass the `cwd` option pointing at the directory you want to search.",
                pattern,
                prefix_real.display(),
                cwd_real.display()
            ));
        }
    }
    Ok(())
}

fn determine_base_path(cwd: &Path, patterns: &[String]) -> PathBuf {
    if patterns.is_empty() {
        return cwd.to_path_buf();
    }
    let absolute = Path::new(&patterns[0]).is_absolute();
    if patterns
        .iter()
        .any(|pattern| Path::new(pattern).is_absolute() != absolute)
    {
        return cwd.to_path_buf();
    }
    let mut common: Option<PathBuf> = None;
    for pattern in patterns {
        let static_part = static_prefix(pattern);
        if static_part.is_empty() {
            return cwd.to_path_buf();
        }
        let path = PathBuf::from(static_part);
        match common {
            None => common = Some(path),
            Some(ref mut base) => {
                let mut next = PathBuf::new();
                for (a, b) in base.components().zip(path.components()) {
                    if a == b {
                        next.push(a);
                    } else {
                        break;
                    }
                }
                *base = next;
            }
        }
    }
    match common {
        Some(base) if !base.as_os_str().is_empty() => {
            let full = cwd.join(base);
            if full.is_dir() {
                full
            } else {
                cwd.to_path_buf()
            }
        }
        _ => cwd.to_path_buf(),
    }
}

struct Walk {
    cwd: PathBuf,
    include: GlobSet,
    exclude: GlobSet,
    absolute: bool,
    results: Mutex<Vec<String>>,
}

struct IgnoreNode {
    matcher: Arc<Gitignore>,
    parent: Option<Arc<IgnoreNode>>,
}

fn load_gitignore(
    dir: &Path,
    rel: &Path,
    parent: Option<Arc<IgnoreNode>>,
) -> Option<Arc<IgnoreNode>> {
    type Cache =
        Mutex<rustc_hash::FxHashMap<(PathBuf, PathBuf), (std::time::SystemTime, Arc<Gitignore>)>>;
    static CACHE: OnceLock<Cache> = OnceLock::new();
    let file = dir.join(".gitignore");
    let modified = std::fs::metadata(&file)
        .and_then(|meta| meta.modified())
        .ok();
    let key = (dir.to_path_buf(), rel.to_path_buf());
    let cache = CACHE.get_or_init(Default::default);
    if let Some(modified) = modified
        && let Some((stamp, matcher)) = cache.lock().unwrap_or_else(|e| e.into_inner()).get(&key)
        && *stamp == modified
    {
        return Some(Arc::new(IgnoreNode {
            matcher: matcher.clone(),
            parent,
        }));
    }
    let mut builder = GitignoreBuilder::new(rel);
    builder.add(file);
    match builder.build() {
        Ok(matcher) => {
            let matcher = Arc::new(matcher);
            if let Some(modified) = modified {
                cache
                    .lock()
                    .unwrap_or_else(|e| e.into_inner())
                    .insert(key, (modified, matcher.clone()));
            }
            Some(Arc::new(IgnoreNode { matcher, parent }))
        }
        Err(_) => parent,
    }
}

fn ancestor_gitignores(base: &Path, search_root: &Path, floor: &Path) -> Option<Arc<IgnoreNode>> {
    let relative = search_root.strip_prefix(base).ok()?;
    let mut chain: Option<Arc<IgnoreNode>> = None;
    let mut dir = base.to_path_buf();
    let mut rel = PathBuf::new();
    for component in relative.components() {
        if dir.starts_with(floor) && dir.join(".gitignore").is_file() {
            chain = load_gitignore(&dir, &rel, chain);
        }
        dir.push(component);
        rel.push(component);
    }
    chain
}

fn is_gitignored(mut node: Option<&Arc<IgnoreNode>>, path: &Path, is_dir: bool) -> bool {
    while let Some(current) = node {
        match current.matcher.matched(path, is_dir) {
            Match::None => node = current.parent.as_ref(),
            Match::Ignore(_) => return true,
            Match::Whitelist(_) => return false,
        }
    }
    false
}

impl Walk {
    fn walk<'s>(
        &'s self,
        scope: &rayon::Scope<'s>,
        dir: PathBuf,
        mut rel: PathBuf,
        mut gitignore_rel: Option<PathBuf>,
        parent_gitignore: Option<Arc<IgnoreNode>>,
        mut in_git_repo: bool,
    ) {
        let Ok(read_dir) = std::fs::read_dir(&dir) else {
            return;
        };
        let mut entries: Vec<(std::ffi::OsString, std::fs::FileType)> = Vec::new();
        let mut has_gitignore = false;
        for entry in read_dir.flatten() {
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            let name = entry.file_name();
            let bytes = name.as_encoded_bytes();
            if bytes.starts_with(b".") {
                if bytes == b".gitignore" {
                    has_gitignore = true;
                } else if bytes == b".git" || bytes == b".jj" {
                    in_git_repo = true;
                }
                continue;
            }
            entries.push((name, file_type));
        }

        let gitignore = if has_gitignore {
            load_gitignore(
                &dir,
                gitignore_rel.as_deref().unwrap_or(rel.as_path()),
                parent_gitignore,
            )
        } else {
            parent_gitignore
        };

        let mut matched: Vec<String> = Vec::new();

        for (name, file_type) in entries {
            let is_dir = file_type.is_dir();
            rel.push(&name);
            if let Some(g) = gitignore_rel.as_mut() {
                g.push(&name);
            }
            let pop = |rel: &mut PathBuf, g: &mut Option<PathBuf>| {
                rel.pop();
                if let Some(g) = g.as_mut() {
                    g.pop();
                }
            };

            if in_git_repo
                && is_gitignored(
                    gitignore.as_ref(),
                    gitignore_rel.as_deref().unwrap_or(rel.as_path()),
                    is_dir,
                )
            {
                pop(&mut rel, &mut gitignore_rel);
                continue;
            }

            let abs = self.absolute.then(|| dir.join(&name));

            if is_dir {
                if !self.exclude.is_empty()
                    && (self.exclude.is_match_candidate(&Candidate::new(&rel))
                        || abs
                            .as_ref()
                            .is_some_and(|p| self.exclude.is_match_candidate(&Candidate::new(p))))
                {
                    pop(&mut rel, &mut gitignore_rel);
                    continue;
                }
                let child_dir = abs.unwrap_or_else(|| dir.join(&name));
                let child_rel = rel.clone();
                let child_gitignore_rel = gitignore_rel.clone();
                pop(&mut rel, &mut gitignore_rel);
                let gitignore = gitignore.clone();
                scope.spawn(move |scope| {
                    self.walk(
                        scope,
                        child_dir,
                        child_rel,
                        child_gitignore_rel,
                        gitignore,
                        in_git_repo,
                    )
                });
                continue;
            }

            let rel_candidate = Candidate::new(&rel);
            let is_match = match &abs {
                Some(abs) => {
                    let abs_candidate = Candidate::new(abs);
                    (self.include.is_match_candidate(&rel_candidate)
                        || self.include.is_match_candidate(&abs_candidate))
                        && !(self.exclude.is_match_candidate(&rel_candidate)
                            || self.exclude.is_match_candidate(&abs_candidate))
                }
                None => {
                    self.include.is_match_candidate(&rel_candidate)
                        && !self.exclude.is_match_candidate(&rel_candidate)
                }
            };
            if !is_match {
                pop(&mut rel, &mut gitignore_rel);
                continue;
            }
            let text = match &abs {
                Some(abs) => abs.to_string_lossy().into_owned(),
                None => rel.to_string_lossy().into_owned(),
            };
            pop(&mut rel, &mut gitignore_rel);
            #[cfg(windows)]
            let text = text.replace('\\', "/");
            if !text.is_empty() {
                matched.push(text);
            }
        }

        if !matched.is_empty() {
            self.results
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .append(&mut matched);
        }
    }
}

pub fn glob_sync(patterns: &[String], options: GlobOptions) -> Result<Vec<String>, String> {
    let patterns: Vec<String> = patterns
        .iter()
        .map(|pattern| {
            let normalized = pattern.replace('\\', "/");
            normalized
                .strip_prefix("./")
                .map(str::to_string)
                .unwrap_or(normalized)
        })
        .collect();
    if patterns.iter().all(String::is_empty) {
        return Ok(Vec::new());
    }
    let cwd = options.cwd.to_path_buf();
    reject_patterns_outside_cwd(&cwd, &patterns)?;
    let search_root = determine_base_path(&cwd, &patterns);
    let absolute = patterns
        .iter()
        .any(|pattern| Path::new(pattern).is_absolute());
    let include = build_globset(&patterns)?;
    let exclude = build_globset(options.exclude)?;

    let walk = Walk {
        cwd,
        include,
        exclude,
        absolute,
        results: Mutex::new(Vec::new()),
    };

    if !walk.exclude.is_empty() {
        let root_relative = search_root.strip_prefix(&walk.cwd).unwrap_or(&search_root);
        if walk
            .exclude
            .is_match_candidate(&Candidate::new(root_relative))
            || (walk.absolute
                && walk
                    .exclude
                    .is_match_candidate(&Candidate::new(&search_root)))
        {
            return Ok(Vec::new());
        }
    }

    let root_rel = search_root
        .strip_prefix(&walk.cwd)
        .unwrap_or(Path::new(""))
        .to_path_buf();
    let (gitignore_root, in_git_repo) = gitignore_base(&search_root);
    let ancestors = if in_git_repo {
        ancestor_gitignores(&gitignore_root, &search_root, &walk.cwd)
    } else {
        None
    };
    let gitignore_rel = search_root
        .strip_prefix(&gitignore_root)
        .ok()
        .filter(|relative| *relative != root_rel.as_path())
        .map(Path::to_path_buf);

    pool(options.expected_files).install(|| {
        rayon::scope(|scope| {
            walk.walk(
                scope,
                search_root.clone(),
                root_rel,
                gitignore_rel,
                ancestors,
                in_git_repo,
            )
        })
    });
    let mut results = walk.results.into_inner().unwrap_or_else(|e| e.into_inner());
    results.sort_unstable();
    Ok(results)
}
