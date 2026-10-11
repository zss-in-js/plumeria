use super::*;

#[test]
fn unchanged_files_skip_reads_and_extraction() {
    let dir = std::env::temp_dir().join(format!(
        "plumeria-cache-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let dir = std::fs::canonicalize(dir).unwrap();
    let a = dir.join("a.tsx").to_string_lossy().into_owned();
    let b = dir.join("b.tsx").to_string_lossy().into_owned();
    let source = |color: &str| {
        format!(
            "import * as css from '@plumeria/core'; const s = css.create({{ box: {{ color: '{color}' }} }}); export const Box = () => <div classStyle={{s.box}} />;"
        )
    };
    std::fs::write(&a, source("red")).unwrap();
    std::fs::write(&b, source("green")).unwrap();
    let options = CompileOptions {
        cwd: dir.to_string_lossy().into_owned(),
        include: vec!["**/*.tsx".into()],
        exclude: vec![],
        style_prop: "classStyle".into(),
        policy: None,
        sources: FxHashMap::default(),
    };
    let mut project = Project::default();
    let first = compile_css(&mut project, &options).unwrap();
    assert_eq!(project.css_cache.extractions, 2);
    assert_eq!(crate::fs::source::read_count(&a), 1);
    assert_eq!(crate::fs::source::read_count(&b), 1);
    assert_eq!(compile_css(&mut project, &options).unwrap(), first);
    assert_eq!(project.css_cache.extractions, 2);
    assert_eq!(crate::fs::source::read_count(&a), 1);
    assert_eq!(crate::fs::source::read_count(&b), 1);
    std::fs::write(&a, source("purple")).unwrap();
    let edited = compile_css(&mut project, &options).unwrap();
    assert!(edited.contains("purple"));
    assert!(!edited.contains("red"));
    assert_eq!(project.css_cache.extractions, 3);
    assert_eq!(crate::fs::source::read_count(&a), 2);
    assert_eq!(crate::fs::source::read_count(&b), 1);
    assert_eq!(
        edited,
        compile_css(&mut Project::default(), &options).unwrap()
    );
    std::fs::remove_dir_all(dir).unwrap();
}

#[test]
fn overlays_are_restored_after_a_later_file_fails() {
    let dir = std::env::temp_dir().join(format!(
        "plumeria-restore-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    std::fs::create_dir_all(&dir).unwrap();
    let dir = std::fs::canonicalize(dir).unwrap();
    let a = dir.join("a.tsx").to_string_lossy().into_owned();
    let b = dir.join("b.tsx").to_string_lossy().into_owned();
    let source = |color: &str| {
        format!(
            "import * as css from '@plumeria/core'; const theme = css.createTheme(':root', {{ primary: '{color}' }}); const sizes = css.createStatic({{ gap: 4 }}); const styles = css.create({{ box: {{ color: theme.primary, padding: sizes.gap }} }}); export const Box = () => <div classStyle={{styles.box}} />;"
        )
    };
    std::fs::write(&a, source("red")).unwrap();
    std::fs::write(&b, source("blue")).unwrap();
    let mut options = CompileOptions {
        cwd: dir.to_string_lossy().into_owned(),
        include: vec!["**/*.tsx".into()],
        exclude: vec![],
        style_prop: "classStyle".into(),
        policy: None,
        sources: FxHashMap::default(),
    };
    let mut project = Project::default();
    let initial = compile_css(&mut project, &options).unwrap();
    let original = project.tables.clone();
    options.sources.insert(a.clone(), source("green"));
    options.sources.insert(b, "export const broken = ;".into());
    assert!(compile_css(&mut project, &options).is_err());
    macro_rules! check {
        ($($field:ident),+) => { $(assert_eq!(project.tables.$field, original.$field);)+ };
    }
    check!(
        theme_hash,
        theme_obj,
        theme_selector,
        static_hash,
        static_obj,
        keyframes_obj,
        view_transition_obj,
        create_obj,
        atomic_map
    );
    options.sources.clear();
    assert_eq!(compile_css(&mut project, &options).unwrap(), initial);
    std::fs::remove_dir_all(dir).unwrap();
}
