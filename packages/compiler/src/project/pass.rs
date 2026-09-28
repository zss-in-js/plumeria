use std::sync::Arc;

use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_span::GetSpan;
use rustc_hash::{FxHashMap, FxHashSet};

use super::inline::Inliner;
use super::{
    Condition, KeyTable, LocalImport, LocalImports, ObjectTable, Project, PropsTable, Stamp,
    TableEntry,
};
use crate::engine::hash::hash_str;
use crate::engine::hash_object;
use crate::eval::consts::binding_name;
use crate::eval::functions::{StyleFunction, resolve_dynamic_style, style_functions_of};
use crate::eval::{Env, EvalResult, Evaluator, Lookup, argument_expr, resolve_theme_selector};
use crate::js::{Object, Value, deep_merge, entries_object};
use crate::style::records::{atom_class_string, atom_map};
use crate::style::theme::{theme_atomic_map, theme_hash_of};
use crate::syntax::expr::{BinOp, E, K, Prop, unwrap};
use crate::syntax::module::{
    Aliases, CORE, SpecKind, add_core_aliases, import_specs, plumeria_method,
};
use crate::syntax::parse::parse_object_text;
use crate::syntax::visit::{expression_has_identifier, jsx_openings};

type Map<V> = FxHashMap<String, V>;

#[derive(Default, Clone)]
pub struct LocalTables {
    pub statics: Object,
    pub keyframes_hash: Map<String>,
    pub keyframes_obj: Map<Value>,
    pub view_transition_hash: Map<String>,
    pub view_transition_obj: Map<Value>,
    pub theme_obj: Map<Value>,
    pub theme_selector: Map<String>,
    pub create_hash: Map<String>,
    pub create_obj: Map<Option<Value>>,
    pub atomic_map: Map<Value>,
    pub theme_hash: Map<String>,
    pub static_hash: Map<String>,
    pub static_obj: Map<Value>,
}

pub struct JsxPhase {
    pub position: usize,
    pub mtime: Stamp,
    pub local: LocalTables,
    pub local_imports: LocalImports,
    pub dependencies: Vec<String>,
}

struct Scoped<'c> {
    consts: &'c Object,
    statics: &'c Object,
}

impl Lookup<Value> for Scoped<'_> {
    fn lookup(&self, key: &str) -> Option<Value> {
        self.statics
            .get(key)
            .or_else(|| self.consts.get(key))
            .cloned()
    }
}

const STYLE_METHODS: &[&str] = &[
    "create",
    "createTheme",
    "createStatic",
    "keyframes",
    "viewTransition",
];

