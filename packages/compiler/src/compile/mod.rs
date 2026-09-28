use indexmap::{IndexMap, IndexSet};
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::{Scoping, SemanticBuilder};
use oxc_span::{GetSpan, Span};
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::symbol::SymbolId;
use rustc_hash::{FxBuildHasher, FxHashMap, FxHashSet};

use crate::engine::{camel_to_kebab_case, hash_object, is_at_rule};
use crate::eval::consts::collect_local_consts;
use crate::eval::functions::{
    StyleFunction, StyleFunctions, resolve_dynamic_style, style_functions_of,
};
use crate::eval::{Env, Evaluator, argument_expr, resolve_theme_selector};
use crate::fs::glob::{GlobOptions, glob_sync};
use crate::fs::path::{basename, resolve};
use crate::js::{Object, Value, deep_merge, entries_object};
use crate::policy::{PropertyPolicy, assert_property_policy};
use crate::project::{KeyTable, LocalImport, LocalImports, Project, Tables};
use crate::style::ondemand::extract_ondemand_styles;
use crate::style::records::style_records;
use crate::style::theme::theme_hash_of;
use crate::syntax::expr::{E, K, Prop, root_identifier, unwrap};
use crate::syntax::module::{
    Aliases, CORE, SpecKind, add_core_aliases, import_specs, plumeria_method,
};
use crate::syntax::parse::{parse_object_text, parse_program};
use crate::transform::context::{EnvParts, StaticStack, extend, span_text};
use crate::transform::overlay::{Chain, Map, Writes};
use crate::transform::{
    OverlayView, component_functions, first_param_pattern, is_static_arg_value,
    unwrap_pattern_default,
};

pub struct CompileOptions {
    pub include: Vec<String>,
    pub exclude: Vec<String>,
    pub cwd: String,
    pub style_prop: String,
    pub policy: Option<PropertyPolicy>,
}

pub fn compile_css(project: &mut Project, options: &CompileOptions) -> Result<String, String> {
    let cwd = resolve(&std::env::current_dir().unwrap_or_default(), &options.cwd);
    let files = glob_sync(
        &options.include,
        GlobOptions {
            cwd: &cwd,
            exclude: &options.exclude,
            expected_files: 0,
        },
    )?;
    project.scan_overlay(&cwd.to_string_lossy(), &options.style_prop);
    let tables = std::mem::take(&mut project.tables);
    let mut writes = Writes::default();
    let mut all: IndexSet<String, FxBuildHasher> = IndexSet::default();
    let result = (|| -> Result<(), String> {
        for file in &files {
            let resource = resolve(&cwd, file).to_string_lossy().into_owned();
            let source = std::fs::read_to_string(&resource).map_err(|error| error.to_string())?;
            let sheets = process_file(project, &tables, &mut writes, &resource, &source, options)?;
            for sheet in sheets {
                all.insert(sheet);
            }
        }
        Ok(())
    })();
    project.tables = tables;
    result?;
    Ok(all.into_iter().collect::<Vec<_>>().join("\n"))
}

struct LocalStyle<'b, 'a> {
    obj: Object,
    functions: Option<StyleFunctions<'b, 'a>>,
}

struct Extractor<'t, 'p, 'w, 'b, 'a> {
    project: &'p mut Project,
    tables: &'t Tables,
    writes: &'w mut Writes,
    allocator: &'a Allocator,
    source: &'a str,
    resource: String,
    style_prop: String,
    scoping: &'b Scoping,
    aliases: Aliases,
    local_imports: LocalImports,
    merged_static: Object,
    merged_keyframes: Map<String>,
    merged_view_transitions: Map<String>,
    merged_create: Map<String>,
    merged_theme: Map<String>,
    merged_static_hash: Map<String>,
    create_function_imports: FxHashMap<String, StyleFunctions<'b, 'a>>,
    local_styles: IndexMap<String, LocalStyle<'b, 'a>, FxBuildHasher>,
    local_style_aliases: FxHashMap<String, Vec<(Option<SymbolId>, E<'b, 'a>)>>,
    registered_style_calls: FxHashSet<u32>,
    processed_calls: FxHashSet<(u32, u32)>,
    component_param_names: FxHashSet<String>,
    components: Vec<(String, Span)>,
    prop_aliases: FxHashMap<String, FxHashMap<String, String>>,
    prop_defaults: FxHashMap<String, IndexMap<String, &'b Expression<'a>, FxBuildHasher>>,
    declared_props: FxHashMap<String, FxHashSet<String>>,
    sheets: IndexSet<String, FxBuildHasher>,
    default_functions: FxHashSet<u32>,
}

type R<T> = Result<T, String>;

fn process_file(
    project: &mut Project,
    tables: &Tables,
    writes: &mut Writes,
    resource: &str,
    source: &str,
    options: &CompileOptions,
) -> R<Vec<String>> {
    let allocator = Allocator::default();
    let source: &str = allocator.alloc_str(source);
    let program = parse_program(&allocator, source)?;
    let program: &Program = allocator.alloc(program);
    assert_property_policy(program, options.policy, resource)?;
    let semantic = SemanticBuilder::new().build(program).semantic;
    let scoping = semantic.scoping();

    let mut extractor = Extractor {
        project,
        tables,
        writes,
        allocator: &allocator,
        source,
        resource: resource.to_string(),
        style_prop: options.style_prop.clone(),
        scoping,
        aliases: Aliases::default(),
        local_imports: LocalImports::default(),
        merged_static: Object::new(),
        merged_keyframes: Map::default(),
        merged_view_transitions: Map::default(),
        merged_create: Map::default(),
        merged_theme: Map::default(),
        merged_static_hash: Map::default(),
        create_function_imports: FxHashMap::default(),
        local_styles: IndexMap::default(),
        local_style_aliases: FxHashMap::default(),
        registered_style_calls: FxHashSet::default(),
        processed_calls: FxHashSet::default(),
        component_param_names: FxHashSet::default(),
        components: Vec::new(),
        prop_aliases: FxHashMap::default(),
        prop_defaults: FxHashMap::default(),
        declared_props: FxHashMap::default(),
        sheets: IndexSet::default(),
        default_functions: FxHashSet::default(),
    };
    extractor.prepare(program);
    let mut first = FirstPass {
        x: &mut extractor,
        error: None,
    };
    first.visit_program(program);
    if let Some(error) = first.error {
        return Err(error);
    }
    let mut second = SecondPass {
        x: &mut extractor,
        error: None,
    };
    second.visit_program(program);
    if let Some(error) = second.error {
        return Err(error);
    }
    Ok(extractor.sheets.into_iter().collect())
}

