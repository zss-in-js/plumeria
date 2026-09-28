use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};
use oxc_span::{GetSpan, Span};

use super::context::extend;
use super::dropped::Context;
use super::{CreateStyle, Replacement, StyleKind, TResult, Transformer};
use crate::engine::{camel_to_kebab_case, is_at_rule};
use crate::eval::consts::binding_name;
use crate::eval::functions::style_functions_of;
use crate::eval::{argument_expr, resolve_theme_selector};
use crate::js::json::{quote, stringify, stringify_object};
use crate::js::{Object, Value};
use crate::style::records::atom_map;
use crate::style::theme::{theme_atomic_map, theme_hash_of};
use crate::syntax::expr::{E, K, Member, Prop, unwrap, unwrap_style};
use crate::syntax::module::{CORE, NAMESPACE, SpecKind, import_specs, plumeria_method};

impl<'t, 'p, 'b, 'a> Transformer<'t, 'p, 'b, 'a> {
    pub fn first_pass(&mut self) -> TResult<()> {
        let mut visitor = FirstPass {
            t: self,
            error: None,
        };
        visitor.visit_program(extend(visitor.t.program));
        match visitor.error {
            Some(error) => Err(error),
            None => Ok(()),
        }
    }

    pub fn second_pass(&mut self) -> TResult<()> {
        let mut visitor = SecondPass {
            t: self,
            error: None,
        };
        visitor.visit_program(extend(visitor.t.program));
        match visitor.error {
            Some(error) => Err(error),
            None => Ok(()),
        }
    }

    fn call_method(&self, call: &CallExpression) -> Option<String> {
        plumeria_method(&call.callee, &self.aliases).map(str::to_string)
    }

    fn assert_no_dropped(
        &self,
        object: &'b ObjectExpression<'a>,
        resolved: &Object,
    ) -> TResult<()> {
        self.with_evaluator(None, |evaluator| {
            let context = Context {
                evaluator,
                const_nodes: &self.const_nodes,
                source: self.source,
            };
            context.assert_no_dropped_values(object, resolved, None)
        })
    }

    fn import_declaration(&mut self, decl: &'b ImportDeclaration<'a>) {
        if decl.source.value.as_str() != CORE {
            return;
        }
        if decl.import_kind.is_type() {
            return;
        }
        let specs = import_specs(decl);
        let type_only: Vec<String> = specs
            .iter()
            .filter(|spec| spec.kind == SpecKind::Named && spec.type_only)
            .map(|spec| {
                if spec.imported == spec.local {
                    spec.imported.clone()
                } else {
                    format!("{} as {}", spec.imported, spec.local)
                }
            })
            .collect();
        let content = if type_only.is_empty() {
            String::new()
        } else {
            format!(
                "import type {{ {} }} from '@plumeria/core'",
                type_only.join(", ")
            )
        };
        self.replacements.push(Replacement {
            start: decl.span.start,
            end: decl.span.end,
            content,
        });
    }