pub fn scan_file_pass<'b, 'a>(
    project: &mut Project,
    file: &str,
    source: &str,
    program: &'b Program<'a>,
    _allocator: &'a Allocator,
    first_pass: bool,
    consts: &Object,
) -> Result<Option<JsxPhase>, String> {
    let mut local = LocalTables::default();
    let mut aliases = Aliases::default();
    let mut local_imports = LocalImports::default();
    let mut dependencies: indexmap::IndexSet<String, rustc_hash::FxBuildHasher> =
        Default::default();

    for statement in &program.body {
        match statement {
            Statement::ImportDeclaration(decl) => {
                let source_value = decl.source.value.as_str();
                if source_value == CORE {
                    add_core_aliases(decl, &mut aliases);
                    continue;
                }
                let Some(actual) = project.resolve_import_path(source_value, file) else {
                    continue;
                };
                dependencies.insert(actual.clone());
                for spec in import_specs(decl) {
                    if spec.kind == SpecKind::Namespace {
                        local_imports.insert(
                            spec.local.to_string(),
                            LocalImport {
                                actual_path: actual.clone(),
                                imported_name: "*".to_string(),
                            },
                        );
                        continue;
                    }
                    let imported_name = spec.imported.clone();
                    let local_name = spec.local.to_string();
                    let resolved_key = match project.resolve_export(&actual, &imported_name) {
                        Some(site) => format!("{}-{}", site.file, site.local_name),
                        None => format!("{actual}-{imported_name}"),
                    };
                    local_imports.insert(
                        local_name.clone(),
                        LocalImport {
                            actual_path: actual.clone(),
                            imported_name: imported_name.clone(),
                        },
                    );
                    let tables = &project.tables;
                    if let Some(hash) = tables
                        .static_hash
                        .get(&resolved_key)
                        .filter(|h| !h.is_empty())
                    {
                        local.static_hash.insert(local_name.clone(), hash.clone());
                        if let Some(object) = tables.static_obj.get(hash) {
                            local.static_obj.insert(hash.clone(), object.clone());
                        }
                    }
                    if let Some(hash) = tables
                        .theme_hash
                        .get(&resolved_key)
                        .filter(|h| !h.is_empty())
                    {
                        local.theme_hash.insert(local_name.clone(), hash.clone());
                        if let Some(object) = tables.theme_obj.get(hash) {
                            local.theme_obj.insert(hash.clone(), object.clone());
                        }
                    }
                    if let Some(hash) = tables
                        .keyframes_hash
                        .get(&resolved_key)
                        .filter(|h| !h.is_empty())
                    {
                        local
                            .keyframes_hash
                            .insert(local_name.clone(), hash.clone());
                        if let Some(object) = tables.keyframes_obj.get(hash) {
                            local.keyframes_obj.insert(hash.clone(), object.clone());
                        }
                    }
                    if let Some(hash) = tables
                        .view_transition_hash
                        .get(&resolved_key)
                        .filter(|h| !h.is_empty())
                    {
                        local
                            .view_transition_hash
                            .insert(local_name.clone(), hash.clone());
                        if let Some(object) = tables.view_transition_obj.get(hash) {
                            local
                                .view_transition_obj
                                .insert(hash.clone(), object.clone());
                        }
                    }
                    if let Some(hash) = tables
                        .create_hash
                        .get(&resolved_key)
                        .filter(|h| !h.is_empty())
                    {
                        local.create_hash.insert(local_name.clone(), hash.clone());
                        let object = tables.create_obj.get(hash).cloned();
                        local.create_obj.insert(hash.clone(), object);
                    }
                }
            }
            Statement::ExportFromDeclaration(export) => {
                if let Some(actual) =
                    project.resolve_import_path(export.source.value.as_str(), file)
                {
                    dependencies.insert(actual);
                }
            }
            Statement::ExportAllDeclaration(export) => {
                if let Some(actual) =
                    project.resolve_import_path(export.source.value.as_str(), file)
                {
                    dependencies.insert(actual);
                }
            }
            _ => {}
        }
    }

    let mut initializers: FxHashMap<&str, &'b Expression<'a>> = FxHashMap::default();
    for statement in &program.body {
        let declaration = match statement {
            Statement::ExportDeclaration(export) => match &export.declaration {
                Declaration::VariableDeclaration(decl) => Some(&**decl),
                _ => None,
            },
            Statement::VariableDeclaration(decl) => Some(&**decl),
            _ => None,
        };
        let Some(declaration) = declaration else {
            continue;
        };
        if declaration.kind != VariableDeclarationKind::Const {
            continue;
        }
        for declarator in &declaration.declarations {
            if let (Some(name), Some(init)) = (binding_name(&declarator.id), &declarator.init) {
                initializers.insert(name, init);
            }
        }
    }
    let object_argument = |expression: &'b Expression<'a>| -> E<'b, 'a> {
        let mut visiting: FxHashSet<&str> = FxHashSet::default();
        let mut value = unwrap(E::new(expression));
        loop {
            let Some(name) = value.ident_name() else {
                return value;
            };
            let Some(init) = initializers.get(name) else {
                return value;
            };
            if !visiting.insert(name) {
                return value;
            }
            value = unwrap(E::new(init));
        }
    };

    for declaration in crate::eval::consts::top_level_variable_declarations(program) {
        for declarator in &declaration.declarations {
            let Some(init) = &declarator.init else {
                continue;
            };
            let init = unwrap(E::new(init));
            let K::Call(call) = init.kind() else { continue };
            let Some(name) = binding_name(&declarator.id) else {
                continue;
            };
            let method = plumeria_method(&call.callee, &aliases).map(str::to_string);
            let args: Vec<E> = call
                .arguments
                .iter()
                .enumerate()
                .map(|(index, argument)| {
                    let raw = argument_expr(argument);
                    let is_style = method
                        .as_deref()
                        .is_some_and(|m| STYLE_METHODS.contains(&m));
                    let target = if method.as_deref() == Some("createTheme") {
                        1
                    } else {
                        0
                    };
                    if is_style && index == target {
                        match raw.expr() {
                            Some(expr) => object_argument(expr),
                            None => unwrap(raw),
                        }
                    } else {
                        unwrap(raw)
                    }
                })
                .collect();
            let Some(method) = method else { continue };
            let is_theme = method == "createTheme";
            let object = if !is_theme {
                args.first().and_then(|arg| arg.object_expr())
            } else if args.len() >= 2 {
                args[1].object_expr()
            } else {
                None
            };
            let Some(object) = object else { continue };
            if args.is_empty() {
                continue;
            }

            let is_pass_one = matches!(
                method.as_str(),
                "createStatic" | "createTheme" | "keyframes" | "viewTransition"
            );
            if first_pass && !is_pass_one {
                continue;
            }

            let scoped_statics = local.statics.clone();
            let scoped = Scoped {
                consts,
                statics: &scoped_statics,
            };
            let create_hash = local.create_hash.clone();
            let create_obj = local.create_obj.clone();
            let resolve_variable = |key: &str| -> Option<Value> {
                let hash = create_hash.get(key).filter(|h| !h.is_empty())?;
                create_obj.get(hash).cloned().flatten()
            };
            let env = Env {
                statics: &scoped,
                keyframes: &local.keyframes_hash,
                view_transitions: &local.view_transition_hash,
                theme_hashes: &local.theme_hash,
                theme_objects: &local.theme_obj,
                create_hashes: &local.create_hash,
                static_hashes: &local.static_hash,
                static_objects: &local.static_obj,
            };
            let obj = Evaluator::with_resolver(env, &resolve_variable).object(object)?;
            let unique_key = format!("{file}-{name}");

            match method.as_str() {
                "createStatic" => {
                    let value = Value::obj(obj.clone());
                    local.statics.insert(name, value.clone());
                    project
                        .tables
                        .static_table
                        .insert(unique_key.clone(), value.clone());
                    project.register_file_key(KeyTable::Static, &unique_key, file);
                    let hash = hash_object(&obj);
                    local.static_hash.insert(name.to_string(), hash.clone());
                    project
                        .tables
                        .static_hash
                        .insert(unique_key.clone(), hash.clone());
                    project.register_file_key(KeyTable::StaticHash, &unique_key, file);
                    project
                        .tables
                        .static_obj
                        .insert(hash.clone(), value.clone());
                    local.static_obj.insert(hash.clone(), value);
                    project.register_object_owner(ObjectTable::StaticObject, &hash, file);
                }
                "keyframes" => {
                    let value = Value::obj(obj.clone());
                    let hash = hash_object(&obj);
                    local.keyframes_hash.insert(name.to_string(), hash.clone());
                    project
                        .tables
                        .keyframes_hash
                        .insert(unique_key.clone(), hash.clone());
                    project.register_file_key(KeyTable::KeyframesHash, &unique_key, file);
                    project
                        .tables
                        .keyframes_obj
                        .insert(hash.clone(), value.clone());
                    local.keyframes_obj.insert(hash.clone(), value);
                    project.register_object_owner(ObjectTable::KeyframesObject, &hash, file);
                }
                "viewTransition" => {
                    let value = Value::obj(obj.clone());
                    let hash = hash_object(&obj);
                    local
                        .view_transition_hash
                        .insert(name.to_string(), hash.clone());
                    project
                        .tables
                        .view_transition_hash
                        .insert(unique_key.clone(), hash.clone());
                    project.register_file_key(KeyTable::ViewTransitionHash, &unique_key, file);
                    project
                        .tables
                        .view_transition_obj
                        .insert(hash.clone(), value.clone());
                    local.view_transition_obj.insert(hash.clone(), value);
                    project.register_object_owner(ObjectTable::ViewTransitionObject, &hash, file);
                }
                "createTheme" => {
                    let selector_env = Env {
                        statics: &scoped,
                        static_hashes: &local.static_hash,
                        static_objects: &local.static_obj,
                        ..env
                    };
                    let selector = resolve_theme_selector(args[0], selector_env);
                    if selector.is_empty() {
                        return Err("[plumeria] createTheme needs a non-empty selector it can read at build time. Pass a string literal such as \".dark\", or a name this file declares as one.".to_string());
                    }
                    let hash = theme_hash_of(&selector, &obj);
                    let value = Value::obj(obj.clone());
                    project.tables.theme_obj.insert(hash.clone(), value.clone());
                    local.theme_obj.insert(hash.clone(), value);
                    project.register_object_owner(ObjectTable::ThemeObject, &hash, file);
                    local.theme_hash.insert(name.to_string(), hash.clone());
                    project
                        .tables
                        .theme_hash
                        .insert(unique_key.clone(), hash.clone());
                    project.register_file_key(KeyTable::ThemeHash, &unique_key, file);
                    project
                        .tables
                        .theme_selector
                        .insert(hash.clone(), selector.clone());
                    local.theme_selector.insert(hash.clone(), selector);
                    project.register_object_owner(ObjectTable::ThemeSelector, &hash, file);
                    let atoms = Value::obj(theme_atomic_map(&hash, &obj));
                    local.atomic_map.insert(hash.clone(), atoms.clone());
                    project.tables.atomic_map.insert(hash.clone(), atoms);
                    project.register_object_owner(ObjectTable::AtomicMap, &hash, file);
                }
                "create" => {
                    let value = Value::obj(obj.clone());
                    let hash = hash_object(&obj);
                    local.create_hash.insert(name.to_string(), hash.clone());
                    project
                        .tables
                        .create_hash
                        .insert(unique_key.clone(), hash.clone());
                    project.register_file_key(KeyTable::CreateHash, &unique_key, file);
                    project
                        .tables
                        .create_obj
                        .insert(hash.clone(), value.clone());
                    local.create_obj.insert(hash.clone(), Some(value));
                    project.register_object_owner(ObjectTable::CreateObject, &hash, file);

                    let has_function_key = object.properties.iter().any(|prop| match prop {
                        ObjectPropertyKind::ObjectProperty(p) => {
                            !p.shorthand
                                && !p.method
                                && p.kind == PropertyKind::Init
                                && matches!(
                                    p.value,
                                    Expression::ArrowFunctionExpression(_)
                                        | Expression::FunctionExpression(_)
                                )
                        }
                        _ => false,
                    });
                    if has_function_key {
                        let create_hash = local.create_hash.clone();
                        let create_obj = local.create_obj.clone();
                        let resolve_variable = |key: &str| -> Option<Value> {
                            let hash = create_hash.get(key).filter(|h| !h.is_empty())?;
                            create_obj.get(hash).cloned().flatten()
                        };
                        let env = Env {
                            statics: &scoped,
                            keyframes: &local.keyframes_hash,
                            view_transitions: &local.view_transition_hash,
                            theme_hashes: &local.theme_hash,
                            theme_objects: &local.theme_obj,
                            create_hashes: &local.create_hash,
                            static_hashes: &local.static_hash,
                            static_objects: &local.static_obj,
                        };
                        let evaluator = Evaluator::with_resolver(env, &resolve_variable);
                        let eval_property = |prop: &ObjectPropertyKind| -> EvalResult<Object> {
                            let mut out = Object::new();
                            evaluator.property_into(prop, &mut out)?;
                            Ok(out)
                        };
                        let eval_value = |expr: &Expression| -> EvalResult<Option<Value>> {
                            evaluator.property_value(E::new(expr))
                        };
                        let text =
                            Inliner::new(source, &eval_property, &eval_value).inline(object)?;
                        project
                            .tables
                            .create_function
                            .insert(unique_key.clone(), Arc::from(text.as_str()));
                        project.register_file_key(KeyTable::CreateFunction, &unique_key, file);
                    }

                    let mut hash_map = Object::new();
                    for (key, style) in obj.iter() {
                        hash_map.insert(key, Value::obj(atom_map(&entries_object(style))));
                    }
                    let atoms = Value::obj(hash_map);
                    local.atomic_map.insert(hash.clone(), atoms.clone());
                    project.tables.atomic_map.insert(hash.clone(), atoms);
                    project.register_object_owner(ObjectTable::AtomicMap, &hash, file);
                }
                _ => {}
            }
        }
    }

    if first_pass {
        return Ok(None);
    }
    Ok(Some(JsxPhase {
        position: 0,
        mtime: Stamp(0),
        local,
        local_imports,
        dependencies: dependencies.into_iter().collect(),
    }))
}