impl<'t, 'p, 'w, 'b, 'a> Extractor<'t, 'p, 'w, 'b, 'a> {
    fn file(&self) -> String {
        basename(&self.resource)
    }

    fn text(&self, span: Span) -> String {
        span_text(self.source, span)
    }

    fn source_of(&self, e: E) -> String {
        self.text(e.span())
    }

    fn prepare(&mut self, program: &'b Program<'a>) {
        let local_consts = collect_local_consts(program);
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
                let theme = self
                    .writes
                    .theme_hash
                    .get(&unique_key)
                    .or_else(|| tables.theme_hash.get(&unique_key));
                if let Some(hash) = theme.filter(|h| !h.is_empty()) {
                    theme_imports.insert(local_name.clone(), hash.clone());
                }
                let static_hash = self
                    .writes
                    .static_hash
                    .get(&unique_key)
                    .or_else(|| tables.static_hash.get(&unique_key));
                if let Some(hash) = static_hash.filter(|h| !h.is_empty()) {
                    static_hash_imports.insert(local_name.clone(), hash.clone());
                }
            }
        }

        self.merged_static = local_consts;
        self.merged_static.assign(&import_map);
        let resource = self.resource.clone();
        let project = &*self.project;
        let own = |table: KeyTable, source: &Map<String>, into: &mut Map<String>| {
            for key in project.file_table_keys(&resource, table) {
                if let Some(value) = source.get(&key) {
                    into.insert(key[resource.len() + 1..].to_string(), value.clone());
                }
            }
        };
        own(
            KeyTable::KeyframesHash,
            &self.tables.keyframes_hash,
            &mut self.merged_keyframes,
        );
        self.merged_keyframes.extend(keyframes_imports);
        own(
            KeyTable::ViewTransitionHash,
            &self.tables.view_transition_hash,
            &mut self.merged_view_transitions,
        );
        self.merged_view_transitions.extend(view_transition_imports);
        own(
            KeyTable::ThemeHash,
            &self.tables.theme_hash,
            &mut self.merged_theme,
        );
        self.merged_theme.extend(theme_imports);
        own(
            KeyTable::StaticHash,
            &self.tables.static_hash,
            &mut self.merged_static_hash,
        );
        self.merged_static_hash.extend(static_hash_imports);
        own(
            KeyTable::CreateHash,
            &self.tables.create_hash,
            &mut self.merged_create,
        );
        self.merged_create.extend(create_imports);

        for (name, span, params) in component_functions(program) {
            let pattern = first_param_pattern(params);
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
            self.components.push((name.clone(), span));
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
                    if let (BindingPattern::AssignmentPattern(assign), Some(key)) =
                        (&prop.value, &key)
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
                self.declared_props.insert(name, declared);
            }
        }

        for statement in &program.body {
            if let Statement::ExportDefaultDeclaration(export) = statement
                && let ExportDefaultDeclarationKind::FunctionDeclaration(function) =
                    &export.declaration
            {
                self.default_functions.insert(function.span.start);
            }
        }
    }

    fn env_parts(&self) -> EnvParts<'_> {
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

    fn evaluate(&self, object: &ObjectExpression) -> R<Object> {
        let parts = self.env_parts();
        Evaluator::new(parts.env()).object(object)
    }

    fn create_object(&self, hash: &str) -> Option<Value> {
        self.writes
            .create_obj
            .get(hash)
            .or_else(|| self.tables.create_obj.get(hash))
            .cloned()
    }

    fn merged_create_hash(&self, name: &str) -> Option<String> {
        self.merged_create
            .get(name)
            .or_else(|| self.tables.create_hash.get(name))
            .filter(|h| !h.is_empty())
            .cloned()
    }

    fn alias(&self, expression: E<'b, 'a>) -> E<'b, 'a> {
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
            let symbol = ident
                .reference_id
                .get()
                .and_then(|id| self.scoping.get_reference(id).symbol_id());
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

    fn process_style(&mut self, style: &Object) {
        let overlay = OverlayView {
            writes: self.writes,
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
        for record in style_records(style, None) {
            self.sheets.insert(record.sheet);
        }
    }

    fn process_value(&mut self, value: &Value) {
        let style = entries_object(value);
        let overlay = OverlayView {
            writes: self.writes,
            tables: self.tables,
        };
        let sheets = &mut self.sheets;
        if let Value::Obj(object) = value {
            extract_ondemand_styles(
                object,
                &mut |sheet| {
                    sheets.insert(sheet);
                },
                &overlay,
            );
        }
        for record in style_records(&style, None) {
            self.sheets.insert(record.sheet);
        }
    }

    fn spread_error(&self, source: &str) -> String {
        format!(
            "[plumeria] Spread elements in a style array are not supported: \"...{source}\". List each style explicitly. ({})",
            self.file()
        )
    }

    fn extract_styles(&self, expression: E<'b, 'a>) -> R<Vec<Value>> {
        let expr = self.alias(unwrap(expression));
        let mut results = Vec::new();
        match expr.kind() {
            K::Member(_) => {
                let Some(var_name) = expr.object().and_then(|object| object.ident_name()) else {
                    return Ok(results);
                };
                match expr.prop() {
                    Some(Prop::Name(prop_name)) => {
                        let local = self
                            .local_styles
                            .get(var_name)
                            .and_then(|style| style.obj.get(prop_name))
                            .filter(|v| v.truthy());
                        if let Some(value) = local {
                            results.push(value.clone());
                        } else if let Some(hash) = self.merged_create_hash(var_name)
                            && let Some(Value::Obj(object)) = self.create_object(&hash)
                            && let Some(value) = object.get(prop_name).filter(|v| v.truthy())
                        {
                            results.push(value.clone());
                        }
                    }
                    Some(Prop::Computed(key)) => {
                        let style_obj: Option<Object> = match self.local_styles.get(var_name) {
                            Some(style) => Some(style.obj.clone()),
                            None => self.merged_create_hash(var_name).and_then(|hash| {
                                match self.create_object(&hash) {
                                    Some(Value::Obj(object)) => Some((*object).clone()),
                                    _ => None,
                                }
                            }),
                        };
                        if let Some(style_obj) = style_obj {
                            if let K::Str(value) = key.kind() {
                                if let Some(found) =
                                    style_obj.get(value.value.as_str()).filter(|v| v.truthy())
                                {
                                    results.push(found.clone());
                                }
                            } else {
                                for value in style_obj.values() {
                                    if value.is_obj() {
                                        results.push(value.clone());
                                    }
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            K::Ident(ident) => {
                let name = ident.name.as_str();
                if let Some(style) = self.local_styles.get(name) {
                    results.push(Value::obj(style.obj.clone()));
                } else if let Some(hash) = self.merged_create_hash(name)
                    && let Some(object) = self.create_object(&hash)
                {
                    results.push(object);
                }
            }
            K::Array(array) => {
                let mut spreads: Vec<E<'b, 'a>> = Vec::new();
                let mut element_styles: Vec<Value> = Vec::new();
                for element in &array.elements {
                    match element {
                        ArrayExpressionElement::Elision(_) => continue,
                        ArrayExpressionElement::SpreadElement(spread) => {
                            spreads.push(E::new(&spread.argument))
                        }
                        other => element_styles
                            .extend(self.extract_styles(E::new(other.to_expression()))?),
                    }
                }
                for spread in spreads {
                    if !element_styles.is_empty() || !self.extract_styles(spread)?.is_empty() {
                        return Err(self.spread_error(&self.source_of(spread)));
                    }
                }
                results.extend(element_styles);
            }
            K::Conditional(cond) => {
                results.extend(self.extract_styles(E::new(&cond.consequent))?);
                results.extend(self.extract_styles(E::new(&cond.alternate))?);
            }
            K::Binary(left, crate::syntax::expr::BinOp::Logical(_), right) => {
                results.extend(self.extract_styles(left)?);
                results.extend(self.extract_styles(right)?);
            }
            _ => {}
        }
        Ok(results)
    }

    fn resolve_style_object(&self, expr: E<'b, 'a>) -> R<Option<Object>> {
        let expr = self.alias(unwrap(expr));
        match expr.kind() {
            K::Array(array) => {
                let mut merged = Object::new();
                for element in &array.elements {
                    match element {
                        ArrayExpressionElement::Elision(_) => continue,
                        ArrayExpressionElement::SpreadElement(spread) => {
                            return Err(
                                self.spread_error(&self.source_of(E::new(&spread.argument)))
                            );
                        }
                        other => {
                            let Some(style) =
                                self.resolve_style_object(E::new(other.to_expression()))?
                            else {
                                return Ok(None);
                            };
                            merged = deep_merge(&merged, &style);
                        }
                    }
                }
                Ok(Some(merged))
            }
            K::Object(object) => self.evaluate(object).map(Some),
            K::Member(_) => {
                let Some(var_name) = expr.object().and_then(|object| object.ident_name()) else {
                    return Ok(None);
                };
                let prop_name = match expr.prop() {
                    Some(Prop::Name(name)) => name.to_string(),
                    Some(Prop::Computed(key)) => match key.kind() {
                        K::Str(value) => value.value.to_string(),
                        _ => return Ok(None),
                    },
                    _ => return Ok(None),
                };
                if let Some(style) = self.local_styles.get(var_name)
                    && let Some(Value::Obj(found)) = style.obj.get(&prop_name)
                {
                    return Ok(Some((**found).clone()));
                }
                if let Some(hash) = self.merged_create_hash(var_name)
                    && let Some(Value::Obj(object)) = self.create_object(&hash)
                    && let Some(Value::Obj(found)) = object.get(&prop_name)
                {
                    return Ok(Some((**found).clone()));
                }
                Ok(None)
            }
            K::Ident(ident) => {
                let name = ident.name.as_str();
                if let Some(style) = self.local_styles.get(name) {
                    return Ok(Some(style.obj.clone()));
                }
                if let Some(hash) = self.merged_create_hash(name)
                    && let Some(Value::Obj(object)) = self.create_object(&hash)
                {
                    return Ok(Some((*object).clone()));
                }
                Ok(None)
            }
            _ => Ok(None),
        }
    }

    fn assert_resolvable(&mut self, node: E<'b, 'a>) -> R<()> {
        if node.is_undefined_ident() {
            return Ok(());
        }
        if !matches!(
            node.kind(),
            K::Member(_) | K::Ident(_) | K::Call(_) | K::Arrow | K::Function
        ) {
            return Ok(());
        }
        let root = root_identifier(node);
        let is_style = root.is_some_and(|root| {
            self.local_styles.contains_key(root) || self.merged_create_hash(root).is_some()
        });
        if is_style {
            return Ok(());
        }
        let member = root.and_then(|root| namespace_member(node, root));
        let local_imports = self.local_imports.clone();
        match self
            .project
            .resolve_origin_error(member.as_deref(), root, &local_imports)
        {
            Some((file, message)) => Err(format!("[plumeria] {message} ({})", basename(&file))),
            None => Err(format!(
                "[plumeria] Dynamic or unresolvable style object \"{}\" is not supported. ({})",
                self.source_of(node),
                self.file()
            )),
        }
    }

    fn bracket_group_styles(&self, node: E<'b, 'a>) -> Option<Vec<Object>> {
        if !node.is_member() {
            return None;
        }
        let var_name = node.object()?.ident_name()?;
        let Some(Prop::Computed(key)) = node.prop() else {
            return None;
        };
        if let K::Str(_) = key.kind() {
            return None;
        }
        let obj: Object = match self.local_styles.get(var_name) {
            Some(style) => style.obj.clone(),
            None => {
                let hash = self.merged_create_hash(var_name)?;
                match self.create_object(&hash)? {
                    Value::Obj(object) => (*object).clone(),
                    _ => return None,
                }
            }
        };
        Some(
            obj.values()
                .filter_map(|value| value.as_obj().cloned())
                .collect(),
        )
    }

    fn function_for(&self, object: &str, property: &str) -> Option<&StyleFunction<'b, 'a>> {
        self.local_styles
            .get(object)
            .and_then(|style| style.functions.as_ref())
            .and_then(|functions| functions.get(property))
            .or_else(|| {
                self.create_function_imports
                    .get(object)
                    .and_then(|functions| functions.get(property))
            })
    }

    fn resolve_object_arg(&self, object: &ObjectExpression) -> R<Object> {
        let filtered = object.properties.iter().filter(|prop| match prop {
            ObjectPropertyKind::ObjectProperty(p) if p.shorthand => true,
            ObjectPropertyKind::ObjectProperty(p) => {
                !p.method && p.kind == PropertyKind::Init && is_static_arg_value(E::new(&p.value))
            }
            _ => false,
        });
        let parts = self.env_parts();
        Evaluator::new(parts.env()).properties(filtered)
    }

    fn resolve_dynamic_call(&self, expr: E<'b, 'a>) -> R<Option<Object>> {
        let Some(call) = expr.call() else {
            return Ok(None);
        };
        let callee = E::new(&call.callee);
        if !callee.is_member() {
            return Ok(None);
        }
        let Some(object) = callee.object().and_then(|object| object.ident_name()) else {
            return Ok(None);
        };
        let Some(Prop::Name(property)) = callee.prop() else {
            return Ok(None);
        };
        let Some(func) = self.function_for(object, property) else {
            return Ok(None);
        };
        if call
            .arguments
            .iter()
            .any(|argument| matches!(argument, Argument::SpreadElement(_)))
        {
            return Ok(None);
        }
        let mut temp = self.merged_static.clone();
        let mut provided: FxHashSet<String> = FxHashSet::default();
        let mut runtime: Vec<String> = Vec::new();
        if let Some(named) = &func.named {
            let first = call.arguments.first().map(argument_expr);
            if call.arguments.len() > 1 || first.is_some_and(|arg| arg.object_expr().is_none()) {
                return Err(format!(
                    "[plumeria] {} takes one object argument, because {property} destructures its parameter. ({})\n",
                    self.source_of(expr),
                    self.file()
                ));
            }
            let mut given: FxHashMap<String, E<'b, 'a>> = FxHashMap::default();
            if let Some(object) = first.and_then(|arg| arg.object_expr()) {
                for prop in &object.properties {
                    let ObjectPropertyKind::ObjectProperty(p) = prop else {
                        continue;
                    };
                    if p.shorthand {
                        if let Expression::Identifier(ident) = &p.value {
                            given.insert(ident.name.to_string(), E::new(&p.value));
                        }
                        continue;
                    }
                    if p.method || p.kind != PropertyKind::Init || p.computed {
                        continue;
                    }
                    let key = match &p.key {
                        PropertyKey::StaticIdentifier(ident) => ident.name.to_string(),
                        PropertyKey::StringLiteral(value) => value.value.to_string(),
                        _ => continue,
                    };
                    given.insert(key, E::new(&p.value));
                }
            }
            let arg_obj = match first.and_then(|arg| arg.object_expr()) {
                Some(object) => self.resolve_object_arg(object)?,
                None => Object::new(),
            };
            for param in named {
                let Some(source) = given.get(&param.key).copied() else {
                    if func.defaults.contains_key(&param.local) {
                        continue;
                    }
                    return Err(format!(
                        "[plumeria] {} leaves \"{}\" unset, and a dynamic style function has no value to fall back on. ({})\n",
                        self.source_of(expr),
                        param.key,
                        self.file()
                    ));
                };
                if is_static_arg_value(source)
                    && let Some(value) = arg_obj.get(&param.key)
                {
                    temp.insert(param.local.clone(), value.clone());
                    provided.insert(param.local.clone());
                    continue;
                }
                runtime.push(param.local.clone());
            }
        } else if call.arguments.len() == 1
            && argument_expr(&call.arguments[0]).object_expr().is_some()
        {
            let object = argument_expr(&call.arguments[0]).object_expr().unwrap();
            let arg_obj = self.resolve_object_arg(object)?;
            for param in &func.params {
                if let Some(value) = arg_obj.get(param) {
                    temp.insert(param.clone(), value.clone());
                    provided.insert(param.clone());
                }
            }
        } else {
            for index in 0..call.arguments.len() {
                if let Some(param) = func.params.get(index) {
                    runtime.push(param.clone());
                }
            }
        }
        let empty: Map<Value> = Map::default();
        let statics = StaticStack {
            own: &temp,
            base: &empty,
        };
        let parts = self.env_parts();
        let tables = Env {
            statics: &crate::eval::NOTHING,
            ..parts.env()
        };
        let resolved = resolve_dynamic_style(func, &runtime, &statics, tables, Some(&provided))?;
        Ok(Some(resolved.style))
    }

    fn owner_component_of(&self, at: u32) -> Option<String> {
        self.components
            .iter()
            .find(|(_, span)| at >= span.start && at <= span.end)
            .map(|(name, _)| name.clone())
    }

    fn collect_prop_styles(&mut self, expr: E<'b, 'a>) -> R<bool> {
        let is_param_member = expr.is_member()
            && expr
                .object()
                .and_then(|object| object.ident_name())
                .is_some_and(|object| self.component_param_names.contains(object))
            && matches!(expr.prop(), Some(Prop::Name(_)));
        if !expr.is_ident() && !is_param_member {
            return Ok(false);
        }
        let param_object = if is_param_member {
            expr.object().and_then(|object| object.ident_name())
        } else {
            None
        };
        let is_props_member = param_object.is_some_and(|object| {
            !self.local_styles.contains_key(object) && self.merged_create_hash(object).is_none()
        });
        let var_name = match expr.ident_name() {
            Some(name) => name.to_string(),
            None => match expr.prop() {
                Some(Prop::Name(name)) => name.to_string(),
                _ => return Ok(false),
            },
        };
        let owner = self.owner_component_of(expr.start());
        let prop_name = if expr.is_ident() {
            owner
                .as_ref()
                .and_then(|owner| self.prop_aliases.get(owner))
                .and_then(|aliases| aliases.get(&var_name))
                .cloned()
                .unwrap_or_else(|| var_name.clone())
        } else {
            var_name.clone()
        };
        let mut possibilities: Vec<(String, Object)> = Vec::new();
        if let Some(owner) = &owner
            && let Some(entries) = self
                .tables
                .component_props
                .get(&format!("{}-{owner}", self.resource))
                .and_then(|props| props.get(&prop_name))
        {
            possibilities.extend(
                entries
                    .iter()
                    .map(|entry| (entry.key.clone(), entry.style.clone())),
            );
        }
        if possibilities.is_empty() {
            let prefix = format!("{}-", self.resource);
            for (key, props) in &self.tables.component_props {
                if !key.starts_with(&prefix) {
                    continue;
                }
                if let Some(entries) = props.get(&prop_name) {
                    possibilities.extend(
                        entries
                            .iter()
                            .map(|entry| (entry.key.clone(), entry.style.clone())),
                    );
                }
            }
        }
        let fallback = owner
            .as_ref()
            .and_then(|owner| self.prop_defaults.get(owner))
            .and_then(|d| d.get(&prop_name))
            .copied();
        if let Some(fallback) = fallback {
            let fallback_e = E::new(fallback);
            if !unwrap(fallback_e).is_no_op_style() {
                let Some(style) = self.resolve_style_object(fallback_e)? else {
                    return Err(format!(
                        "[plumeria] A style prop default must be a defined style: \"{}\". Apply a conditional or dynamic style where the element is styled. ({})",
                        self.source_of(fallback_e),
                        self.file()
                    ));
                };
                self.process_style(&style);
            }
        }
        if !possibilities.is_empty() {
            let mut seen: FxHashSet<String> = FxHashSet::default();
            for (key, style) in possibilities {
                if !seen.insert(key) {
                    continue;
                }
                if !style.is_empty() {
                    self.process_style(&style);
                }
            }
            return Ok(true);
        }
        if fallback.is_some() {
            return Ok(true);
        }
        let declared = owner
            .as_ref()
            .and_then(|owner| self.declared_props.get(owner))
            .is_some_and(|d| d.contains(&prop_name));
        Ok(is_props_member || declared)
    }

    fn dynamic_here(&self, node: E<'b, 'a>, is_style_prop: bool) -> R<Option<Object>> {
        let dynamic = self.resolve_dynamic_call(node)?;
        if dynamic.is_some() && !is_style_prop {
            return Err(format!(
                "[plumeria] css.use({}) does not support dynamic function keys. ({})",
                self.source_of(node),
                self.file()
            ));
        }
        Ok(dynamic)
    }

    fn collect_conditions(
        &mut self,
        node: E<'b, 'a>,
        tests: &[String],
        is_style_prop: bool,
        base: &mut Object,
        conditionals: &mut Vec<(Object, Object)>,
    ) -> R<bool> {
        let node = self.alias(unwrap(node));
        if let K::Array(array) = node.kind() {
            let mut handled = true;
            for element in &array.elements {
                match element {
                    ArrayExpressionElement::Elision(_) => continue,
                    ArrayExpressionElement::SpreadElement(spread) => {
                        return Err(self.spread_error(&self.source_of(E::new(&spread.argument))));
                    }
                    other => {
                        let result = self.collect_conditions(
                            E::new(other.to_expression()),
                            tests,
                            is_style_prop,
                            base,
                            conditionals,
                        )?;
                        handled = result && handled;
                    }
                }
            }
            return Ok(handled);
        }
        match node.kind() {
            K::Conditional(cond) => {
                let test_source = self.text(cond.test.span());
                if tests.is_empty() {
                    let true_style = self.resolve_style_object(E::new(&cond.consequent))?;
                    let false_style = self.resolve_style_object(E::new(&cond.alternate))?;
                    if let (Some(t), Some(f)) = (true_style, false_style) {
                        conditionals.push((t, f));
                        return Ok(true);
                    }
                }
                let mut consequent = tests.to_vec();
                consequent.push(format!("({test_source})"));
                self.collect_conditions(
                    E::new(&cond.consequent),
                    &consequent,
                    is_style_prop,
                    base,
                    conditionals,
                )?;
                let mut alternate = tests.to_vec();
                alternate.push(format!("!({test_source})"));
                self.collect_conditions(
                    E::new(&cond.alternate),
                    &alternate,
                    is_style_prop,
                    base,
                    conditionals,
                )?;
                return Ok(true);
            }
            K::Binary(left, op, right) if op.is_and() => {
                let mut next = tests.to_vec();
                next.push(format!("({})", self.source_of(left)));
                self.collect_conditions(right, &next, is_style_prop, base, conditionals)?;
                return Ok(true);
            }
            _ => {}
        }
        if self.collect_prop_styles(node)? {
            return Ok(true);
        }
        let style = match self.resolve_style_object(node)? {
            Some(style) => Some(style),
            None => self.dynamic_here(node, is_style_prop)?,
        };
        if let Some(style) = style {
            if tests.is_empty() {
                *base = deep_merge(base, &style);
            } else {
                conditionals.push((style, Object::new()));
            }
            return Ok(true);
        }
        if !tests.is_empty()
            && let Some(groups) = self.bracket_group_styles(node)
        {
            for style in groups {
                conditionals.push((style, Object::new()));
            }
            return Ok(true);
        }
        self.assert_resolvable(node)?;
        Ok(false)
    }

    fn extract_and_process(&mut self, args: Vec<E<'b, 'a>>, is_style_prop: bool) -> R<()> {
        let args: Vec<E<'b, 'a>> = args.into_iter().map(|arg| self.alias(arg)).collect();
        let mut base = Object::new();
        let mut conditionals: Vec<(Object, Object)> = Vec::new();
        for expr in args {
            if self.collect_prop_styles(expr)? {
                continue;
            }
            if let Some(dynamic) = self.dynamic_here(expr, is_style_prop)? {
                base = deep_merge(&base, &dynamic);
                continue;
            }
            if self.collect_conditions(expr, &[], is_style_prop, &mut base, &mut conditionals)? {
                continue;
            }
            self.assert_resolvable(expr)?;
            for style in self.extract_styles(expr)? {
                self.process_value(&style);
            }
        }
        if !base.is_empty() {
            self.process_style(&base);
        }
        for (truthy, falsy) in conditionals {
            if !truthy.is_empty() {
                self.process_style(&truthy);
            }
            if !falsy.is_empty() {
                self.process_style(&falsy);
            }
        }
        Ok(())
    }

    fn names_style_function(&self, expr: E<'b, 'a>) -> bool {
        let node = unwrap(expr);
        if let K::Array(array) = node.kind() {
            return array.elements.iter().any(|element| match element {
                ArrayExpressionElement::Elision(_) => false,
                ArrayExpressionElement::SpreadElement(spread) => {
                    self.names_style_function(E::new(&spread.argument))
                }
                other => self.names_style_function(E::new(other.to_expression())),
            });
        }
        if !node.is_member() {
            return false;
        }
        let (Some(object), Some(Prop::Name(property))) =
            (node.object().and_then(|o| o.ident_name()), node.prop())
        else {
            return false;
        };
        self.function_for(object, property).is_some()
    }

    fn process_call(&mut self, call: &'b CallExpression<'a>) -> R<()> {
        if !self
            .processed_calls
            .insert((call.span.start, call.span.end))
        {
            return Ok(());
        }
        let Some(prop_name) = plumeria_method(&call.callee, &self.aliases).map(str::to_string)
        else {
            return Ok(());
        };
        if matches!(
            prop_name.as_str(),
            "create" | "createTheme" | "createStatic"
        ) && !self.registered_style_calls.contains(&call.span.start)
        {
            return Err(format!(
                "[plumeria] css.{prop_name} must be assigned to a named top-level variable. Destructuring, assignment statements, and default-exported calls cannot be compiled. ({})",
                self.file()
            ));
        }
        let first = call.arguments.first().map(argument_expr);
        match prop_name.as_str() {
            "use" => {
                if call
                    .arguments
                    .iter()
                    .any(|argument| self.names_style_function(argument_expr(argument)))
                {
                    return Err(format!(
                        "[plumeria] Dynamic or unresolvable style object \"{}\" is not supported. ({})",
                        self.text(call.span),
                        self.file()
                    ));
                }
                let args: Vec<E<'b, 'a>> = call.arguments.iter().map(argument_expr).collect();
                self.extract_and_process(args, false)?;
            }
            "keyframes" | "viewTransition" => {
                let Some(K::Object(object)) = first.map(|e| e.kind()) else {
                    return Ok(());
                };
                let obj = self.evaluate(object)?;
                let hash = hash_object(&obj);
                if prop_name == "keyframes" {
                    self.writes.keyframes_obj.insert(hash, Value::obj(obj));
                } else {
                    self.writes
                        .view_transition_obj
                        .insert(hash, Value::obj(obj));
                }
            }
            "createTheme" => {
                if call.arguments.len() < 2 {
                    return Ok(());
                }
                let Some(K::Object(object)) = Some(argument_expr(&call.arguments[1]).kind()) else {
                    return Ok(());
                };
                let selector_expr = argument_expr(&call.arguments[0]);
                let parts = self.env_parts();
                let selector = resolve_theme_selector(selector_expr, parts.env());
                self.check_selector(&selector)?;
                let obj = self.evaluate(object)?;
                let hash = theme_hash_of(&selector, &obj);
                self.writes.theme_obj.insert(hash.clone(), Value::obj(obj));
                self.writes.theme_selector.insert(hash, selector);
            }
            "createStatic" => {
                let Some(K::Object(object)) = first.map(|e| e.kind()) else {
                    return Ok(());
                };
                let obj = self.evaluate(object)?;
                let hash = hash_object(&obj);
                self.writes.static_obj.insert(hash, Value::obj(obj));
            }
            _ => {}
        }
        Ok(())
    }

    fn check_selector(&self, selector: &str) -> R<()> {
        if selector.is_empty() {
            return Err(format!(
                "[plumeria] createTheme needs a selector it can read at build time. Pass a string literal such as \".dark\", or a name this file declares as one. ({})",
                self.file()
            ));
        }
        if selector.starts_with('@') && !is_at_rule(selector) {
            return Err(format!(
                "[plumeria] Unsupported at-rule: \"{selector}\". createTheme only supports nesting at-rules such as @media, @container, @supports, @layer, and @scope. ({})",
                self.file()
            ));
        }
        Ok(())
    }

    fn register_declarator(&mut self, node: &'b VariableDeclarator<'a>) -> R<()> {
        let BindingPattern::BindingIdentifier(id) = &node.id else {
            return Ok(());
        };
        let Some(init) = &node.init else {
            return Ok(());
        };
        let init = unwrap(E::new(init));
        if let K::Call(call) = init.kind() {
            let Some(p_name) = plumeria_method(&call.callee, &self.aliases).map(str::to_string)
            else {
                return Ok(());
            };
            let is_theme = p_name == "createTheme";
            let definition = if is_theme {
                call.arguments.get(1)
            } else {
                call.arguments.first()
            };
            let definition = definition.map(|argument| unwrap(argument_expr(argument)));
            let Some(K::Object(object)) = definition.map(|d| d.kind()) else {
                return Ok(());
            };
            let count_ok =
                (!is_theme && call.arguments.len() == 1) || (is_theme && call.arguments.len() >= 2);
            if !count_ok {
                return Ok(());
            }
            self.registered_style_calls.insert(call.span.start);
            let name = id.name.to_string();
            match p_name.as_str() {
                "create" => {
                    let local_objects: FxHashMap<String, Object> = self
                        .local_styles
                        .iter()
                        .map(|(k, v)| (k.clone(), v.obj.clone()))
                        .collect();
                    let theme_hashes = self.merged_theme.clone();
                    let atomic_writes = self.writes.atomic_map.clone();
                    let atomic_base = &self.tables.atomic_map;
                    let resolve_variable = |key: &str| -> Option<Value> {
                        if let Some(object) = local_objects.get(key) {
                            return Some(Value::obj(object.clone()));
                        }
                        let hash = theme_hashes.get(key).filter(|h| !h.is_empty())?;
                        atomic_writes
                            .get(hash)
                            .or_else(|| atomic_base.get(hash))
                            .cloned()
                    };
                    let parts = self.env_parts();
                    let obj =
                        Evaluator::with_resolver(parts.env(), &resolve_variable).object(object)?;
                    let functions = style_functions_of(object);
                    self.local_styles.insert(
                        name,
                        LocalStyle {
                            obj,
                            functions: Some(functions),
                        },
                    );
                }
                "createTheme" => {
                    let selector_expr = argument_expr(&call.arguments[0]);
                    let parts = self.env_parts();
                    let selector = resolve_theme_selector(selector_expr, parts.env());
                    self.check_selector(&selector)?;
                    let obj = self.evaluate(object)?;
                    let hash = theme_hash_of(&selector, &obj);
                    let unique_key = format!("{}-{name}", self.resource);
                    self.writes.theme_hash.insert(unique_key, hash.clone());
                    self.writes
                        .theme_obj
                        .insert(hash.clone(), Value::obj(obj.clone()));
                    self.writes.theme_selector.insert(hash.clone(), selector);
                    let mut theme_map = Object::new();
                    for (key, value) in obj.iter() {
                        theme_map.insert(
                            key,
                            Value::Str(format!(
                                "var(--{}-{})",
                                crate::style::theme::theme_var_hash(&hash, key, value),
                                camel_to_kebab_case(key)
                            )),
                        );
                    }
                    self.writes
                        .atomic_map
                        .insert(hash, Value::obj(theme_map.clone()));
                    self.local_styles.insert(
                        name,
                        LocalStyle {
                            obj: theme_map,
                            functions: None,
                        },
                    );
                }
                "createStatic" => {
                    let obj = self.evaluate(object)?;
                    let hash = hash_object(&obj);
                    let unique_key = format!("{}-{name}", self.resource);
                    self.writes.static_hash.insert(unique_key, hash.clone());
                    self.writes.static_obj.insert(hash.clone(), Value::obj(obj));
                    self.merged_static_hash.insert(name, hash);
                }
                _ => {}
            }
            return Ok(());
        }
        if init.is_member() {
            let Some(object) = init.object().and_then(|object| object.ident_name()) else {
                return Ok(());
            };
            if self.local_styles.contains_key(object) || self.merged_create_hash(object).is_some() {
                self.local_style_aliases
                    .entry(id.name.to_string())
                    .or_default()
                    .push((id.symbol_id.get(), init));
            }
        }
        Ok(())
    }

    fn opening_element(&mut self, opening: &'b JSXOpeningElement<'a>) -> R<()> {
        match &opening.name {
            JSXElementName::Identifier(ident) => {
                if !capitalized(ident.name.as_str()) {
                    return Ok(());
                }
            }
            JSXElementName::IdentifierReference(ident) => {
                if !capitalized(ident.name.as_str()) {
                    return Ok(());
                }
            }
            JSXElementName::MemberExpression(_) => {}
            _ => return Ok(()),
        }
        for attribute in &opening.attributes {
            let JSXAttributeItem::Attribute(attribute) = attribute else {
                continue;
            };
            let JSXAttributeName::Identifier(name) = &attribute.name else {
                continue;
            };
            if name.name.as_str() == self.style_prop {
                continue;
            }
            let Some(JSXAttributeValue::ExpressionContainer(container)) = &attribute.value else {
                continue;
            };
            let Some(expr) = container.expression.as_expression() else {
                continue;
            };
            let expr = self.alias(E::new(expr));
            for style in self.extract_styles(expr)? {
                self.process_value(&style);
            }
        }
        Ok(())
    }

    fn style_attribute(&mut self, attribute: &'b JSXAttribute<'a>) -> R<()> {
        let JSXAttributeName::Identifier(name) = &attribute.name else {
            return Ok(());
        };
        if name.name.as_str() != self.style_prop {
            return Ok(());
        }
        let Some(JSXAttributeValue::ExpressionContainer(container)) = &attribute.value else {
            return Ok(());
        };
        let Some(expr) = container.expression.as_expression() else {
            return Ok(());
        };
        let mut args: Vec<E<'b, 'a>> = Vec::new();
        self.add_args(E::new(expr), &mut args)?;
        self.extract_and_process(args, true)
    }

    fn add_args(&self, node: E<'b, 'a>, args: &mut Vec<E<'b, 'a>>) -> R<()> {
        let node = unwrap(node);
        if let K::Array(array) = node.kind() {
            for element in &array.elements {
                match element {
                    ArrayExpressionElement::Elision(_) => continue,
                    ArrayExpressionElement::SpreadElement(spread) => {
                        return Err(self.spread_error(&self.source_of(E::new(&spread.argument))));
                    }
                    other => self.add_args(E::new(other.to_expression()), args)?,
                }
            }
            return Ok(());
        }
        args.push(node);
        Ok(())
    }
}

fn capitalized(name: &str) -> bool {
    name.chars()
        .next()
        .is_some_and(|first| first.to_uppercase().to_string() == first.to_string())
}

fn namespace_member(node: E, root_name: &str) -> Option<String> {
    let node = unwrap(node);
    match node.kind() {
        K::Call(call) => match &call.callee {
            Expression::Super(_) => None,
            callee => namespace_member(E::new(callee), root_name),
        },
        K::Member(member) => {
            let object = unwrap(node.member_object(member));
            if object.ident_name() == Some(root_name) {
                return match node.prop() {
                    Some(Prop::Name(name)) => Some(name.to_string()),
                    _ => None,
                };
            }
            namespace_member(object, root_name)
        }
        _ => None,
    }
}

struct FirstPass<'x, 't, 'p, 'w, 'b, 'a> {
    x: &'x mut Extractor<'t, 'p, 'w, 'b, 'a>,
    error: Option<String>,
}

impl<'x, 't, 'p, 'w, 'b, 'a> Visit<'a> for FirstPass<'x, 't, 'p, 'w, 'b, 'a> {
    fn visit_variable_declarator(&mut self, it: &VariableDeclarator<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.x.register_declarator(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_variable_declarator(self, it);
    }
}

struct SecondPass<'x, 't, 'p, 'w, 'b, 'a> {
    x: &'x mut Extractor<'t, 'p, 'w, 'b, 'a>,
    error: Option<String>,
}

struct CallCollector<'b, 'a> {
    calls: Vec<&'b CallExpression<'a>>,
}

impl<'b, 'a> Visit<'a> for CallCollector<'b, 'a> {
    fn visit_call_expression(&mut self, it: &CallExpression<'a>) {
        self.calls.push(extend(it));
        walk::walk_call_expression(self, it);
    }
}

impl<'x, 't, 'p, 'w, 'b, 'a> SecondPass<'x, 't, 'p, 'w, 'b, 'a> {
    fn process_all(&mut self, calls: Vec<&'b CallExpression<'a>>) {
        for call in calls {
            if self.error.is_some() {
                return;
            }
            if let Err(error) = self.x.process_call(call) {
                self.error = Some(error);
                return;
            }
        }
    }
}

impl<'x, 't, 'p, 'w, 'b, 'a> Visit<'a> for SecondPass<'x, 't, 'p, 'w, 'b, 'a> {
    fn visit_variable_declarator(&mut self, it: &VariableDeclarator<'a>) {
        if self.error.is_some() {
            return;
        }
        if let (BindingPattern::BindingIdentifier(_), Some(init)) = (&it.id, &it.init) {
            let mut collector = CallCollector { calls: Vec::new() };
            collector.visit_expression(init);
            self.process_all(collector.calls);
        }
        walk::walk_variable_declarator(self, it);
    }

    fn visit_function(&mut self, it: &Function<'a>, flags: ScopeFlags) {
        if self.error.is_some() {
            return;
        }
        let is_declaration = it.r#type == FunctionType::FunctionDeclaration
            && !self.x.default_functions.contains(&it.span.start);
        if is_declaration
            && it.id.is_some()
            && let Some(body) = &it.body
        {
            let mut collector = CallCollector { calls: Vec::new() };
            collector.visit_function_body(body);
            self.process_all(collector.calls);
        }
        walk::walk_function(self, it, flags);
    }

    fn visit_call_expression(&mut self, it: &CallExpression<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.x.process_call(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_call_expression(self, it);
    }

    fn visit_jsx_opening_element(&mut self, it: &JSXOpeningElement<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.x.opening_element(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_jsx_opening_element(self, it);
    }

    fn visit_jsx_attribute(&mut self, it: &JSXAttribute<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.x.style_attribute(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_jsx_attribute(self, it);
    }
}
