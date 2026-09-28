pub mod classes;
pub mod context;
pub mod dropped;
pub mod overlay;
pub mod passes;

use indexmap::IndexMap;
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_semantic::{Scoping, SemanticBuilder};
use oxc_span::Span;
use oxc_syntax::symbol::SymbolId;
use rustc_hash::{FxBuildHasher, FxHashMap, FxHashSet};

use context::{EnvParts, StaticStack, Visibility, line_col_suffix, span_text};
use overlay::{Chain, Map, Writes};

use crate::eval::Evaluator;
use crate::eval::consts::{
    ConstNodes, binding_name, collect_local_const_nodes, collect_local_consts,
};
use crate::eval::functions::{StyleFunctions, style_functions_of};
use crate::js::{Object, Value};
use crate::policy::{PropertyPolicy, assert_property_policy};
use crate::project::{KeyTable, LocalImport, LocalImports, Project, Tables};
use crate::style::ondemand::{SheetTables, Sheets, extract_ondemand_styles};
use crate::style::records::{StyleRecord, Weights, style_records};
use crate::syntax::expr::{E, K};
use crate::syntax::module::{Aliases, CORE, SpecKind, add_core_aliases, import_specs};
use crate::syntax::parse::{parse_object_text, parse_program};

pub struct TransformEnv {
    pub source: String,
    pub module_id: String,
    pub file_path: String,
    pub root: String,
    pub style_prop: String,
    pub class_prop: String,
    pub policy: Option<PropertyPolicy>,
    pub is_dev: bool,
    pub collect_ondemand_sheets: bool,
    pub cwd: String,
}