    fn register_style(
        &mut self,
        node: &'b VariableDeclarator<'a>,
        decl_span: Span,
        is_exported: bool,
    ) -> TResult<()> {
        let Some(init) = &node.init else {
            return Ok(());
        };
        let init = unwrap_style(E::new(init));
        let K::Call(call) = init.kind() else {
            return Ok(());
        };
        let Some(name) = binding_name(&node.id) else {
            return Ok(());
        };
        if call.arguments.is_empty() {
            return Ok(());
        }
        let Some(prop_name) = self.call_method(call) else {
            return Ok(());
        };
        let is_registered_kind = matches!(
            prop_name.as_str(),
            "create" | "createTheme" | "createStatic"
        );
        if is_registered_kind && !self.top_level_declarators.contains(&node.span.start) {
            return Err(self.fail(
                format!(
                    "[plumeria] css.{prop_name} must be assigned to a top-level variable so its styles can be resolved across files. Move this declaration outside the function or block."
                ),
                Some(node.span),
            ));
        }
        if is_registered_kind {
            let index = if prop_name == "createTheme" { 1 } else { 0 };
            let object = call
                .arguments
                .get(index)
                .and_then(|argument| self.literal_object_argument(argument_expr(argument)));
            let Some(object) = object else {
                return Err(self.fail(
                    format!(
                        "[plumeria] css.{prop_name} needs a style object it can read at build time. Pass an object literal or a top-level constant containing one."
                    ),
                    Some(call.span),
                ));
            };
            if index == 0 {
                self.effective_args.insert(call.span.start, object);
            } else {
                self.effective_theme_args.insert(call.span.start, object);
            }
            self.registered_style_calls.insert(call.span.start);
        }

        let first_object = self.effective_args.get(&call.span.start).copied();
        let init_span = call.span;
        match prop_name.as_str() {
            "create" => {
                let Some(object) = first_object else {
                    return Ok(());
                };
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let mut hash_map = Object::new();
                for (key, style) in obj.iter() {
                    let Value::Obj(style) = style else { continue };
                    hash_map.insert(key, Value::obj(atom_map(style)));
                }
                let functions = style_functions_of(object);
                self.local_create_styles.insert(
                    name.to_string(),
                    CreateStyle {
                        name: name.to_string(),
                        kind: StyleKind::Create,
                        obj,
                        hash_map,
                        is_exported,
                        init_span,
                        decl_span,
                        functions: Some(functions),
                    },
                );
            }
            "createTheme" => {
                if call.arguments.len() < 2 {
                    return Ok(());
                }
                let Some(object) = self.effective_theme_args.get(&call.span.start).copied() else {
                    return Ok(());
                };
                let selector_expr = argument_expr(&call.arguments[0]);
                let selector = self.with_evaluator(None, |evaluator| {
                    resolve_theme_selector(selector_expr, evaluator.env)
                });
                if selector.is_empty() {
                    return Err(self.fail(
                        "[plumeria] createTheme needs a selector it can read at build time. Pass a string literal such as \".dark\", or a name this file declares as one.",
                        Some(selector_expr.span()),
                    ));
                }
                if selector.starts_with('@') && !is_at_rule(&selector) {
                    return Err(self.fail(
                        format!(
                            "[plumeria] Unsupported at-rule: \"{selector}\". createTheme only supports nesting at-rules such as @media, @container, @supports, @layer, and @scope."
                        ),
                        Some(selector_expr.span()),
                    ));
                }
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let hash = theme_hash_of(&selector, &obj);
                let unique_key = format!("{}-{name}", self.resource);
                self.writes.theme_hash.insert(unique_key, hash.clone());
                self.writes
                    .theme_obj
                    .insert(hash.clone(), Value::obj(obj.clone()));
                self.writes.theme_selector.insert(hash.clone(), selector);
                self.merged_theme.insert(name.to_string(), hash.clone());
                let hash_map = theme_atomic_map(&hash, &obj);
                self.local_create_styles.insert(
                    name.to_string(),
                    CreateStyle {
                        name: name.to_string(),
                        kind: StyleKind::Constant,
                        obj,
                        hash_map,
                        is_exported,
                        init_span,
                        decl_span,
                        functions: None,
                    },
                );
            }
            "createStatic" => {
                let Some(object) = first_object else {
                    return Ok(());
                };
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let hash = crate::engine::hash_object(&obj);
                let unique_key = format!("{}-{name}", self.resource);
                self.writes.static_hash.insert(unique_key, hash.clone());
                self.writes
                    .static_obj
                    .insert(hash.clone(), Value::obj(obj.clone()));
                self.merged_static_hash.insert(name.to_string(), hash);
                self.local_create_styles.insert(
                    name.to_string(),
                    CreateStyle {
                        name: name.to_string(),
                        kind: StyleKind::Constant,
                        hash_map: obj.clone(),
                        obj,
                        is_exported,
                        init_span,
                        decl_span,
                        functions: None,
                    },
                );
            }
            _ => {}
        }
        Ok(())
    }