#[derive(Clone)]
struct PropAlternative {
    style: Object,
    conditions: Vec<Condition>,
    dynamic_calls: Vec<(u32, u32)>,
}

struct Resolved {
    class_string: String,
    style: Object,
    has_vars: bool,
}

struct JsxContext<'p, 'b, 'a> {
    file: &'p str,
    local: &'p LocalTables,
    global_create_hash: &'p Map<String>,
    global_create_obj: &'p Map<Value>,
    global_atomic_map: &'p Map<Value>,
    functions: FxHashMap<String, crate::eval::functions::StyleFunctions<'b, 'a>>,
    dynamic_statics: Object,
    theme_objects: &'p Map<Value>,
    static_objects: &'p Map<Value>,
}

impl<'p, 'b, 'a> JsxContext<'p, 'b, 'a> {
    fn create_hash_of(&self, name: &str) -> Option<String> {
        self.local
            .create_hash
            .get(name)
            .filter(|h| !h.is_empty())
            .cloned()
            .or_else(|| {
                self.global_create_hash
                    .get(&format!("{}-{name}", self.file))
                    .filter(|h| !h.is_empty())
                    .cloned()
            })
    }

    fn is_style_name(&self, name: &str) -> bool {
        self.local
            .create_hash
            .get(name)
            .is_some_and(|h| !h.is_empty())
            || self
                .global_create_hash
                .get(&format!("{}-{name}", self.file))
                .is_some_and(|h| !h.is_empty())
    }