pub struct TransformOutput {
    pub code: String,
    pub sheets: Vec<String>,
    pub dependencies: Vec<String>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum StyleKind {
    Create,
    Constant,
}

pub struct CreateStyle<'b, 'a> {
    pub name: String,
    pub kind: StyleKind,
    pub obj: Object,
    pub hash_map: Object,
    pub is_exported: bool,
    pub init_span: Span,
    pub decl_span: Span,
    pub functions: Option<StyleFunctions<'b, 'a>>,
}

pub struct Component {
    pub name: String,
    pub span: Span,
}

#[derive(Clone)]
pub struct Replacement {
    pub start: u32,
    pub end: u32,
    pub content: String,
}

pub struct Transformer<'t, 'p, 'b, 'a> {
    pub project: &'p mut Project,
    pub tables: &'t Tables,
    pub writes: Writes,
    pub allocator: &'a Allocator,
    pub source: &'a str,
    pub program: &'b Program<'a>,
    pub scoping: &'b Scoping,
    pub env: &'p TransformEnv,
    pub resource: String,
    pub local_consts: Object,
    pub const_nodes: ConstNodes<'b, 'a>,
    pub aliases: Aliases,
    pub local_imports: LocalImports,
    pub merged_static: Object,
    pub merged_keyframes: Map<String>,
    pub merged_view_transitions: Map<String>,
    pub merged_create: Map<String>,
    pub merged_theme: Map<String>,
    pub merged_static_hash: Map<String>,
    pub create_function_imports: FxHashMap<String, StyleFunctions<'b, 'a>>,
    pub local_create_styles: IndexMap<String, CreateStyle<'b, 'a>, FxBuildHasher>,
    pub local_style_aliases: FxHashMap<String, Vec<(Option<SymbolId>, E<'b, 'a>)>>,
    pub replacements: Vec<Replacement>,
    pub deferred: Vec<(String, u32, u32)>,
    pub dynamic_fn_calls: Vec<Span>,
    pub separately_exported: FxHashSet<String>,
    pub excluded_ranges: Vec<(u32, u32)>,
    pub top_level_declarators: FxHashSet<u32>,
    pub top_level_inits: Vec<(&'b str, &'b Expression<'a>)>,
    pub registered_style_calls: FxHashSet<u32>,
    pub effective_args: FxHashMap<u32, &'b ObjectExpression<'a>>,
    pub effective_theme_args: FxHashMap<u32, &'b ObjectExpression<'a>>,
    pub components: Vec<Component>,
    pub prop_aliases: FxHashMap<String, FxHashMap<String, String>>,
    pub prop_defaults: FxHashMap<String, IndexMap<String, &'b Expression<'a>, FxBuildHasher>>,
    pub declared_props: FxHashMap<String, FxHashSet<String>>,
    pub component_param_names: FxHashSet<String>,
    pub applied_style_props: FxHashSet<String>,
    pub sheets: Sheets,
    pub jsx_owner: FxHashMap<
        u32,
        (
            Option<String>,
            &'b oxc_allocator::Vec<'a, JSXAttributeItem<'a>>,
        ),
    >,
    pub shorthand_starts: FxHashSet<u32>,
}

pub type TResult<T> = Result<T, String>;

pub fn unwrap_pattern_default<'b, 'a>(pattern: &'b BindingPattern<'a>) -> &'b BindingPattern<'a> {
    match pattern {
        BindingPattern::AssignmentPattern(assign) => &assign.left,
        other => other,
    }
}

pub fn function_of<'b, 'a>(expr: &'b Expression<'a>) -> Option<(Span, &'b FormalParameters<'a>)> {
    match expr {
        Expression::ArrowFunctionExpression(arrow) => Some((arrow.span, &arrow.params)),
        Expression::FunctionExpression(function) => Some((function.span, &function.params)),
        Expression::CallExpression(call) => {
            for argument in &call.arguments {
                let inner = match argument {
                    Argument::SpreadElement(spread) => &spread.argument,
                    other => other.to_expression(),
                };
                if let Some(found) = function_of(inner) {
                    return Some(found);
                }
            }
            None
        }
        _ => None,
    }
}

pub fn component_functions<'b, 'a>(
    program: &'b Program<'a>,
) -> Vec<(String, Span, &'b FormalParameters<'a>)> {
    let mut out = Vec::new();
    for statement in &program.body {
        match statement {
            Statement::FunctionDeclaration(function) => {
                let name = function
                    .id
                    .as_ref()
                    .map(|id| id.name.to_string())
                    .unwrap_or_else(|| "default".to_string());
                out.push((name, function.span, &*function.params));
            }
            Statement::ExportDeclaration(export) => match &export.declaration {
                Declaration::FunctionDeclaration(function) => {
                    let name = function
                        .id
                        .as_ref()
                        .map(|id| id.name.to_string())
                        .unwrap_or_else(|| "default".to_string());
                    out.push((name, function.span, &*function.params));
                }
                Declaration::VariableDeclaration(decl) => push_declarator_functions(decl, &mut out),
                _ => {}
            },
            Statement::VariableDeclaration(decl) => push_declarator_functions(decl, &mut out),
            Statement::ExportDefaultDeclaration(export) => match &export.declaration {
                ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
                    let name = function
                        .id
                        .as_ref()
                        .map(|id| id.name.to_string())
                        .unwrap_or_else(|| "default".to_string());
                    out.push((name, function.span, &*function.params));
                }
                ExportDefaultDeclarationKind::ClassDeclaration(_)
                | ExportDefaultDeclarationKind::TSInterfaceDeclaration(_) => {}
                other => {
                    let expr = other.to_expression();
                    match expr {
                        Expression::ArrowFunctionExpression(arrow) => {
                            out.push(("default".to_string(), arrow.span, &*arrow.params));
                        }
                        Expression::FunctionExpression(function) => {
                            let name = function
                                .id
                                .as_ref()
                                .map(|id| id.name.to_string())
                                .unwrap_or_else(|| "default".to_string());
                            out.push((name, function.span, &*function.params));
                        }
                        Expression::CallExpression(_) => {
                            if let Some((span, params)) = function_of(expr) {
                                out.push(("default".to_string(), span, params));
                            }
                        }
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    out
}

fn push_declarator_functions<'b, 'a>(
    decl: &'b VariableDeclaration<'a>,
    out: &mut Vec<(String, Span, &'b FormalParameters<'a>)>,
) {
    for declarator in &decl.declarations {
        let Some(name) = binding_name(&declarator.id) else {
            continue;
        };
        let Some(init) = &declarator.init else {
            continue;
        };
        if let Some((span, params)) = function_of(init) {
            out.push((name.to_string(), span, params));
        }
    }
}

pub fn first_param_pattern<'b, 'a>(
    params: &'b FormalParameters<'a>,
) -> Option<&'b BindingPattern<'a>> {
    params
        .items
        .first()
        .map(|item| unwrap_pattern_default(&item.pattern))
}

impl<'t, 'p, 'b, 'a> Transformer<'t, 'p, 'b, 'a> {
    pub fn text(&self, span: Span) -> String {
        span_text(self.source, span)
    }

    pub fn source_of(&self, e: E) -> String {
        self.text(e.span())
    }

    pub fn fail(&self, message: impl Into<String>, at: Option<Span>) -> String {
        let message = message.into();
        match at {
            Some(span) => format!(
                "{message}{}",
                line_col_suffix(self.source, span.start, &self.resource)
            ),
            None => message,
        }
    }

    pub fn visibility(&self) -> Visibility<'b> {
        Visibility {
            scoping: self.scoping,
        }
    }

    pub fn env_parts(&self) -> EnvParts<'_> {
        EnvParts {
            statics: StaticStack {
                own: &self.merged_static,
                base: &self.tables.static_table,
            },
            keyframes: Chain::two(&self.merged_keyframes, &self.tables.keyframes_hash),
            view_transitions: Chain::two(
                &self.merged_view_transitions,
                &self.tables.view_transition_hash,
            ),
            theme_hashes: Chain::three(
                &self.merged_theme,
                &self.writes.theme_hash,
                &self.tables.theme_hash,
            ),
            theme_objects: Chain::two(&self.writes.theme_obj, &self.tables.theme_obj),
            create_hashes: Chain::two(&self.merged_create, &self.tables.create_hash),
            static_hashes: Chain::three(
                &self.merged_static_hash,
                &self.writes.static_hash,
                &self.tables.static_hash,
            ),
            static_objects: Chain::two(&self.writes.static_obj, &self.tables.static_obj),
        }
    }

    pub fn evaluate_object(&self, object: &ObjectExpression) -> TResult<Object> {
        let parts = self.env_parts();
        Evaluator::new(parts.env()).object(object)
    }

    pub fn with_evaluator<R>(
        &self,
        statics: Option<&dyn crate::eval::Lookup<Value>>,
        f: impl FnOnce(Evaluator) -> R,
    ) -> R {
        let parts = self.env_parts();
        let mut env = parts.env();
        if let Some(statics) = statics {
            env.statics = statics;
        }
        f(Evaluator::new(env))
    }

    pub fn process_style_records(
        &mut self,
        style: &Object,
        weights: Option<&Weights>,
    ) -> Vec<StyleRecord> {
        let records = style_records(style, weights);
        if self.env.collect_ondemand_sheets {
            let overlay = OverlayView {
                writes: &self.writes,
                tables: self.tables,
            };
            let sheets = &mut self.sheets;
            extract_ondemand_styles(
                style,
                &mut |sheet| {
                    sheets.insert(sheet);
                },
                &overlay,
            );
            for record in &records {
                self.sheets.insert(record.sheet.clone());
            }
        }
        records
    }

    pub fn owner_component_of(&self, at: u32) -> Option<String> {
        self.components
            .iter()
            .find(|component| at >= component.span.start && at <= component.span.end)
            .map(|component| component.name.clone())
    }

    pub fn resolve_local_style_alias(&self, expression: E<'b, 'a>) -> E<'b, 'a> {
        let mut current = expression;
        let mut seen: FxHashSet<String> = FxHashSet::default();
        while let Some(ident) = current.ident() {
            let name = ident.name.to_string();
            if !seen.insert(name.clone()) {
                break;
            }
            let Some(candidates) = self.local_style_aliases.get(&name) else {
                break;
            };
            if candidates.is_empty() {
                break;
            }
            let symbol = self.visibility().symbol_of(ident);
            let Some((_, target)) = candidates
                .iter()
                .find(|(context, _)| *context == symbol && symbol.is_some())
            else {
                break;
            };
            current = *target;
        }
        current
    }

    pub fn is_excluded(&self, start: u32) -> bool {
        self.excluded_ranges
            .iter()
            .any(|(s, e)| start >= *s && start < *e)
    }

    pub fn defer_range(&mut self, start: u32, end: u32) -> String {
        let token = format!("__plumeria_preserved_{}__", self.deferred.len());
        self.deferred.push((token.clone(), start, end));
        token
    }

    pub fn style_functions_for(&self, object: &str, property: &str) -> bool {
        self.local_create_styles
            .get(object)
            .and_then(|style| style.functions.as_ref())
            .is_some_and(|functions| functions.contains_key(property))
            || self
                .create_function_imports
                .get(object)
                .is_some_and(|functions| functions.contains_key(property))
    }
}

pub struct OverlayView<'x> {
    pub writes: &'x Writes,
    pub tables: &'x Tables,
}

impl SheetTables for OverlayView<'_> {
    fn keyframes_obj(&self, hash: &str) -> Option<Value> {
        self.writes
            .keyframes_obj
            .get(hash)
            .or_else(|| self.tables.keyframes_obj.get(hash))
            .cloned()
    }
    fn view_transition_obj(&self, hash: &str) -> Option<Value> {
        self.writes
            .view_transition_obj
            .get(hash)
            .or_else(|| self.tables.view_transition_obj.get(hash))
            .cloned()
    }
    fn create_obj(&self, hash: &str) -> Option<Value> {
        self.writes
            .create_obj
            .get(hash)
            .or_else(|| self.tables.create_obj.get(hash))
            .cloned()
    }
    fn theme_names_sorted(&self) -> Vec<(String, String)> {
        let mut names: Vec<(String, String)> = self
            .tables
            .theme_hash
            .iter()
            .filter(|(key, _)| !self.writes.theme_hash.contains_key(*key))
            .chain(self.writes.theme_hash.iter())
            .map(|(key, hash)| (key.clone(), hash.clone()))
            .collect();
        names.sort_by(|a, b| crate::js::cmp_utf16(&a.0, &b.0));
        names
    }
    fn theme_obj(&self, hash: &str) -> Option<Value> {
        self.writes
            .theme_obj
            .get(hash)
            .or_else(|| self.tables.theme_obj.get(hash))
            .cloned()
    }
    fn theme_selector(&self, hash: &str) -> Option<String> {
        self.writes
            .theme_selector
            .get(hash)
            .or_else(|| self.tables.theme_selector.get(hash))
            .cloned()
    }
}

pub fn transform_source(project: &mut Project, env: &TransformEnv) -> TResult<TransformOutput> {
    let allocator = Allocator::default();
    let source: &str = allocator.alloc_str(&env.source);
    let program = parse_program(&allocator, source)?;
    let program: &Program = allocator.alloc(program);
    assert_property_policy(program, env.policy, &env.module_id)?;
    let semantic = SemanticBuilder::new().build(program).semantic;
    let scoping = semantic.scoping();

    project.scan_overlay(&env.cwd, &env.style_prop);
    if let Some((_, message)) = project.resolve_file_error(&env.file_path, "") {
        return Err(format!("[plumeria] {message}"));
    }

    let mut dependencies: Vec<String> = Vec::new();
    for statement in &program.body {
        if let Statement::ImportDeclaration(decl) = statement
            && let Some(actual) =
                project.resolve_import_path(decl.source.value.as_str(), &env.module_id)
        {
            dependencies.push(actual.clone());
            dependencies.extend(project.get_file_dependencies(&actual));
        }
    }
    let prefix = format!("{}-", env.module_id);
    let mut parents: indexmap::IndexSet<String, FxBuildHasher> = Default::default();
    for (comp_key, props) in &project.tables.component_props {
        if !comp_key.starts_with(&prefix) {
            continue;
        }
        for entries in props.values() {
            for entry in entries {
                if entry.file != env.module_id {
                    parents.insert(entry.file.clone());
                }
            }
        }
    }
    dependencies.extend(parents);

    let tables = std::mem::take(&mut project.tables);
    let result = (|| -> TResult<(String, Vec<String>)> {
        let mut transformer =
            Transformer::new(project, &tables, &allocator, source, program, scoping, env);
        transformer.prepare()?;
        transformer.first_pass()?;
        transformer.second_pass()?;
        transformer.finish()
    })();
    project.tables = tables;
    let (code, sheets) = result?;
    Ok(TransformOutput {
        code,
        sheets,
        dependencies,
    })
}

impl<'t, 'p, 'b, 'a> Transformer<'t, 'p, 'b, 'a> {
    fn new(
        project: &'p mut Project,
        tables: &'t Tables,
        allocator: &'a Allocator,
        source: &'a str,
        program: &'b Program<'a>,
        scoping: &'b Scoping,
        env: &'p TransformEnv,
    ) -> Self {
        Transformer {
            project,
            tables,
            writes: Writes::default(),
            allocator,
            source,
            program,
            scoping,
            env,
            resource: env.module_id.clone(),
            local_consts: Object::new(),
            const_nodes: ConstNodes::default(),
            aliases: Aliases::default(),
            local_imports: LocalImports::default(),
            merged_static: Object::new(),
            merged_keyframes: Map::default(),
            merged_view_transitions: Map::default(),
            merged_create: Map::default(),
            merged_theme: Map::default(),
            merged_static_hash: Map::default(),
            create_function_imports: FxHashMap::default(),
            local_create_styles: IndexMap::default(),
            local_style_aliases: FxHashMap::default(),
            replacements: Vec::new(),
            deferred: Vec::new(),
            dynamic_fn_calls: Vec::new(),
            separately_exported: FxHashSet::default(),
            excluded_ranges: Vec::new(),
            top_level_declarators: FxHashSet::default(),
            top_level_inits: Vec::new(),
            registered_style_calls: FxHashSet::default(),
            effective_args: FxHashMap::default(),
            effective_theme_args: FxHashMap::default(),
            components: Vec::new(),
            prop_aliases: FxHashMap::default(),
            prop_defaults: FxHashMap::default(),
            declared_props: FxHashMap::default(),
            component_param_names: FxHashSet::default(),
            applied_style_props: FxHashSet::default(),
            sheets: Sheets::default(),
            jsx_owner: FxHashMap::default(),
            shorthand_starts: FxHashSet::default(),
        }
    }