    fn check_style_alias(&mut self, node: &'b VariableDeclarator<'a>) {
        let BindingPattern::BindingIdentifier(id) = &node.id else {
            return;
        };
        let Some(init) = &node.init else { return };
        let init = unwrap(E::new(init));
        if !init.is_member() {
            return;
        }
        let Some(object) = init.object().and_then(|object| object.ident_name()) else {
            return;
        };
        if self.local_create_styles.contains_key(object)
            || self.merged_create.contains_key(object)
            || self.tables.create_hash.contains_key(object)
        {
            let symbol = id.symbol_id.get();
            self.local_style_aliases
                .entry(id.name.to_string())
                .or_default()
                .push((symbol, init));
        }
    }

    fn first_pass_call(&mut self, call: &'b CallExpression<'a>) -> TResult<()> {
        let Some(prop_name) = self.call_method(call) else {
            return Ok(());
        };
        if matches!(
            prop_name.as_str(),
            "create" | "createTheme" | "createStatic"
        ) && !self.registered_style_calls.contains(&call.span.start)
        {
            return Err(self.fail(
                format!(
                    "[plumeria] css.{prop_name} must be assigned to a named top-level variable. Destructuring, assignment statements, and default-exported calls cannot be compiled."
                ),
                Some(call.span),
            ));
        }
        let first = call.arguments.first().map(argument_expr);
        match prop_name.as_str() {
            "keyframes" => {
                let Some(K::Object(object)) = first.map(|e| e.kind()) else {
                    return Ok(());
                };
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let hash = crate::engine::hash_object(&obj);
                self.writes
                    .keyframes_obj
                    .insert(hash.clone(), Value::obj(obj));
                self.replacements.push(Replacement {
                    start: call.span.start,
                    end: call.span.end,
                    content: quote(&format!("kf-{hash}")),
                });
            }
            "viewTransition" => {
                let Some(K::Object(object)) = first.map(|e| e.kind()) else {
                    return Ok(());
                };
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let hash = crate::engine::hash_object(&obj);
                self.writes
                    .view_transition_obj
                    .insert(hash.clone(), Value::obj(obj));
                self.replacements.push(Replacement {
                    start: call.span.start,
                    end: call.span.end,
                    content: quote(&format!("vt-{hash}")),
                });
            }
            "createTheme" => {
                if call.arguments.len() < 2 {
                    return Ok(());
                }
                let second = self
                    .effective_theme_args
                    .get(&call.span.start)
                    .copied()
                    .or_else(|| argument_expr(&call.arguments[1]).object_expr());
                let Some(object) = second else { return Ok(()) };
                let selector_expr = argument_expr(&call.arguments[0]);
                let selector = self.with_evaluator(None, |evaluator| {
                    resolve_theme_selector(selector_expr, evaluator.env)
                });
                if selector.is_empty() {
                    return Err(self.fail(
                        "[plumeria] createTheme needs a selector it can read at build time. Pass a string literal such as \".dark\", or a name this file declares as one.",
                        Some(selector_expr.span()),
                    ));
                }
                if selector.starts_with('@') && !is_at_rule(&selector) {
                    return Err(self.fail(
                        format!(
                            "[plumeria] Unsupported at-rule: \"{selector}\". createTheme only supports nesting at-rules such as @media, @container, @supports, @layer, and @scope."
                        ),
                        Some(selector_expr.span()),
                    ));
                }
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let hash = theme_hash_of(&selector, &obj);
                self.writes.theme_obj.insert(hash.clone(), Value::obj(obj));
                self.writes.theme_selector.insert(hash, selector);
            }
            "createStatic" => {
                let object = self
                    .effective_args
                    .get(&call.span.start)
                    .copied()
                    .or_else(|| first.and_then(|e| e.object_expr()));
                let Some(object) = object else { return Ok(()) };
                let obj = self.evaluate_object(object)?;
                self.assert_no_dropped(object, &obj)?;
                let hash = crate::engine::hash_object(&obj);
                self.writes.static_obj.insert(hash, Value::obj(obj));
            }
            "create" => {
                let object = self
                    .effective_args
                    .get(&call.span.start)
                    .copied()
                    .or_else(|| first.and_then(|e| e.object_expr()));
                let Some(object) = object else { return Ok(()) };
                let obj = self.evaluate_object(object)?;
                let hash = crate::engine::hash_object(&obj);
                self.writes.create_obj.insert(hash, Value::obj(obj));
            }
            _ => {}
        }
        Ok(())
    }