    fn function(&self, object: &str, property: &str) -> Option<&StyleFunction<'b, 'a>> {
        self.functions.get(object)?.get(property)
    }

    fn resolve_dynamic_call(&self, call: &CallExpression) -> EvalResult<Option<(Object, bool)>> {
        let callee = E::new(&call.callee);
        let Some(object) = callee.object().and_then(|object| object.ident_name()) else {
            return Ok(None);
        };
        let Some(Prop::Name(property)) = callee.prop() else {
            return Ok(None);
        };
        let Some(func) = self.function(object, property) else {
            return Ok(None);
        };
        if call
            .arguments
            .iter()
            .any(|argument| matches!(argument, Argument::SpreadElement(_)))
        {
            return Ok(None);
        }
        let mut runtime: Vec<String> = Vec::new();
        if let Some(named) = &func.named {
            let first = call.arguments.first().map(argument_expr);
            if call.arguments.len() > 1 || first.is_some_and(|arg| arg.object_expr().is_none()) {
                return Ok(None);
            }
            let mut given: FxHashSet<String> = FxHashSet::default();
            if let Some(object) = first.and_then(|arg| arg.object_expr()) {
                for prop in &object.properties {
                    let ObjectPropertyKind::ObjectProperty(p) = prop else {
                        continue;
                    };
                    if p.shorthand {
                        if let Expression::Identifier(ident) = &p.value {
                            given.insert(ident.name.to_string());
                        }
                        continue;
                    }
                    if p.method || p.kind != PropertyKind::Init || p.computed {
                        continue;
                    }
                    match &p.key {
                        PropertyKey::StaticIdentifier(ident) => {
                            given.insert(ident.name.to_string());
                        }
                        PropertyKey::StringLiteral(value) => {
                            given.insert(value.value.to_string());
                        }
                        _ => {}
                    }
                }
            }
            for param in named {
                if given.contains(&param.key) {
                    runtime.push(param.local.clone());
                } else if !func.defaults.contains_key(&param.local) {
                    return Ok(None);
                }
            }
        } else if call.arguments.len() == 1
            && argument_expr(&call.arguments[0]).object_expr().is_some()
        {
            return Ok(None);
        } else {
            for index in 0..call.arguments.len() {
                if let Some(param) = func.params.get(index) {
                    runtime.push(param.clone());
                }
            }
        }
        let tables = Env {
            statics: &crate::eval::NOTHING,
            keyframes: &self.local.keyframes_hash,
            view_transitions: &self.local.view_transition_hash,
            theme_hashes: &self.local.theme_hash,
            theme_objects: self.theme_objects,
            create_hashes: &self.local.create_hash,
            static_hashes: &self.local.static_hash,
            static_objects: self.static_objects,
        };
        let empty = FxHashSet::default();
        let resolved =
            resolve_dynamic_style(func, &runtime, &self.dynamic_statics, tables, Some(&empty))?;
        let has_vars = runtime.iter().any(|param| {
            resolved
                .var_groups
                .get(param)
                .is_some_and(|groups| !groups.is_empty())
        });
        Ok(Some((resolved.style, has_vars)))
    }

