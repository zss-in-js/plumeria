pub mod inline;
pub mod pass;
pub mod tables;
pub mod values;

use std::path::Path;
use std::sync::{Mutex, OnceLock};
use std::time::UNIX_EPOCH;

use indexmap::{IndexMap, IndexSet};
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use rustc_hash::{FxBuildHasher, FxHashMap, FxHashSet};

use crate::filter::needs_compile;
use crate::fs::glob::{GlobOptions, glob_sync};
use crate::fs::path::resolve;
use crate::fs::resolver::Resolver;
use crate::js::cmp_utf16;
use crate::syntax::module::{CORE, import_specs, module_export_name};
use crate::syntax::parse::parse_program;
pub use tables::{Condition, KeyTable, ObjectTable, Ordered, PropsTable, TableEntry, Tables};

pub const DEFAULT_STYLE_PROP: &str = "classStyle";
const DIAGNOSTIC_PREFIX: &str = "[plumeria] ";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Stamp(u128);

#[derive(Clone, Copy)]
pub struct Stat {
    pub stamp: Stamp,
    pub is_file: bool,
}

pub fn stat(path: &str) -> Option<Stat> {
    let meta = std::fs::metadata(path).ok()?;
    let stamp = meta
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    Some(Stat {
        stamp: Stamp(stamp),
        is_file: meta.is_file(),
    })
}

#[derive(Clone, Debug)]
pub struct ReExport {
    pub source: Option<String>,
    pub local_name: String,
}

#[derive(Clone, Debug)]
pub struct ImportRecord {
    pub source: String,
    pub imported_name: String,
}

#[derive(Clone, Debug, Default)]
pub struct Exports {
    pub local_exports: Vec<String>,
    pub re_exports: Ordered<ReExport>,
    pub star_exports: Vec<String>,
    pub imports: Ordered<ImportRecord>,
}

#[derive(Clone, Debug, Default)]
pub struct CachedFile {
    pub mtime: Option<Stamp>,
    pub exports_mtime: Option<Stamp>,
    pub dependencies: Option<Vec<String>>,
    pub exports: Option<Exports>,
    pub unresolved_imports: Option<Vec<String>>,
    pub object_keys: FxHashMap<ObjectTable, FxHashSet<String>>,
    pub component_props: Option<PropsTable>,
    pub has_css_usage: bool,
}

#[derive(Clone, Debug)]
pub struct LocalImport {
    pub actual_path: String,
    pub imported_name: String,
}

pub type LocalImports = Ordered<LocalImport>;

#[derive(Clone, Debug)]
pub struct Site {
    pub file: String,
    pub local_name: String,
}

#[derive(Default)]
pub struct Project {
    pub tables: Tables,
    pub files: FxHashMap<String, CachedFile>,
    receiver_keys_by_file: FxHashMap<String, Vec<String>>,
    dependents: FxHashMap<String, IndexSet<String, FxBuildHasher>>,
    known_files: FxHashSet<String>,
    pub file_errors: FxHashMap<String, String>,
    has_computed_once: bool,
    resolution_stamp: Option<String>,
    scanned_cwd: Option<String>,
    scanned_style_prop: Option<String>,
    object_owners: FxHashMap<(ObjectTable, String), FxHashSet<String>>,
    file_object_contributions:
        FxHashMap<String, IndexMap<ObjectTable, IndexSet<String, FxBuildHasher>, FxBuildHasher>>,
    file_key_contributions:
        FxHashMap<String, IndexMap<KeyTable, IndexSet<String, FxBuildHasher>, FxBuildHasher>>,
    stat_memo: Option<FxHashMap<String, Option<Stat>>>,
    pub resolver: Resolver,
    const_cache: values::ConstCache,
}

pub fn project() -> &'static Mutex<Project> {
    static PROJECT: OnceLock<Mutex<Project>> = OnceLock::new();
    PROJECT.get_or_init(|| Mutex::new(Project::default()))
}

pub fn lock_project() -> std::sync::MutexGuard<'static, Project> {
    project()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn is_production() -> bool {
    std::env::var("NODE_ENV").is_ok_and(|value| value == "production")
}