    fn created_object(&self, var_name: &str) -> Option<(Value, Value)> {
        let unique_key = format!("{}-{var_name}", self.resource);
        let hash = self
            .tables
            .create_hash
            .get(&unique_key)
            .filter(|h| !h.is_empty())
            .or_else(|| self.merged_create.get(var_name).filter(|h| !h.is_empty()))?;
        let obj = self.create_object(hash)?;
        let atomic = self.tables.atomic_map.get(hash).cloned()?;
        Some((obj, atomic))
    }

    pub fn create_object(&self, hash: &str) -> Option<Value> {
        self.writes
            .create_obj
            .get(hash)
            .or_else(|| self.tables.create_obj.get(hash))
            .cloned()
    }

    fn filtered_hash_map(obj: &Value, atomic: &Value) -> Object {
        let mut hash_map = Object::new();
        let (Some(obj), Some(atomic)) = (obj.as_obj(), atomic.as_obj()) else {
            return hash_map;
        };
        for key in obj.keys() {
            if let Some(value) = atomic.get(key)
                && value.truthy()
            {
                hash_map.insert(key, value.clone());
            }
        }
        hash_map
    }

    fn member_expression(&mut self, member: Member<'b, 'a>) {
        let node = E::from_member(member);
        if !self.visibility().expr(node) {
            return;
        }
        let Some(var_name) = node.object().and_then(|object| object.ident_name()) else {
            return;
        };
        let span = node.span();
        let unique_key = format!("{}-{var_name}", self.resource);
        let prop = node.prop();
        if let Some(Prop::Computed(dyn_expr)) = prop {
            let dyn_source = self.source_of(dyn_expr);
            let hash_map = match self.local_create_styles.get(var_name) {
                Some(local) => Some(local.hash_map.clone()),
                None => self
                    .created_object(var_name)
                    .map(|(obj, atomic)| Self::filtered_hash_map(&obj, &atomic)),
            };
            if let Some(hash_map) = hash_map {
                self.replacements.push(Replacement {
                    start: span.start,
                    end: span.end,
                    content: format!("(({})[{dyn_source}] || {{}})", stringify_object(&hash_map)),
                });
            }
            return;
        }
        let Some(Prop::Name(prop_name)) = prop else {
            return;
        };

        if let Some(local) = self.local_create_styles.get(var_name)
            && local.kind == StyleKind::Create
            && let Some(atoms) = local.hash_map.get(prop_name)
        {
            let content = format!("({})", stringify(atoms));
            self.replacements.push(Replacement {
                start: span.start,
                end: span.end,
                content,
            });
            return;
        }

        let hash = self
            .tables
            .create_hash
            .get(&unique_key)
            .filter(|h| !h.is_empty())
            .or_else(|| self.merged_create.get(var_name).filter(|h| !h.is_empty()))
            .cloned();
        if let Some(hash) = hash {
            let atoms = self
                .tables
                .atomic_map
                .get(&hash)
                .and_then(|atomic| atomic.as_obj())
                .and_then(|atomic| atomic.get(prop_name));
            if let Some(atoms) = atoms.filter(|atoms| atoms.truthy()) {
                let content = format!("({})", stringify(atoms));
                self.replacements.push(Replacement {
                    start: span.start,
                    end: span.end,
                    content,
                });
            }
        }

        let theme_hash = self
            .merged_theme
            .get(var_name)
            .filter(|h| !h.is_empty())
            .or_else(|| {
                self.writes
                    .theme_hash
                    .get(&unique_key)
                    .or_else(|| self.tables.theme_hash.get(&unique_key))
                    .filter(|h| !h.is_empty())
            })
            .cloned();
        if let Some(theme_hash) = theme_hash {
            let atomic = self
                .tables
                .atomic_map
                .get(&theme_hash)
                .and_then(|atomic| atomic.as_obj())
                .and_then(|atomic| atomic.get(prop_name));
            let content = match atomic.filter(|value| value.truthy()) {
                Some(value) => format!("({})", stringify(value)),
                None => format!(
                    "({})",
                    quote(&format!(
                        "var(--{theme_hash}-{})",
                        camel_to_kebab_case(prop_name)
                    ))
                ),
            };
            self.replacements.push(Replacement {
                start: span.start,
                end: span.end,
                content,
            });
        }

        let static_hash = self
            .merged_static_hash
            .get(var_name)
            .filter(|h| !h.is_empty())
            .or_else(|| {
                self.writes
                    .static_hash
                    .get(&unique_key)
                    .or_else(|| self.tables.static_hash.get(&unique_key))
                    .filter(|h| !h.is_empty())
            })
            .cloned();
        if let Some(static_hash) = static_hash {
            let object = self
                .writes
                .static_obj
                .get(&static_hash)
                .or_else(|| self.tables.static_obj.get(&static_hash));
            if let Some(value) = object
                .and_then(|object| object.as_obj())
                .and_then(|object| object.get(prop_name))
            {
                let content = format!("({})", stringify(value));
                self.replacements.push(Replacement {
                    start: span.start,
                    end: span.end,
                    content,
                });
            }
        }
    }