    fn resolve_call_style_prop(&self, expr: E<'b, 'a>) -> EvalResult<Option<Resolved>> {
        let expr = unwrap(expr);
        match expr.kind() {
            K::Array(array) => {
                let mut merged = Object::new();
                let mut classes: Vec<String> = Vec::new();
                let mut valid = false;
                let mut has_vars = false;
                for element in &array.elements {
                    match element {
                        ArrayExpressionElement::Elision(_) => continue,
                        ArrayExpressionElement::SpreadElement(_) => return Ok(None),
                        other => {
                            let Some(resolved) =
                                self.resolve_call_style_prop(E::new(other.to_expression()))?
                            else {
                                continue;
                            };
                            merged = deep_merge(&merged, &resolved.style);
                            if !resolved.class_string.is_empty() {
                                classes.push(resolved.class_string);
                            }
                            if resolved.has_vars {
                                has_vars = true;
                            }
                            valid = true;
                        }
                    }
                }
                Ok(valid.then(|| Resolved {
                    class_string: classes.join(" "),
                    style: merged,
                    has_vars,
                }))
            }
            K::Call(call) => {
                let Some((style, has_vars)) = self.resolve_dynamic_call(call)? else {
                    return Ok(None);
                };
                let atoms = atom_map(&style);
                Ok(Some(Resolved {
                    class_string: atom_class_string(&atoms),
                    style,
                    has_vars,
                }))
            }
            K::Conditional(cond) => match &cond.test {
                Expression::BooleanLiteral(test) => {
                    self.resolve_call_style_prop(E::new(if test.value {
                        &cond.consequent
                    } else {
                        &cond.alternate
                    }))
                }
                _ => Ok(None),
            },
            K::Binary(left, op, right) => {
                if op.is_and()
                    && let K::Bool(true) = left.kind()
                {
                    return self.resolve_call_style_prop(right);
                }
                Ok(None)
            }
            K::Member(_) => {
                let Some(var_name) = expr.object().and_then(|object| object.ident_name()) else {
                    return Ok(None);
                };
                let Some(Prop::Name(prop_name)) = expr.prop() else {
                    return Ok(None);
                };
                let Some(hash) = self.create_hash_of(var_name) else {
                    return Ok(None);
                };
                let style = self
                    .global_create_obj
                    .get(&hash)
                    .and_then(|o| o.as_obj())
                    .and_then(|o| o.get(prop_name));
                let atoms = self
                    .global_atomic_map
                    .get(&hash)
                    .and_then(|o| o.as_obj())
                    .and_then(|o| o.get(prop_name));
                match (style, atoms) {
                    (Some(style), Some(Value::Obj(atoms))) if style.truthy() => {
                        Ok(Some(Resolved {
                            class_string: atom_class_string(atoms),
                            style: style.as_obj().cloned().unwrap_or_default(),
                            has_vars: false,
                        }))
                    }
                    _ => Ok(None),
                }
            }
            _ => Ok(None),
        }
    }