impl Project {
    pub fn resolve_import_path(&mut self, import_path: &str, importer: &str) -> Option<String> {
        self.resolver.resolve_import_path(import_path, importer)
    }

    fn stat_file(&mut self, path: &str) -> Option<Stat> {
        if let Some(memo) = &mut self.stat_memo {
            if let Some(result) = memo.get(path) {
                return *result;
            }
            let result = stat(path);
            memo.insert(path.to_string(), result);
            return result;
        }
        stat(path)
    }

    fn record_file_error(&mut self, file: &str, message: String) {
        let message = message
            .strip_prefix(DIAGNOSTIC_PREFIX)
            .map(str::to_string)
            .unwrap_or(message);
        self.file_errors.insert(file.to_string(), message);
    }

    pub fn resolve_file_error(
        &mut self,
        actual_path: &str,
        imported_name: &str,
    ) -> Option<(String, String)> {
        let resolved = self.resolve_export(actual_path, imported_name);
        let mut candidates = Vec::new();
        if let Some(site) = resolved {
            candidates.push(site.file);
        }
        candidates.push(actual_path.to_string());
        for file in candidates {
            if let Some(message) = self.file_errors.get(&file)
                && !message.is_empty()
            {
                return Some((file, message.clone()));
            }
        }
        None
    }

    fn update_dependency_edges(
        &mut self,
        file: &str,
        old: Option<&[String]>,
        new: Option<&[String]>,
    ) {
        if let Some(old) = old {
            for dep in old {
                if let Some(set) = self.dependents.get_mut(dep) {
                    set.shift_remove(file);
                }
            }
        }
        if let Some(new) = new {
            for dep in new {
                self.dependents
                    .entry(dep.clone())
                    .or_default()
                    .insert(file.to_string());
            }
        }
    }

    pub fn file_table_keys(&self, file: &str, table: KeyTable) -> Vec<String> {
        self.file_key_contributions
            .get(file)
            .and_then(|tables| tables.get(&table))
            .map(|keys| keys.iter().cloned().collect())
            .unwrap_or_default()
    }

    pub fn register_file_key(&mut self, table: KeyTable, key: &str, file: &str) {
        self.file_key_contributions
            .entry(file.to_string())
            .or_default()
            .entry(table)
            .or_default()
            .insert(key.to_string());
    }

    pub fn register_object_owner(&mut self, table: ObjectTable, hash: &str, file: &str) {
        self.file_object_contributions
            .entry(file.to_string())
            .or_default()
            .entry(table)
            .or_default()
            .insert(hash.to_string());
        self.object_owners
            .entry((table, hash.to_string()))
            .or_default()
            .insert(file.to_string());
    }

    fn release_object_owner(&mut self, table: ObjectTable, hash: &str, file: &str) {
        let key = (table, hash.to_string());
        let Some(owners) = self.object_owners.get_mut(&key) else {
            return;
        };
        owners.remove(file);
        if owners.is_empty() {
            self.object_owners.remove(&key);
            self.tables.remove_object(table, hash);
        }
    }

    fn release_file_objects(&mut self, file: &str) {
        let Some(contributions) = self.file_object_contributions.remove(file) else {
            return;
        };
        for (table, hashes) in contributions {
            for hash in hashes {
                self.release_object_owner(table, &hash, file);
            }
        }
    }

    fn strip_file_contributions(&mut self, file: &str, component_props: Option<&PropsTable>) {
        self.release_file_objects(file);
        if let Some(keys) = self.receiver_keys_by_file.remove(file) {
            for key in keys {
                self.tables.style_receiver.shift_remove(&key);
            }
        }
        if let Some(contributions) = self.file_key_contributions.remove(file) {
            for (table, keys) in contributions {
                for key in keys {
                    self.tables.remove_key(table, &key);
                }
            }
        }
        if let Some(local) = component_props {
            for (comp_key, props) in local {
                let Some(prop_table) = self.tables.component_props.get_mut(comp_key) else {
                    continue;
                };
                for prop_name in props.keys() {
                    let Some(entries) = prop_table.get_mut(prop_name) else {
                        continue;
                    };
                    entries.retain(|entry| entry.file != file);
                    if entries.is_empty() {
                        prop_table.shift_remove(prop_name);
                    }
                }
                if prop_table.is_empty() {
                    self.tables.component_props.shift_remove(comp_key);
                }
            }
        }
    }

