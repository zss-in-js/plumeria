use std::path::{Component, Path, PathBuf};

pub fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Prefix(prefix) => out.push(prefix.as_os_str()),
            Component::RootDir => out.push(component.as_os_str()),
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() && !out.has_root() {
                    out.push("..");
                }
            }
            Component::Normal(part) => out.push(part),
        }
    }
    out
}

pub fn resolve(base: &Path, relative: &str) -> PathBuf {
    let joined = if Path::new(relative).is_absolute() {
        PathBuf::from(relative)
    } else {
        base.join(relative)
    };
    let absolute = if joined.is_absolute() {
        joined
    } else {
        std::env::current_dir().unwrap_or_default().join(joined)
    };
    let normalized = normalize(&absolute);
    strip_trailing_separator(normalized)
}

fn strip_trailing_separator(path: PathBuf) -> PathBuf {
    let text = path.to_string_lossy();
    if text.len() > 1 && (text.ends_with('/') || text.ends_with('\\')) {
        PathBuf::from(text.trim_end_matches(['/', '\\']).to_string())
    } else {
        path
    }
}

pub fn dirname(path: &str) -> String {
    let path_buf = Path::new(path);
    match path_buf.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent.to_string_lossy().into_owned(),
        Some(_) => ".".to_string(),
        None => path.to_string(),
    }
}

pub fn basename(path: &str) -> String {
    let trimmed = path.trim_end_matches(['/', '\\']);
    match trimmed.rfind(['/', '\\']) {
        Some(index) => trimmed[index + 1..].to_string(),
        None => trimmed.to_string(),
    }
}

pub fn extname(path: &str) -> String {
    let base = basename(path);
    match base.rfind('.') {
        Some(0) | None => String::new(),
        Some(index) => base[index..].to_string(),
    }
}

pub fn relative(from: &str, to: &str) -> String {
    let from = normalize(Path::new(from));
    let to = normalize(Path::new(to));
    let from_parts: Vec<Component> = from.components().collect();
    let to_parts: Vec<Component> = to.components().collect();
    let mut common = 0;
    while common < from_parts.len()
        && common < to_parts.len()
        && from_parts[common] == to_parts[common]
    {
        common += 1;
    }
    let mut out = PathBuf::new();
    for _ in common..from_parts.len() {
        out.push("..");
    }
    for part in &to_parts[common..] {
        out.push(part.as_os_str());
    }
    out.to_string_lossy().into_owned()
}

pub fn is_file(path: &Path) -> bool {
    std::fs::metadata(path)
        .map(|meta| meta.is_file())
        .unwrap_or(false)
}

pub fn is_dir(path: &Path) -> bool {
    std::fs::metadata(path)
        .map(|meta| meta.is_dir())
        .unwrap_or(false)
}

pub fn exists(path: &Path) -> bool {
    std::fs::metadata(path).is_ok()
}