    fn contains_style_reference(&self, expr: &Expression) -> bool {
        expression_has_identifier(expr, &|name| self.is_style_name(name))
    }

    fn prop_alternatives(&self, expr: E<'b, 'a>) -> EvalResult<Option<Vec<PropAlternative>>> {
        let expr = unwrap(expr);
        let empty = PropAlternative {
            style: Object::new(),
            conditions: Vec::new(),
            dynamic_calls: Vec::new(),
        };
        if matches!(expr.kind(), K::Null | K::Bool(false)) || expr.is_undefined_ident() {
            return Ok(Some(vec![empty]));
        }
        match expr.kind() {
            K::Conditional(cond) => {
                if let Expression::BooleanLiteral(test) = &cond.test {
                    return self.prop_alternatives(E::new(if test.value {
                        &cond.consequent
                    } else {
                        &cond.alternate
                    }));
                }
                let Some(truthy) = self.prop_alternatives(E::new(&cond.consequent))? else {
                    return Ok(None);
                };
                let Some(falsy) = self.prop_alternatives(E::new(&cond.alternate))? else {
                    return Ok(None);
                };
                let test = (cond.test.span().start, cond.test.span().end);
                let mut out = Vec::new();
                for entry in truthy {
                    let mut conditions = vec![Condition { test, truthy: true }];
                    conditions.extend(entry.conditions);
                    out.push(PropAlternative {
                        conditions,
                        ..entry
                    });
                }
                for entry in falsy {
                    let mut conditions = vec![Condition {
                        test,
                        truthy: false,
                    }];
                    conditions.extend(entry.conditions);
                    out.push(PropAlternative {
                        conditions,
                        ..entry
                    });
                }
                return Ok(Some(out));
            }
            K::Binary(left, op, right) if op.is_and() => {
                if let K::Bool(value) = left.kind() {
                    return if value {
                        self.prop_alternatives(right)
                    } else {
                        Ok(Some(vec![empty]))
                    };
                }
                let Some(truthy) = self.prop_alternatives(right)? else {
                    return Ok(None);
                };
                let test = (left.span().start, left.span().end);
                let mut out = Vec::new();
                for entry in truthy {
                    let mut conditions = vec![Condition { test, truthy: true }];
                    conditions.extend(entry.conditions);
                    out.push(PropAlternative {
                        conditions,
                        ..entry
                    });
                }
                out.push(PropAlternative {
                    conditions: vec![Condition {
                        test,
                        truthy: false,
                    }],
                    ..empty
                });
                return Ok(Some(out));
            }
            K::Array(array) => {
                let mut result = vec![empty];
                for element in &array.elements {
                    let element = match element {
                        ArrayExpressionElement::Elision(_) => continue,
                        ArrayExpressionElement::SpreadElement(_) => return Ok(None),
                        other => other.to_expression(),
                    };
                    let Some(choices) = self.prop_alternatives(E::new(element))? else {
                        return Ok(None);
                    };
                    let mut next = Vec::new();
                    for base in &result {
                        for choice in &choices {
                            let mut conditions = base.conditions.clone();
                            conditions.extend(choice.conditions.iter().cloned());
                            let mut dynamic_calls = base.dynamic_calls.clone();
                            dynamic_calls.extend(choice.dynamic_calls.iter().cloned());
                            next.push(PropAlternative {
                                style: deep_merge(&base.style, &choice.style),
                                conditions,
                                dynamic_calls,
                            });
                        }
                    }
                    result = next;
                }
                return Ok(Some(result));
            }
            _ => {}
        }
        let resolved = self.resolve_call_style_prop(expr)?;
        Ok(resolved.map(|resolved| {
            let span = expr.span();
            vec![PropAlternative {
                style: resolved.style,
                conditions: Vec::new(),
                dynamic_calls: if resolved.has_vars {
                    vec![(span.start, span.end)]
                } else {
                    Vec::new()
                },
            }]
        }))
    }