    pub fn get_file_dependencies(&self, file: &str) -> Vec<String> {
        let mut visited: FxHashSet<String> = FxHashSet::default();
        let mut deps: IndexSet<String, FxBuildHasher> = IndexSet::default();
        let mut stack: Vec<(String, usize)> = vec![(file.to_string(), 0)];
        visited.insert(file.to_string());
        while let Some((current, index)) = stack.pop() {
            let list = self
                .files
                .get(&current)
                .and_then(|cached| cached.dependencies.as_ref());
            let Some(list) = list else { continue };
            if index >= list.len() {
                continue;
            }
            let dep = list[index].clone();
            stack.push((current, index + 1));
            deps.insert(dep.clone());
            if visited.insert(dep.clone()) {
                stack.push((dep, 0));
            }
        }
        deps.into_iter().collect()
    }

    pub fn scan_overlay(&mut self, cwd: &str, style_prop: &str) {
        self.scan_all(cwd, style_prop);
    }

    pub fn scan_all(&mut self, cwd: &str, style_prop: &str) {
        self.stat_memo = Some(FxHashMap::default());
        self.run_scan(cwd, style_prop);
        self.stat_memo = None;
    }

    fn run_scan(&mut self, scan_cwd: &str, style_prop: &str) {
        let cwd = resolve(&std::env::current_dir().unwrap_or_default(), scan_cwd)
            .to_string_lossy()
            .into_owned();
        if self.has_computed_once
            && is_production()
            && self.scanned_cwd.as_deref() == Some(cwd.as_str())
            && self.scanned_style_prop.as_deref() == Some(style_prop)
        {
            return;
        }

        self.scanned_cwd = Some(cwd.clone());
        let style_prop_changed = self
            .scanned_style_prop
            .as_deref()
            .is_some_and(|previous| previous != style_prop);
        self.scanned_style_prop = Some(style_prop.to_string());

        let config_path = Path::new(&cwd)
            .join("tsconfig.json")
            .to_string_lossy()
            .into_owned();
        let mut config_stamp = config_path.clone();
        if let Some(stat) = stat(&config_path) {
            config_stamp.push_str(&format!(":{}", stat.stamp.0));
        }
        let resolution_changed = self
            .resolution_stamp
            .as_ref()
            .is_some_and(|previous| *previous != config_stamp);
        if self.resolution_stamp.as_deref() != Some(config_stamp.as_str()) {
            self.resolver.reset(Path::new(&cwd));
        }
        self.resolution_stamp = Some(config_stamp);

        let root = {
            let segments: Vec<&str> = cwd.split(std::path::MAIN_SEPARATOR).collect();
            match segments
                .iter()
                .position(|segment| *segment == "node_modules")
            {
                None => cwd.clone(),
                Some(index) => {
                    let joined = segments[..index].join(std::path::MAIN_SEPARATOR_STR);
                    if joined.is_empty() {
                        std::path::MAIN_SEPARATOR_STR.to_string()
                    } else {
                        joined
                    }
                }
            }
        };
        let pattern = Path::new(&root)
            .join("**/*.{js,jsx,ts,tsx}")
            .to_string_lossy()
            .into_owned();
        let exclude = vec![
            "**/node_modules/**".to_string(),
            "**/dist/**".to_string(),
            "**/build/**".to_string(),
            "**/.next/**".to_string(),
        ];
        let mut files = glob_sync(
            &[pattern],
            GlobOptions {
                cwd: Path::new(&root),
                exclude: &exclude,
                expected_files: self.known_files.len(),
            },
        )
        .unwrap_or_default();
        files.sort_by(|a, b| cmp_utf16(a, b));
        let current_files: FxHashSet<String> = files.iter().cloned().collect();

        let deleted: Vec<String> = self
            .known_files
            .iter()
            .filter(|file| !current_files.contains(*file))
            .cloned()
            .collect();
        let appeared = files.iter().any(|file| !self.known_files.contains(file));
        self.known_files = current_files.clone();

        let mut invalidated: IndexSet<String, FxBuildHasher> = IndexSet::default();
        let mut queue: Vec<String> = Vec::new();
        let invalidate = |file: &str,
                          invalidated: &mut IndexSet<String, FxBuildHasher>,
                          queue: &mut Vec<String>| {
            invalidated.insert(file.to_string());
            queue.push(file.to_string());
        };

        let stats: Vec<Option<Stat>> = if files.len() < 512 {
            files.iter().map(|file| stat(file)).collect()
        } else {
            use rayon::prelude::*;
            crate::fs::glob::pool(files.len())
                .install(|| files.par_iter().map(|file| stat(file)).collect())
        };
        for (file, stat) in files.iter().zip(stats) {
            match stat {
                Some(stat) => {
                    let cached = self.files.get(file);
                    if resolution_changed
                        || style_prop_changed
                        || cached.is_none()
                        || cached.and_then(|c| c.mtime) != Some(stat.stamp)
                    {
                        invalidate(file, &mut invalidated, &mut queue);
                    }
                }
                None => invalidate(file, &mut invalidated, &mut queue),
            }
        }
        let dependency_keys: Vec<String> = self.dependents.keys().cloned().collect();
        for dependency in dependency_keys {
            if current_files.contains(&dependency) {
                continue;
            }
            let Some(cached) = self.files.get(&dependency) else {
                continue;
            };
            let recorded = cached.exports_mtime.or(cached.mtime);
            let changed = match stat(&dependency) {
                Some(stat) => recorded != Some(stat.stamp),
                None => true,
            };
            if changed {
                invalidate(&dependency, &mut invalidated, &mut queue);
            }
        }
        for file in &deleted {
            invalidate(file, &mut invalidated, &mut queue);
        }

        if appeared {
            let entries: Vec<(String, Vec<String>)> = self
                .files
                .iter()
                .filter(|(file, cached)| {
                    !invalidated.contains(*file)
                        && current_files.contains(*file)
                        && cached
                            .unresolved_imports
                            .as_ref()
                            .is_some_and(|list| !list.is_empty())
                })
                .map(|(file, cached)| {
                    (
                        file.clone(),
                        cached.unresolved_imports.clone().unwrap_or_default(),
                    )
                })
                .collect();
            for (file, unresolved) in entries {
                let resolves = unresolved
                    .iter()
                    .any(|specifier| self.resolve_import_path(specifier, &file).is_some());
                if resolves {
                    invalidate(&file, &mut invalidated, &mut queue);
                }
            }
        }

        let mut head = 0;
        while head < queue.len() {
            let file = queue[head].clone();
            head += 1;
            if let Some(dependents) = self.dependents.get(&file) {
                for dependent in dependents.clone() {
                    if !invalidated.contains(&dependent) {
                        invalidated.insert(dependent.clone());
                        queue.push(dependent);
                    }
                }
            }
        }

        if invalidated.is_empty() && self.has_computed_once {
            return;
        }

        for file in &deleted {
            let cached = self.files.get(file).cloned();
            if let Some(cached) = &cached {
                self.strip_file_contributions(file, cached.component_props.as_ref());
            }
            let old = cached.as_ref().and_then(|c| c.dependencies.clone());
            self.update_dependency_edges(file, old.as_deref(), None);
            self.files.remove(file);
            self.file_errors.remove(file);
        }

        let uncached: Vec<String> = files
            .iter()
            .filter(|file| invalidated.contains(*file))
            .cloned()
            .collect();
        for file in &uncached {
            self.file_errors.remove(file);
            if let Some(cached) = self.files.get(file).cloned() {
                self.strip_file_contributions(file, cached.component_props.as_ref());
            }
        }

        let mut sources: Vec<(String, String, Stamp)> = Vec::new();
        for file in &uncached {
            let Some(stat) = stat(file) else {
                self.record_file_error(
                    file,
                    format!("ENOENT: no such file or directory, stat '{file}'"),
                );
                continue;
            };
            let source = match std::fs::read_to_string(file) {
                Ok(source) => source,
                Err(error) => {
                    self.record_file_error(file, error.to_string());
                    continue;
                }
            };
            if !needs_compile(&source, style_prop, file) {
                let old = self
                    .files
                    .get(file)
                    .and_then(|cached| cached.dependencies.clone());
                self.update_dependency_edges(file, old.as_deref(), None);
                self.files.insert(
                    file.clone(),
                    CachedFile {
                        mtime: Some(stat.stamp),
                        ..CachedFile::default()
                    },
                );
                continue;
            }
            sources.push((file.clone(), source, stat.stamp));
        }

        let allocators: Vec<Allocator> = sources.iter().map(|_| Allocator::default()).collect();
        let mut parsed: Vec<(usize, Program)> = Vec::new();
        for (index, ((file, source, _), allocator)) in
            sources.iter().zip(allocators.iter()).enumerate()
        {
            match parse_program(allocator, source) {
                Ok(program) => parsed.push((index, program)),
                Err(message) => self.record_file_error(file, message),
            }
        }

        for (index, program) in &parsed {
            let (file, _, stamp) = &sources[*index];
            self.extract_and_cache_exports(file, program, *stamp);
        }

        let by_path: FxHashMap<&str, usize> = parsed
            .iter()
            .enumerate()
            .map(|(position, (index, _))| (sources[*index].0.as_str(), position))
            .collect();
        let mut ordered: Vec<usize> = Vec::new();
        let mut visited: FxHashSet<usize> = FxHashSet::default();
        for position in 0..parsed.len() {
            self.visit_scan_order(
                position,
                &parsed,
                &sources,
                &by_path,
                &mut visited,
                &mut ordered,
            );
        }

        let mut jsx_queue: Vec<pass::JsxPhase> = Vec::new();
        let mut consts_cache: FxHashMap<usize, crate::js::Object> = FxHashMap::default();
        for pass_number in 1..=2 {
            let first_pass = pass_number == 1;
            for position in &ordered {
                let (index, program) = &parsed[*position];
                let (file, source, stamp) = &sources[*index];
                self.file_errors.remove(file);
                let consts = consts_cache
                    .entry(*position)
                    .or_insert_with(|| crate::eval::consts::collect_local_consts(program));
                let consts = consts.clone();
                match pass::scan_file_pass(
                    self,
                    file,
                    source,
                    program,
                    &allocators[*index],
                    first_pass,
                    &consts,
                ) {
                    Ok(Some(mut state)) => {
                        state.position = *position;
                        state.mtime = *stamp;
                        jsx_queue.push(state);
                    }
                    Ok(None) => {}
                    Err(message) => self.record_file_error(file, message),
                }
            }
        }

        let mut completed: Vec<String> = Vec::new();
        for state in jsx_queue {
            let (index, program) = &parsed[state.position];
            let (file, _, _) = &sources[*index];
            self.file_errors.remove(file);
            let consts = consts_cache
                .get(&state.position)
                .cloned()
                .unwrap_or_default();
            let file = file.clone();
            match pass::jsx_phase(self, &file, program, &allocators[*index], state, &consts) {
                Ok(()) => completed.push(file),
                Err(message) => self.record_file_error(&file, message),
            }
        }

        for file in &completed {
            let Some(cached) = self.files.get(file) else {
                continue;
            };
            if !cached.has_css_usage || self.file_errors.contains_key(file) {
                continue;
            }
            let own = cached.object_keys.clone();
            let Some(contributions) = self.file_object_contributions.get(file).cloned() else {
                continue;
            };
            for (table, hashes) in contributions {
                for hash in hashes {
                    let present = own.get(&table).is_some_and(|keys| keys.contains(&hash));
                    if !present {
                        self.release_object_owner(table, &hash, file);
                        if let Some(set) = self
                            .file_object_contributions
                            .get_mut(file)
                            .and_then(|t| t.get_mut(&table))
                        {
                            set.shift_remove(&hash);
                        }
                    }
                }
            }
        }

        for props in self.tables.component_props.values_mut() {
            for entries in props.values_mut() {
                entries.sort_by(|a, b| {
                    cmp_utf16(&a.file, &b.file).then(a.span_start.cmp(&b.span_start))
                });
            }
        }
        self.has_computed_once = true;
    }