    fn identifier(&mut self, ident: &'b IdentifierReference<'a>) {
        if self.is_excluded(ident.span.start) {
            return;
        }
        if !self.visibility().ident(ident) {
            return;
        }
        let name = ident.name.as_str();
        let prefix = if self.shorthand_starts.contains(&ident.span.start) {
            format!("{name}: ")
        } else {
            String::new()
        };
        let span = ident.span;
        let push = |this: &mut Self, content: String| {
            this.replacements.push(Replacement {
                start: span.start,
                end: span.end,
                content: format!("{prefix}{content}"),
            });
        };

        if let Some(style) = self.local_create_styles.get(name) {
            let content = format!("({})", stringify_object(&style.hash_map));
            push(self, content);
            return;
        }
        let unique_key = format!("{}-{name}", self.resource);
        let hash = self
            .merged_create
            .get(name)
            .filter(|h| !h.is_empty())
            .or_else(|| {
                self.tables
                    .create_hash
                    .get(&unique_key)
                    .filter(|h| !h.is_empty())
            })
            .cloned();
        if let Some(hash) = hash
            && let (Some(obj), Some(atomic)) = (
                self.create_object(&hash),
                self.tables.atomic_map.get(&hash).cloned(),
            )
        {
            let hash_map = Self::filtered_hash_map(&obj, &atomic);
            push(self, format!("({})", stringify_object(&hash_map)));
        }
        let theme_hash = self
            .merged_theme
            .get(name)
            .filter(|h| !h.is_empty())
            .or_else(|| {
                self.writes
                    .theme_hash
                    .get(&unique_key)
                    .or_else(|| self.tables.theme_hash.get(&unique_key))
                    .filter(|h| !h.is_empty())
            })
            .cloned();
        if let Some(theme_hash) = theme_hash
            && let Some(atomic) = self.tables.atomic_map.get(&theme_hash).cloned()
        {
            push(self, format!("({})", stringify(&atomic)));
            return;
        }
        let static_hash = self
            .merged_static_hash
            .get(name)
            .filter(|h| !h.is_empty())
            .or_else(|| {
                self.writes
                    .static_hash
                    .get(&unique_key)
                    .or_else(|| self.tables.static_hash.get(&unique_key))
                    .filter(|h| !h.is_empty())
            })
            .cloned();
        if let Some(static_hash) = static_hash {
            let object = self
                .writes
                .static_obj
                .get(&static_hash)
                .or_else(|| self.tables.static_obj.get(&static_hash))
                .cloned();
            if let Some(object) = object {
                push(self, format!("({})", stringify(&object)));
            }
        }
    }