    fn register_styles(
        &self,
        node: E<'b, 'a>,
        prop_name: &str,
        comp_key: &str,
        table: &mut PropsTable,
    ) -> EvalResult<()> {
        match node.kind() {
            K::Conditional(cond) => {
                self.register_styles(E::new(&cond.consequent), prop_name, comp_key, table)?;
                return self.register_styles(E::new(&cond.alternate), prop_name, comp_key, table);
            }
            K::Binary(_, op, right) if op.is_and() => {
                return self.register_styles(right, prop_name, comp_key, table);
            }
            K::Paren(paren) => {
                return self.register_styles(E::new(&paren.expression), prop_name, comp_key, table);
            }
            K::Array(array) => {
                let expr = node.expr().unwrap();
                let alternatives = self.prop_alternatives(node)?;
                let Some(alternatives) = alternatives else {
                    if !self.contains_style_reference(expr) {
                        return Ok(());
                    }
                    if array
                        .elements
                        .iter()
                        .any(|e| matches!(e, ArrayExpressionElement::SpreadElement(_)))
                    {
                        return Err("[plumeria] Spread elements in a style array are not supported. List each style explicitly.".to_string());
                    }
                    return Err("[plumeria] A style prop array contains an unsupported style expression. Use defined styles, null, false, undefined, or conditional branches of defined styles.".to_string());
                };
                if !self.contains_style_reference(expr) {
                    return Ok(());
                }
                let list = table
                    .entry(comp_key.to_string())
                    .or_default()
                    .entry(prop_name.to_string())
                    .or_default();
                for alternative in alternatives {
                    let atoms = atom_map(&alternative.style);
                    let class_string = atom_class_string(&atoms);
                    let has_vars = !alternative.dynamic_calls.is_empty();
                    list.push(TableEntry {
                        key: hash_str(&class_string),
                        style: alternative.style,
                        span_start: node.start(),
                        file: self.file.to_string(),
                        has_vars,
                        conditions: Some(alternative.conditions),
                        dynamic_calls: Some(alternative.dynamic_calls),
                    });
                }
                return Ok(());
            }
            K::Binary(
                _,
                BinOp::Logical(
                    oxc_syntax::operator::LogicalOperator::Or
                    | oxc_syntax::operator::LogicalOperator::Coalesce,
                ),
                _,
            ) => {
                if let Some(expr) = node.expr()
                    && !self.contains_style_reference(expr)
                {
                    return Ok(());
                }
                return Err("[plumeria] Style prop fallbacks using || or ?? cannot be resolved. Use a conditional expression with defined styles.".to_string());
            }
            _ => {}
        }
        if let Some(resolved) = self.resolve_call_style_prop(node)? {
            let list = table
                .entry(comp_key.to_string())
                .or_default()
                .entry(prop_name.to_string())
                .or_default();
            list.push(TableEntry {
                key: hash_str(&resolved.class_string),
                style: resolved.style,
                span_start: node.start(),
                file: self.file.to_string(),
                has_vars: resolved.has_vars,
                conditions: None,
                dynamic_calls: None,
            });
        }
        Ok(())
    }
}

fn receiver_props(params: &FormalParameters) -> Option<Vec<String>> {
    let first = params.items.first()?;
    let BindingPattern::ObjectPattern(pattern) = &first.pattern else {
        return None;
    };
    let mut names = Vec::new();
    for prop in &pattern.properties {
        if prop.computed {
            continue;
        }
        if let PropertyKey::StaticIdentifier(ident) = &prop.key {
            names.push(ident.name.to_string());
        }
    }
    Some(names)
}

fn is_capitalized(name: &str) -> bool {
    name.chars()
        .next()
        .is_some_and(|first| first.to_uppercase().to_string() == first.to_string())
}