    fn visit_scan_order(
        &self,
        position: usize,
        parsed: &[(usize, Program)],
        sources: &[(String, String, Stamp)],
        by_path: &FxHashMap<&str, usize>,
        visited: &mut FxHashSet<usize>,
        ordered: &mut Vec<usize>,
    ) {
        if !visited.insert(position) {
            return;
        }
        let file = &sources[parsed[position].0].0;
        for dependency in self.get_file_dependencies(file) {
            if let Some(next) = by_path.get(dependency.as_str()) {
                self.visit_scan_order(*next, parsed, sources, by_path, visited, ordered);
            }
        }
        ordered.push(position);
    }

    pub fn extract_and_cache_exports(&mut self, file: &str, program: &Program, stamp: Stamp) {
        let mut local_exports: Vec<String> = Vec::new();
        let mut re_exports: Ordered<ReExport> = Ordered::default();
        let mut star_exports: Vec<String> = Vec::new();
        let mut dependencies: IndexSet<String, FxBuildHasher> = IndexSet::default();
        let mut unresolved: Vec<String> = Vec::new();
        let mut imports: Ordered<ImportRecord> = Ordered::default();

        for statement in &program.body {
            if let Statement::ImportDeclaration(decl) = statement {
                let source = decl.source.value.to_string();
                for spec in import_specs(decl) {
                    imports.insert(
                        spec.local.to_string(),
                        ImportRecord {
                            source: source.clone(),
                            imported_name: spec.imported.clone(),
                        },
                    );
                }
            }
        }

        let track = |this: &mut Project,
                     source: &str,
                     dependencies: &mut IndexSet<String, FxBuildHasher>,
                     unresolved: &mut Vec<String>| {
            match this.resolve_import_path(source, file) {
                Some(actual) => {
                    dependencies.insert(actual);
                }
                None => {
                    if source != CORE {
                        unresolved.push(source.to_string());
                    }
                }
            }
        };

        for statement in &program.body {
            match statement {
                Statement::ImportDeclaration(decl) => {
                    track(
                        self,
                        decl.source.value.as_str(),
                        &mut dependencies,
                        &mut unresolved,
                    );
                }
                Statement::ExportDeclaration(export) => match &export.declaration {
                    Declaration::VariableDeclaration(decl) => {
                        for declarator in &decl.declarations {
                            if let BindingPattern::BindingIdentifier(ident) = &declarator.id {
                                local_exports.push(ident.name.to_string());
                            }
                        }
                    }
                    Declaration::FunctionDeclaration(function) => {
                        if let Some(id) = &function.id {
                            local_exports.push(id.name.to_string());
                        }
                    }
                    Declaration::ClassDeclaration(class) => {
                        if let Some(id) = &class.id {
                            local_exports.push(id.name.to_string());
                        }
                    }
                    _ => {}
                },
                Statement::ExportNamedDeclaration(export) => {
                    for spec in &export.specifiers {
                        let orig = module_export_name(&spec.local).to_string();
                        let exported = module_export_name(&spec.exported).to_string();
                        match imports.get(&orig) {
                            Some(imported) => re_exports.insert(
                                exported,
                                ReExport {
                                    source: Some(imported.source.clone()),
                                    local_name: imported.imported_name.clone(),
                                },
                            ),
                            None => re_exports.insert(
                                exported,
                                ReExport {
                                    source: None,
                                    local_name: orig,
                                },
                            ),
                        };
                    }
                }
                Statement::ExportFromDeclaration(export) => {
                    let source = export.source.value.to_string();
                    track(self, &source, &mut dependencies, &mut unresolved);
                    for spec in &export.specifiers {
                        let orig = module_export_name(&spec.local).to_string();
                        let exported = module_export_name(&spec.exported).to_string();
                        re_exports.insert(
                            exported,
                            ReExport {
                                source: Some(source.clone()),
                                local_name: orig,
                            },
                        );
                    }
                }
                Statement::ExportAllDeclaration(export) => {
                    let source = export.source.value.to_string();
                    if export.exported.is_none() {
                        star_exports.push(source.clone());
                    }
                    track(self, &source, &mut dependencies, &mut unresolved);
                }
                Statement::ExportDefaultDeclaration(export) => match &export.declaration {
                    ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
                        match &function.id {
                            Some(id) => {
                                re_exports.insert(
                                    "default".to_string(),
                                    ReExport {
                                        source: None,
                                        local_name: id.name.to_string(),
                                    },
                                );
                            }
                            None => local_exports.push("default".to_string()),
                        }
                    }
                    ExportDefaultDeclarationKind::ClassDeclaration(class) => match &class.id {
                        Some(id) => {
                            re_exports.insert(
                                "default".to_string(),
                                ReExport {
                                    source: None,
                                    local_name: id.name.to_string(),
                                },
                            );
                        }
                        None => local_exports.push("default".to_string()),
                    },
                    ExportDefaultDeclarationKind::TSInterfaceDeclaration(_) => {
                        local_exports.push("default".to_string());
                    }
                    other => {
                        let expression = other.to_expression();
                        match expression {
                            Expression::Identifier(ident) => {
                                let name = ident.name.to_string();
                                match imports.get(&name) {
                                    Some(imported) => re_exports.insert(
                                        "default".to_string(),
                                        ReExport {
                                            source: Some(imported.source.clone()),
                                            local_name: imported.imported_name.clone(),
                                        },
                                    ),
                                    None => re_exports.insert(
                                        "default".to_string(),
                                        ReExport {
                                            source: None,
                                            local_name: name,
                                        },
                                    ),
                                };
                            }
                            _ => local_exports.push("default".to_string()),
                        }
                    }
                },
                _ => {}
            }
        }