    fn second_pass_call(&mut self, call: &'b CallExpression<'a>) -> TResult<()> {
        let callee = E::new(&call.callee);
        let mut is_use = false;
        match callee.kind() {
            K::Member(_) => {
                let object = callee.object().and_then(|object| object.ident_name());
                if let (Some(object), Some(Prop::Name(property))) = (object, callee.prop()) {
                    if self.style_functions_for(object, property) {
                        self.dynamic_fn_calls.push(call.span);
                    }
                    if self.aliases.get(object).map(String::as_str) == Some(NAMESPACE)
                        && property == "use"
                    {
                        is_use = true;
                    }
                }
            }
            K::Ident(ident)
                if self.aliases.get(ident.name.as_str()).map(String::as_str) == Some("use") =>
            {
                is_use = true;
            }
            _ => {}
        }
        if !is_use {
            return Ok(());
        }
        for argument in &call.arguments {
            let expr = argument_expr(argument);
            let Some(inner) = expr.call() else { continue };
            let inner_callee = E::new(&inner.callee);
            if !inner_callee.is_member() {
                continue;
            }
            let (Some(var_name), Some(Prop::Name(prop_key))) = (
                inner_callee.object().and_then(|object| object.ident_name()),
                inner_callee.prop(),
            ) else {
                continue;
            };
            let has_function = self
                .local_create_styles
                .get(var_name)
                .and_then(|style| style.functions.as_ref())
                .is_some_and(|functions| functions.contains_key(prop_key));
            if has_function {
                return Err(self.fail(
                    format!(
                        "[plumeria] css.use({}) does not support dynamic function keys.",
                        self.source_of(expr)
                    ),
                    Some(inner.span),
                ));
            }
        }
        let args: Vec<(E<'b, 'a>, Option<i64>)> = call
            .arguments
            .iter()
            .map(|argument| (argument_expr(argument), None))
            .collect();
        let built = self.build_class_parts(args, Vec::new(), String::new(), false)?;
        if built.is_optimizable {
            let content = if built.class_parts.is_empty() {
                "\"\"".to_string()
            } else {
                built.class_parts.join(" + \" \" + ")
            };
            self.replacements.push(Replacement {
                start: call.span.start,
                end: call.span.end,
                content,
            });
            Ok(())
        } else {
            Err(self.fail(
                format!(
                    "[plumeria] Dynamic or unresolvable style object \"{}\" is not supported.",
                    self.text(call.span)
                ),
                Some(call.span),
            ))
        }
    }
}

struct FirstPass<'x, 't, 'p, 'b, 'a> {
    t: &'x mut Transformer<'t, 'p, 'b, 'a>,
    error: Option<String>,
}

impl<'x, 't, 'p, 'b, 'a> Visit<'a> for FirstPass<'x, 't, 'p, 'b, 'a> {
    fn visit_import_declaration(&mut self, it: &ImportDeclaration<'a>) {
        if self.error.is_some() {
            return;
        }
        self.t.import_declaration(extend(it));
    }

    fn visit_export_declaration(&mut self, it: &ExportDeclaration<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Declaration::VariableDeclaration(decl) = &it.declaration {
            let decl: &'b VariableDeclaration<'a> = extend(&**decl);
            for declarator in &decl.declarations {
                if let Err(error) = self.t.register_style(declarator, it.span, true) {
                    self.error = Some(error);
                    return;
                }
                self.t.check_style_alias(declarator);
            }
            for declarator in &decl.declarations {
                self.visit_variable_declarator(declarator);
            }
            return;
        }
        walk::walk_export_declaration(self, it);
    }

    fn visit_variable_declaration(&mut self, it: &VariableDeclaration<'a>) {
        if self.error.is_some() {
            return;
        }
        let decl: &'b VariableDeclaration<'a> = extend(it);
        for declarator in &decl.declarations {
            let is_exported = decl.declarations.len() > 1
                || binding_name(&declarator.id)
                    .is_some_and(|name| self.t.separately_exported.contains(name));
            if let Err(error) = self.t.register_style(declarator, decl.span, is_exported) {
                self.error = Some(error);
                return;
            }
            self.t.check_style_alias(declarator);
        }
        walk::walk_variable_declaration(self, it);
    }

    fn visit_call_expression(&mut self, it: &CallExpression<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.t.first_pass_call(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_call_expression(self, it);
    }
}