pub fn jsx_phase<'b, 'a>(
    project: &mut Project,
    file: &str,
    program: &'b Program<'a>,
    allocator: &'a Allocator,
    state: JsxPhase,
    consts: &Object,
) -> Result<(), String> {
    let JsxPhase {
        mtime,
        mut local,
        local_imports,
        dependencies,
        ..
    } = state;

    let mut functions: FxHashMap<String, crate::eval::functions::StyleFunctions<'b, 'a>> =
        FxHashMap::default();
    let local_names: Vec<String> = local_imports.keys().cloned().collect();
    for local_name in local_names {
        let imported = local_imports.get(&local_name).cloned().unwrap();
        let resolved_key =
            match project.resolve_export(&imported.actual_path, &imported.imported_name) {
                Some(site) => format!("{}-{}", site.file, site.local_name),
                None => format!("{}-{}", imported.actual_path, imported.imported_name),
            };
        if let Some(hash) = project
            .tables
            .create_hash
            .get(&resolved_key)
            .filter(|h| !h.is_empty())
        {
            local.create_hash.insert(local_name.clone(), hash.clone());
        }
        if let Some(text) = project.tables.create_function.get(&resolved_key)
            && let Some(object) = parse_object_text(allocator, text)
        {
            functions.insert(local_name.clone(), style_functions_of(object));
        }
    }
    let own_prefix = format!("{file}-");
    let own_functions: Vec<(String, Arc<str>)> = project
        .tables
        .create_function
        .iter()
        .filter_map(|(key, text)| {
            key.strip_prefix(&own_prefix)
                .map(|name| (name.to_string(), text.clone()))
        })
        .collect();
    for (name, text) in own_functions {
        if functions.contains_key(&name) {
            continue;
        }
        if let Some(object) = parse_object_text(allocator, &text) {
            functions.insert(name, style_functions_of(object));
        }
    }

    let mut dynamic_statics = consts.clone();
    dynamic_statics.assign(&local.statics);

    let register_receiver = |project: &mut Project, name: &str, params: &FormalParameters| {
        if !is_capitalized(name) {
            return;
        }
        let Some(props) = receiver_props(params) else {
            return;
        };
        for prop in props {
            let comp_key = format!("{file}-{name}");
            if !project.tables.style_receiver.contains_key(&comp_key) {
                project
                    .tables
                    .style_receiver
                    .insert(comp_key.clone(), Vec::new());
                project
                    .receiver_keys_by_file
                    .entry(file.to_string())
                    .or_default()
                    .push(comp_key.clone());
            }
            let list = project.tables.style_receiver.get_mut(&comp_key).unwrap();
            if !list.contains(&prop) {
                list.push(prop);
            }
        }
    };

    for statement in &program.body {
        let declaration = match statement {
            Statement::ExportDeclaration(export) => Some(&export.declaration),
            other => other.as_declaration(),
        };
        let Some(declaration) = declaration else {
            continue;
        };
        match declaration {
            Declaration::FunctionDeclaration(function) => {
                if let Some(id) = &function.id {
                    register_receiver(project, id.name.as_str(), &function.params);
                }
            }
            Declaration::VariableDeclaration(decl) => {
                for declarator in &decl.declarations {
                    let (Some(name), Some(init)) = (binding_name(&declarator.id), &declarator.init)
                    else {
                        continue;
                    };
                    match init {
                        Expression::ArrowFunctionExpression(arrow) => {
                            register_receiver(project, name, &arrow.params)
                        }
                        Expression::FunctionExpression(function) => {
                            register_receiver(project, name, &function.params)
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }

    let tables = std::mem::take(&mut project.tables);
    let mut local_props = PropsTable::default();
    let outcome = (|| -> Result<(), String> {
        let context = JsxContext {
            file,
            local: &local,
            global_create_hash: &tables.create_hash,
            global_create_obj: &tables.create_obj,
            global_atomic_map: &tables.atomic_map,
            functions,
            dynamic_statics,
            theme_objects: &tables.theme_obj,
            static_objects: &tables.static_obj,
        };
        for opening in jsx_openings(program) {
            let Some(comp_key) = project.resolve_component_key(&opening.name, file, &local_imports)
            else {
                continue;
            };
            for attribute in &opening.attributes {
                let JSXAttributeItem::Attribute(attribute) = attribute else {
                    continue;
                };
                let JSXAttributeName::Identifier(name) = &attribute.name else {
                    continue;
                };
                let Some(JSXAttributeValue::ExpressionContainer(container)) = &attribute.value
                else {
                    continue;
                };
                let Some(expr) = container.expression.as_expression() else {
                    continue;
                };
                context.register_styles(
                    E::new(expr),
                    name.name.as_str(),
                    &comp_key,
                    &mut local_props,
                )?;
            }
        }
        Ok(())
    })();
    project.tables = tables;
    outcome?;

    for (comp_key, props) in &local_props {
        let global = project
            .tables
            .component_props
            .entry(comp_key.clone())
            .or_default();
        for (prop_name, entries) in props {
            let collected = global.entry(prop_name.clone()).or_default();
            let mut taken: FxHashSet<_> = collected.iter().map(TableEntry::identity).collect();
            for entry in entries {
                if taken.insert(entry.identity()) {
                    collected.push(entry.clone());
                }
            }
        }
    }

    let mut object_keys: FxHashMap<ObjectTable, FxHashSet<String>> = FxHashMap::default();
    object_keys.insert(
        ObjectTable::KeyframesObject,
        local.keyframes_obj.keys().cloned().collect(),
    );
    object_keys.insert(
        ObjectTable::ViewTransitionObject,
        local.view_transition_obj.keys().cloned().collect(),
    );
    object_keys.insert(
        ObjectTable::ThemeObject,
        local.theme_obj.keys().cloned().collect(),
    );
    object_keys.insert(
        ObjectTable::ThemeSelector,
        local.theme_selector.keys().cloned().collect(),
    );
    object_keys.insert(
        ObjectTable::CreateObject,
        local.create_obj.keys().cloned().collect(),
    );
    object_keys.insert(
        ObjectTable::AtomicMap,
        local.atomic_map.keys().cloned().collect(),
    );
    object_keys.insert(
        ObjectTable::StaticObject,
        local.static_obj.keys().cloned().collect(),
    );

    let previous = project.files.get(file).cloned().unwrap_or_default();
    let previous_dependencies = previous.dependencies.clone();
    project.files.insert(
        file.to_string(),
        super::CachedFile {
            mtime: Some(mtime),
            exports_mtime: previous.exports_mtime,
            dependencies: Some(dependencies.clone()),
            exports: previous.exports,
            unresolved_imports: previous.unresolved_imports,
            object_keys,
            component_props: Some(local_props),
            has_css_usage: true,
        },
    );
    project.update_dependency_edges(file, previous_dependencies.as_deref(), Some(&dependencies));
    Ok(())
}