    fn prepare(&mut self) -> TResult<()> {
        let program = self.program;
        for (name, span, params) in component_functions(program) {
            self.components.push(Component {
                name: name.clone(),
                span,
            });
            let pattern = first_param_pattern(params);
            let mut defaults: IndexMap<String, &'b Expression<'a>, FxBuildHasher> =
                IndexMap::default();
            let mut aliases: FxHashMap<String, String> = FxHashMap::default();
            let mut declared: FxHashSet<String> = FxHashSet::default();
            if let Some(BindingPattern::ObjectPattern(object)) = pattern {
                for prop in &object.properties {
                    let key = if prop.computed {
                        None
                    } else {
                        match &prop.key {
                            PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
                            PropertyKey::StringLiteral(value) => Some(value.value.to_string()),
                            _ => None,
                        }
                    };
                    if let BindingPattern::AssignmentPattern(assign) = &prop.value
                        && let Some(key) = &key
                    {
                        defaults.insert(key.clone(), &assign.right);
                    }
                    if !prop.shorthand
                        && let (BindingPattern::BindingIdentifier(local), Some(key)) =
                            (unwrap_pattern_default(&prop.value), &key)
                        && local.name.as_str() != key
                    {
                        aliases.insert(local.name.to_string(), key.clone());
                    }
                    if let Some(key) = key {
                        declared.insert(key);
                    }
                }
            }
            self.prop_defaults.insert(name.clone(), defaults);
            if !aliases.is_empty() {
                self.prop_aliases.insert(name.clone(), aliases);
            }
            if !declared.is_empty() {
                self.declared_props.insert(name.clone(), declared);
            }
            match pattern {
                Some(BindingPattern::BindingIdentifier(ident)) => {
                    self.component_param_names.insert(ident.name.to_string());
                }
                Some(BindingPattern::ObjectPattern(object)) => {
                    if let Some(rest) = &object.rest
                        && let BindingPattern::BindingIdentifier(ident) = &rest.argument
                    {
                        self.component_param_names.insert(ident.name.to_string());
                    }
                }
                _ => {}
            }
        }

        self.local_consts = collect_local_consts(program);
        self.const_nodes = collect_local_const_nodes(program);

        let mut import_map = Object::new();
        let mut keyframes_imports: Map<String> = Map::default();
        let mut view_transition_imports: Map<String> = Map::default();
        let mut create_imports: Map<String> = Map::default();
        let mut theme_imports: Map<String> = Map::default();
        let mut static_hash_imports: Map<String> = Map::default();

        for statement in &program.body {
            let Statement::ImportDeclaration(decl) = statement else {
                continue;
            };
            let source_path = decl.source.value.as_str();
            if source_path == CORE {
                add_core_aliases(decl, &mut self.aliases);
            }
            let Some(actual) = self
                .project
                .resolve_import_path(source_path, &self.resource)
            else {
                continue;
            };
            for spec in import_specs(decl) {
                if spec.kind == SpecKind::Namespace {
                    self.local_imports.insert(
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
                let unique_key = match self.project.resolve_export(&actual, &imported_name) {
                    Some(site) => format!("{}-{}", site.file, site.local_name),
                    None => format!("{actual}-{imported_name}"),
                };
                self.local_imports.insert(
                    local_name.clone(),
                    LocalImport {
                        actual_path: actual.clone(),
                        imported_name: imported_name.clone(),
                    },
                );
                let tables = self.tables;
                if let Some(value) = tables.static_table.get(&unique_key).filter(|v| v.truthy()) {
                    import_map.insert(local_name.clone(), value.clone());
                }
                if let Some(hash) = tables
                    .keyframes_hash
                    .get(&unique_key)
                    .filter(|h| !h.is_empty())
                {
                    keyframes_imports.insert(local_name.clone(), hash.clone());
                }
                if let Some(hash) = tables
                    .view_transition_hash
                    .get(&unique_key)
                    .filter(|h| !h.is_empty())
                {
                    view_transition_imports.insert(local_name.clone(), hash.clone());
                }
                if let Some(hash) = tables
                    .create_hash
                    .get(&unique_key)
                    .filter(|h| !h.is_empty())
                {
                    create_imports.insert(local_name.clone(), hash.clone());
                }
                if let Some(text) = tables.create_function.get(&unique_key)
                    && let Some(object) = parse_object_text(self.allocator, text)
                {
                    self.create_function_imports
                        .insert(local_name.clone(), style_functions_of(object));
                }
                if let Some(hash) = tables.theme_hash.get(&unique_key).filter(|h| !h.is_empty()) {
                    theme_imports.insert(local_name.clone(), hash.clone());
                }
                if let Some(hash) = tables
                    .static_hash
                    .get(&unique_key)
                    .filter(|h| !h.is_empty())
                {
                    static_hash_imports.insert(local_name.clone(), hash.clone());
                }
            }
        }

        self.merged_static = self.local_consts.clone();
        self.merged_static.assign(&import_map);

        let resource = self.resource.clone();
        let own =
            |project: &Project, table: KeyTable, source: &Map<String>, into: &mut Map<String>| {
                for key in project.file_table_keys(&resource, table) {
                    if let Some(value) = source.get(&key) {
                        into.insert(key[resource.len() + 1..].to_string(), value.clone());
                    }
                }
            };
        own(
            self.project,
            KeyTable::KeyframesHash,
            &self.tables.keyframes_hash,
            &mut self.merged_keyframes,
        );
        self.merged_keyframes.extend(keyframes_imports);
        own(
            self.project,
            KeyTable::ViewTransitionHash,
            &self.tables.view_transition_hash,
            &mut self.merged_view_transitions,
        );
        self.merged_view_transitions.extend(view_transition_imports);
        own(
            self.project,
            KeyTable::CreateHash,
            &self.tables.create_hash,
            &mut self.merged_create,
        );
        self.merged_create.extend(create_imports);
        own(
            self.project,
            KeyTable::ThemeHash,
            &self.tables.theme_hash,
            &mut self.merged_theme,
        );
        self.merged_theme.extend(theme_imports);
        own(
            self.project,
            KeyTable::StaticHash,
            &self.tables.static_hash,
            &mut self.merged_static_hash,
        );
        self.merged_static_hash.extend(static_hash_imports);

        for statement in &program.body {
            if let Statement::ExportNamedDeclaration(export) = statement {
                for spec in &export.specifiers {
                    if let ModuleExportName::IdentifierReference(ident) = &spec.local {
                        self.separately_exported.insert(ident.name.to_string());
                    }
                }
            }
            let declaration = match statement {
                Statement::ExportDeclaration(export) => match &export.declaration {
                    Declaration::VariableDeclaration(decl) => Some(&**decl),
                    _ => None,
                },
                Statement::VariableDeclaration(decl) => Some(&**decl),
                _ => None,
            };
            if let Some(declaration) = declaration {
                for declarator in &declaration.declarations {
                    self.top_level_declarators.insert(declarator.span.start);
                    if let (Some(name), Some(init)) =
                        (binding_name(&declarator.id), &declarator.init)
                    {
                        self.top_level_inits.push((name, init));
                    }
                }
            }
        }
        Ok(())
    }

    pub fn literal_object_argument(&self, node: E<'b, 'a>) -> Option<&'b ObjectExpression<'a>> {
        let mut seen: FxHashSet<&str> = FxHashSet::default();
        let mut current = crate::syntax::expr::unwrap_style(node);
        loop {
            if let K::Object(object) = current.kind() {
                return Some(object);
            }
            let name = current.ident_name()?;
            if !seen.insert(name) {
                return None;
            }
            let (_, init) = self
                .top_level_inits
                .iter()
                .find(|(declared, _)| *declared == name)?;
            current = crate::syntax::expr::unwrap_style(E::new(init));
        }
    }

    fn finish(mut self) -> TResult<(String, Vec<String>)> {
        for component in &self.components {
            let key = format!("{}-{}", self.resource, component.name);
            let Some(props) = self.tables.component_props.get(&key) else {
                continue;
            };
            for prop_name in props.keys() {
                if self
                    .applied_style_props
                    .contains(&format!("{}:{prop_name}", component.name))
                {
                    continue;
                }
                return Err(self.fail(
                    format!(
                        "[plumeria] \"{prop_name}\" is a style received through a prop but is never applied to {} or css.use() here. Apply it on an element this component renders; a style prop cannot be passed on to another component.",
                        self.env.style_prop
                    ),
                    Some(component.span),
                ));
            }
        }

        let styles: Vec<(bool, Span, Span, String)> = self
            .local_create_styles
            .values()
            .map(|info| {
                (
                    info.is_exported,
                    info.init_span,
                    info.decl_span,
                    self.build_exported_init(info),
                )
            })
            .collect();
        for (is_exported, init_span, decl_span, content) in styles {
            if is_exported {
                self.replacements.push(Replacement {
                    start: init_span.start,
                    end: init_span.end,
                    content,
                });
            } else {
                self.replacements.push(Replacement {
                    start: decl_span.start,
                    end: decl_span.end,
                    content: String::new(),
                });
            }
        }

        for call in self.dynamic_fn_calls.clone() {
            let resolved = self
                .replacements
                .iter()
                .any(|r| r.start <= call.start && r.end >= call.end);
            if !resolved {
                return Err(self.fail(
                    format!(
                        "[plumeria] {} is only supported in the {} prop. A dynamic style function resolves to a class name and a CSS variable on the element itself, so it cannot be passed through another prop or read as a value.",
                        self.text(call),
                        self.env.style_prop
                    ),
                    Some(call),
                ));
            }
        }

        self.replacements
            .sort_by(|a, b| a.start.cmp(&b.start).then(b.end.cmp(&a.end)));

        for (token, start, end) in self.deferred.clone() {
            let mut cursor = start;
            let mut content = String::new();
            for replacement in &self.replacements {
                if replacement.start < cursor || replacement.end > end {
                    continue;
                }
                content.push_str(&self.source[cursor as usize..replacement.start as usize]);
                content.push_str(&replacement.content);
                cursor = replacement.end;
            }
            content.push_str(&self.source[cursor as usize..end as usize]);
            for replacement in &mut self.replacements {
                if replacement.content.contains(&token) {
                    replacement.content = replacement.content.replace(&token, &content);
                }
            }
        }

        let mut out = String::with_capacity(self.source.len());
        let mut offset: u32 = 0;
        for replacement in &self.replacements {
            if replacement.start < offset {
                continue;
            }
            out.push_str(&self.source[offset as usize..replacement.start as usize]);
            out.push_str(&replacement.content);
            offset = replacement.end;
        }
        out.push_str(&self.source[offset as usize..]);
        Ok((out, self.sheets.into_iter().collect()))
    }

    fn build_exported_init(&self, info: &CreateStyle) -> String {
        let keys = info.obj.keys();
        if !self.env.is_dev || keys.is_empty() {
            return "\"\"".to_string();
        }
        let head = crate::js::json::quote(&format!("[plumeria] \"{}.", info.name));
        let relative = crate::fs::path::relative(&self.env.root, &self.env.file_path);
        let tail = crate::js::json::quote(&format!(
            "\" was read at runtime. The file that read it was not compiled because it does not reference \"@plumeria/core\" — add import '@plumeria/core'; to it (see the stack below). Defined in {relative}."
        ));
        format!(
            "(()=>{{const k=new Set({});return new Proxy({{}},{{get(t,p){{if(typeof p===\"string\"&&k.has(p))throw new Error({head}+p+{tail});return t[p];}}}});}})()",
            crate::js::json::stringify_str_list(&keys)
        )
    }
}

pub fn is_static_arg_value(node: E) -> bool {
    match node.kind() {
        K::Str(_) | K::Num(_) | K::Bool(_) | K::Ident(_) | K::Member(_) => true,
        K::Template(template) => template.expressions.is_empty(),
        _ => false,
    }
}