struct SecondPass<'x, 't, 'p, 'b, 'a> {
    t: &'x mut Transformer<'t, 'p, 'b, 'a>,
    error: Option<String>,
}

impl<'x, 't, 'p, 'b, 'a> Visit<'a> for SecondPass<'x, 't, 'p, 'b, 'a> {
    fn visit_jsx_opening_element(&mut self, it: &JSXOpeningElement<'a>) {
        if self.error.is_some() {
            return;
        }
        let it: &'b JSXOpeningElement<'a> = extend(it);
        let local_imports = self.t.local_imports.clone();
        let resource = self.t.resource.clone();
        let comp_key = self
            .t
            .project
            .resolve_component_key(&it.name, &resource, &local_imports);
        for attribute in &it.attributes {
            if let JSXAttributeItem::Attribute(attribute) = attribute {
                self.t
                    .jsx_owner
                    .insert(attribute.span.start, (comp_key.clone(), &it.attributes));
            }
        }
        for attribute in &it.attributes {
            self.visit_jsx_attribute_item(attribute);
        }
    }

    fn visit_jsx_element_name(&mut self, _it: &JSXElementName<'a>) {}

    fn visit_jsx_member_expression(&mut self, _it: &JSXMemberExpression<'a>) {}

    fn visit_static_member_expression(&mut self, it: &StaticMemberExpression<'a>) {
        if self.error.is_some() {
            return;
        }
        self.t.member_expression(Member::Static(extend(it)));
        walk::walk_static_member_expression(self, it);
    }

    fn visit_computed_member_expression(&mut self, it: &ComputedMemberExpression<'a>) {
        if self.error.is_some() {
            return;
        }
        self.t.member_expression(Member::Computed(extend(it)));
        walk::walk_computed_member_expression(self, it);
    }

    fn visit_identifier_reference(&mut self, it: &IdentifierReference<'a>) {
        if self.error.is_some() {
            return;
        }
        self.t.identifier(extend(it));
    }

    fn visit_object_property(&mut self, it: &ObjectProperty<'a>) {
        if it.shorthand {
            self.t.shorthand_starts.insert(it.value.span().start);
        }
        walk::walk_object_property(self, it);
    }

    fn visit_jsx_attribute(&mut self, it: &JSXAttribute<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.t.jsx_attribute(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_jsx_attribute(self, it);
    }

    fn visit_call_expression(&mut self, it: &CallExpression<'a>) {
        if self.error.is_some() {
            return;
        }
        if let Err(error) = self.t.second_pass_call(extend(it)) {
            self.error = Some(error);
            return;
        }
        walk::walk_call_expression(self, it);
    }

    fn visit_export_named_declaration(&mut self, _it: &ExportNamedDeclaration<'a>) {}

    fn visit_ts_type_annotation(&mut self, _it: &TSTypeAnnotation<'a>) {}

    fn visit_ts_type_parameter_instantiation(&mut self, _it: &TSTypeParameterInstantiation<'a>) {}

    fn visit_ts_type_parameter_declaration(&mut self, _it: &TSTypeParameterDeclaration<'a>) {}

    fn visit_ts_type_alias_declaration(&mut self, _it: &TSTypeAliasDeclaration<'a>) {}

    fn visit_ts_interface_declaration(&mut self, _it: &TSInterfaceDeclaration<'a>) {}

    fn visit_ts_type(&mut self, _it: &TSType<'a>) {}
}
