use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use rustc_hash::{FxHashMap, FxHashSet};

use super::{ImportRecord, Ordered, Project, Stamp, stat};
use crate::eval::consts::{collect_local_const_nodes, collect_local_consts};
use crate::eval::{Env, Evaluator};
use crate::js::{Object, Value};
use crate::syntax::expr::{E, K, Prop, unwrap};
use crate::syntax::module::{CORE, SpecKind, import_specs};
use crate::syntax::parse::parse_program;

#[derive(Clone)]
pub struct ConstFile {
    stamp: Stamp,
    values: Object,
    imports: Ordered<ImportRecord>,
}

fn read_const_file(path: &str) -> Option<ConstFile> {
    let stamp = stat(path)?.stamp;
    let source = std::fs::read_to_string(path).ok()?;
    let allocator = Allocator::default();
    let program = parse_program(&allocator, &source).ok()?;
    let mut values = collect_local_consts(&program);
    let mut imports: Ordered<ImportRecord> = Ordered::default();
    let mut create_static_names: FxHashSet<String> = FxHashSet::default();
    let mut namespaces: FxHashSet<String> = FxHashSet::default();
    for statement in &program.body {
        let Statement::ImportDeclaration(decl) = statement else {
            continue;
        };
        let source = decl.source.value.to_string();
        for spec in import_specs(decl) {
            let imported_name = match spec.kind {
                SpecKind::Named => spec.imported.clone(),
                SpecKind::Default => "default".to_string(),
                SpecKind::Namespace => "*".to_string(),
            };
            imports.insert(
                spec.local.to_string(),
                ImportRecord {
                    source: source.clone(),
                    imported_name: imported_name.clone(),
                },
            );
            if source != CORE {
                continue;
            }
            if imported_name == "createStatic" {
                create_static_names.insert(spec.local.to_string());
            } else if imported_name == "*" || imported_name == "default" {
                namespaces.insert(spec.local.to_string());
            }
        }
    }
    for (name, node) in collect_local_const_nodes(&program) {
        let init = unwrap(E::new(node));
        let K::Call(call) = init.kind() else { continue };
        let callee = E::new(&call.callee);
        let is_create_static = match callee.kind() {
            K::Ident(ident) => create_static_names.contains(ident.name.as_str()),
            K::Member(_) => {
                callee
                    .object()
                    .and_then(|object| object.ident_name())
                    .is_some_and(|object| namespaces.contains(object))
                    && matches!(callee.prop(), Some(Prop::Name("createStatic")))
            }
            _ => false,
        };
        let argument = call
            .arguments
            .first()
            .map(|argument| unwrap(crate::eval::argument_expr(argument)));
        let Some(K::Object(object)) = argument.map(|a| a.kind()) else {
            continue;
        };
        if !is_create_static {
            continue;
        }
        let snapshot = values.clone();
        match Evaluator::new(Env::statics_only(&snapshot)).object(object) {
            Ok(obj) => values.insert(name, Value::obj(obj)),
            Err(_) => continue,
        }
    }
    for statement in &program.body {
        let Statement::ExportDefaultDeclaration(export) = statement else {
            continue;
        };
        let Some(expression) = export.declaration.as_expression() else {
            continue;
        };
        let expression = unwrap(E::new(expression));
        match expression.kind() {
            K::Str(value) => values.insert("default", Value::str(value.value.as_str())),
            K::Num(value) => values.insert("default", Value::Num(value.value)),
            K::Ident(ident) => {
                if let Some(value) = values.get(ident.name.as_str()).cloned() {
                    values.insert("default", value);
                }
            }
            _ => {}
        }
    }
    Some(ConstFile {
        stamp,
        values,
        imports,
    })
}

#[derive(Default)]
pub struct ConstCache {
    files: FxHashMap<String, ConstFile>,
}

impl Project {
    fn const_file(&mut self, path: &str) -> Option<ConstFile> {
        let stamp = stat(path)?.stamp;
        if let Some(cached) = self.const_cache.files.get(path)
            && cached.stamp == stamp
        {
            return Some(cached.clone());
        }
        let file = read_const_file(path)?;
        self.const_cache
            .files
            .insert(path.to_string(), file.clone());
        Some(file)
    }

    pub fn resolve_export_value(&mut self, file: &str, export_name: &str) -> Option<Value> {
        let mut visited: FxHashSet<String> = FxHashSet::default();
        let mut file = file.to_string();
        let mut name = export_name.to_string();
        while visited.insert(format!("{file}-{name}")) {
            let site = self.resolve_export(&file, &name).unwrap_or(super::Site {
                file: file.clone(),
                local_name: name.clone(),
            });
            let loaded = self.const_file(&site.file)?;
            if let Some(value) = loaded.values.get(&site.local_name) {
                return Some(value.clone());
            }
            let imported = loaded.imports.get(&site.local_name)?.clone();
            if imported.imported_name == "*" {
                return None;
            }
            let actual = self.resolve_import_path(&imported.source, &site.file)?;
            file = actual;
            name = imported.imported_name;
        }
        None
    }
}