        let new_deps: Vec<String> = dependencies.into_iter().collect();
        let previous = self
            .files
            .get(file)
            .and_then(|cached| cached.dependencies.clone());
        self.update_dependency_edges(file, previous.as_deref(), Some(&new_deps));

        let exports = Exports {
            local_exports,
            re_exports,
            star_exports,
            imports,
        };
        let entry = self
            .files
            .entry(file.to_string())
            .or_insert_with(|| CachedFile {
                mtime: Some(stamp),
                ..CachedFile::default()
            });
        entry.exports = Some(exports);
        entry.dependencies = Some(new_deps);
        entry.unresolved_imports = Some(unresolved);
        entry.exports_mtime = Some(stamp);
    }

    pub fn resolve_export(&mut self, file: &str, export_name: &str) -> Option<Site> {
        let mut visited: FxHashSet<String> = FxHashSet::default();
        self.resolve_export_inner(file, export_name, &mut visited)
    }

    fn resolve_export_inner(
        &mut self,
        file: &str,
        export_name: &str,
        visited: &mut FxHashSet<String>,
    ) -> Option<Site> {
        if !visited.insert(format!("{file}-{export_name}")) {
            return None;
        }
        if let Some(stat) = self.stat_file(file) {
            let stale = match self.files.get(file) {
                Some(cached) => {
                    cached.exports.is_none() || cached.exports_mtime != Some(stat.stamp)
                }
                None => true,
            };
            if stale
                && stat.is_file
                && let Ok(source) = std::fs::read_to_string(file)
            {
                let allocator = Allocator::default();
                if let Ok(program) = parse_program(&allocator, &source) {
                    self.extract_and_cache_exports(file, &program, stat.stamp);
                }
            }
        }
        let re_export = self
            .files
            .get(file)?
            .exports
            .as_ref()?
            .re_exports
            .get(export_name)
            .cloned();

        if let Some(re_export) = re_export {
            match &re_export.source {
                Some(source) => {
                    if let Some(actual) = self.resolve_import_path(source, file) {
                        return self.resolve_export_inner(&actual, &re_export.local_name, visited);
                    }
                }
                None => {
                    let local = re_export.local_name.clone();
                    return self
                        .resolve_export_inner(file, &local, visited)
                        .or(Some(Site {
                            file: file.to_string(),
                            local_name: local,
                        }));
                }
            }
        }

        let exports = self.files.get(file)?.exports.as_ref()?;
        if exports.local_exports.iter().any(|name| name == export_name) {
            return Some(Site {
                file: file.to_string(),
                local_name: export_name.to_string(),
            });
        }

        let star_exports = exports.star_exports.clone();
        for source in &star_exports {
            if let Some(actual) = self.resolve_import_path(source, file)
                && let Some(site) = self.resolve_export_inner(&actual, export_name, visited)
            {
                return Some(site);
            }
        }
        None
    }

    pub fn resolve_binding(
        &mut self,
        file: &str,
        name: &str,
        local_imports: &LocalImports,
    ) -> Site {
        let Some(imported) = local_imports.get(name) else {
            return Site {
                file: file.to_string(),
                local_name: name.to_string(),
            };
        };
        if imported.imported_name == "*" {
            return Site {
                file: imported.actual_path.clone(),
                local_name: name.to_string(),
            };
        }
        let (actual, imported_name) =
            (imported.actual_path.clone(), imported.imported_name.clone());
        self.resolve_export(&actual, &imported_name)
            .unwrap_or(Site {
                file: actual,
                local_name: imported_name,
            })
    }

    fn follow_import(&mut self, file: &str, name: &str) -> Option<Site> {
        let imported = self
            .files
            .get(file)?
            .exports
            .as_ref()?
            .imports
            .get(name)?
            .clone();
        if imported.imported_name == "*" {
            return None;
        }
        let actual = self.resolve_import_path(&imported.source, file)?;
        Some(
            self.resolve_export(&actual, &imported.imported_name)
                .unwrap_or(Site {
                    file: actual,
                    local_name: imported.imported_name,
                }),
        )
    }

    pub fn resolve_component_key(
        &mut self,
        name: &JSXElementName,
        file: &str,
        local_imports: &LocalImports,
    ) -> Option<String> {
        match name {
            JSXElementName::Identifier(ident) => {
                self.component_key_for_identifier(ident.name.as_str(), file, local_imports)
            }
            JSXElementName::IdentifierReference(ident) => {
                self.component_key_for_identifier(ident.name.as_str(), file, local_imports)
            }
            JSXElementName::MemberExpression(member) => {
                let mut links: Vec<String> = Vec::new();
                let mut current = &**member;
                let root = loop {
                    links.insert(0, current.property.name.to_string());
                    match &current.object {
                        JSXMemberExpressionObject::MemberExpression(inner) => current = inner,
                        JSXMemberExpressionObject::IdentifierReference(ident) => {
                            break ident.name.to_string();
                        }
                        JSXMemberExpressionObject::ThisExpression(_) => return None,
                    }
                };
                let mut site = self.resolve_binding(file, &root, local_imports);
                for link in links {
                    let next = self.resolve_export(&site.file, &link);
                    site = match next {
                        Some(next) => next,
                        None => self
                            .follow_import(&site.file.clone(), &link)
                            .unwrap_or(Site {
                                file: site.file.clone(),
                                local_name: link.clone(),
                            }),
                    };
                }
                Some(format!("{}-{}", site.file, site.local_name))
            }
            _ => None,
        }
    }

    fn component_key_for_identifier(
        &mut self,
        name: &str,
        file: &str,
        local_imports: &LocalImports,
    ) -> Option<String> {
        let first = name.chars().next()?;
        if first.to_uppercase().to_string() != first.to_string() {
            return None;
        }
        let site = self.resolve_binding(file, name, local_imports);
        Some(format!("{}-{}", site.file, site.local_name))
    }

    pub fn resolve_origin_error(
        &mut self,
        namespace_member: Option<&str>,
        root_name: Option<&str>,
        local_imports: &LocalImports,
    ) -> Option<(String, String)> {
        let root = root_name?;
        let origin = local_imports.get(root)?.clone();
        let export_name = if origin.imported_name == "*" {
            namespace_member.unwrap_or("*").to_string()
        } else {
            origin.imported_name.clone()
        };
        self.resolve_file_error(&origin.actual_path, &export_name)
    }
}
