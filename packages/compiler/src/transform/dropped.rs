use oxc_ast::ast::*;
use oxc_span::GetSpan;
use rustc_hash::FxHashSet;

use crate::eval::Evaluator;
use crate::eval::consts::ConstNodes;
use crate::eval::functions::{Body, function_parts, param_views};
use crate::js::number::number_to_string;
use crate::js::{Object, Value};
use crate::syntax::expr::{E, swc_type_name};
use crate::syntax::visit::expression_has_identifier;

#[derive(Clone, PartialEq)]
enum KeyVal {
    Str(String),
    Num(f64),
}

impl KeyVal {
    fn text(&self) -> String {
        match self {
            KeyVal::Str(text) => text.clone(),
            KeyVal::Num(number) => number_to_string(*number),
        }
    }
}

fn key_value(prop: &ObjectProperty) -> Option<KeyVal> {
    if prop.computed {
        return None;
    }
    match &prop.key {
        PropertyKey::StaticIdentifier(ident) => Some(KeyVal::Str(ident.name.to_string())),
        PropertyKey::StringLiteral(value) => Some(KeyVal::Str(value.value.to_string())),
        PropertyKey::NumericLiteral(value) => Some(KeyVal::Num(value.value)),
        _ => None,
    }
}

fn as_key_value<'b, 'a>(prop: &'b ObjectPropertyKind<'a>) -> Option<&'b ObjectProperty<'a>> {
    match prop {
        ObjectPropertyKind::ObjectProperty(p)
            if !p.shorthand && !p.method && p.kind == PropertyKind::Init =>
        {
            Some(p)
        }
        _ => None,
    }
}

pub struct SpreadInfo<'b, 'a> {
    values: Object,
    source: Option<&'b ObjectExpression<'a>>,
}

pub struct Context<'c, 'e, 'r, 'b, 'a> {
    pub evaluator: Evaluator<'e, 'r>,
    pub const_nodes: &'c ConstNodes<'b, 'a>,
    pub source: &'c str,
}

impl<'c, 'e, 'r, 'b, 'a> Context<'c, 'e, 'r, 'b, 'a> {
    fn spread(&self, prop: &'b ObjectPropertyKind<'a>) -> Option<SpreadInfo<'b, 'a>> {
        let mut values = Object::new();
        self.evaluator.plain_property_into(prop, &mut values).ok()?;
        let source = match prop {
            ObjectPropertyKind::SpreadProperty(spread) => match &spread.argument {
                Expression::Identifier(ident) => match self.const_nodes.get(ident.name.as_str()) {
                    Some(Expression::ObjectExpression(object)) => Some(&**object),
                    _ => None,
                },
                _ => None,
            },
            _ => None,
        };
        Some(SpreadInfo { values, source })
    }

    fn resolves_value(&self, value: &Expression) -> bool {
        matches!(
            self.evaluator.plain_property_value(E::new(value)),
            Ok(Some(_))
        )
    }

    fn source_of(&self, node: &Expression) -> String {
        let span = node.span();
        self.source
            .get(span.start as usize..span.end as usize)
            .unwrap_or_default()
            .to_string()
    }

    fn unresolvable(&self, key: &str, node: &Expression) -> String {
        format!(
            "[plumeria] Cannot resolve the value of \"{key}\" at build time ({}). Values in css.create must be statically known; pass a runtime value through the function form, css.create({{ name: (value) => ({{ ... }}) }}).",
            self.source_of(node)
        )
    }

    fn overwritten_later(
        &self,
        properties: &'b [ObjectPropertyKind<'a>],
        index: usize,
        key: &KeyVal,
    ) -> bool {
        for later in &properties[index + 1..] {
            if let ObjectPropertyKind::SpreadProperty(_) = later {
                match self.spread(later) {
                    None => return true,
                    Some(provided) => {
                        if provided.values.contains_key(&key.text()) {
                            return true;
                        }
                    }
                }
                continue;
            }
            if let Some(p) = as_key_value(later)
                && key_value(p).as_ref() == Some(key)
            {
                return true;
            }
        }
        false
    }

    fn keys_supplied_after(
        &self,
        properties: &'b [ObjectPropertyKind<'a>],
        index: usize,
    ) -> Option<FxHashSet<String>> {
        let mut keys = FxHashSet::default();
        for later in &properties[index + 1..] {
            if let ObjectPropertyKind::SpreadProperty(_) = later {
                let provided = self.spread(later)?;
                for (name, _) in provided.values.iter() {
                    keys.insert(name.to_string());
                }
                continue;
            }
            let Some(p) = as_key_value(later) else {
                continue;
            };
            keys.insert(key_value(p)?.text());
        }
        Some(keys)
    }

    fn assert_style_function(&self, func: &'b Expression<'a>) -> Result<(), String> {
        let Some((params, body)) = function_parts(func) else {
            return Ok(());
        };
        let mut names: FxHashSet<String> = FxHashSet::default();
        for view in param_views(params) {
            if let Some(pattern) = view.pattern {
                parameter_names(pattern, &mut names);
            }
        }
        let returned = match body {
            Body::Expr(Expression::ObjectExpression(object)) => object,
            Body::Expr(Expression::ParenthesizedExpression(paren)) => match &paren.expression {
                Expression::ObjectExpression(object) => object,
                _ => return Ok(()),
            },
            _ => return Ok(()),
        };
        self.walk_style_function(returned, &names)
    }

    fn walk_style_function(
        &self,
        object: &'b ObjectExpression<'a>,
        params: &FxHashSet<String>,
    ) -> Result<(), String> {
        for (index, prop) in object.properties.iter().enumerate() {
            let Some(p) = as_key_value(prop) else {
                continue;
            };
            let key = key_value(p);
            if let Some(key) = &key
                && self.overwritten_later(&object.properties, index, key)
            {
                continue;
            }
            let value = &p.value;
            if let Expression::ObjectExpression(inner) = value {
                self.walk_style_function(inner, params)?;
                continue;
            }
            let reads = expression_has_identifier(value, &|name| params.contains(name));
            let key_text = key.as_ref().map(KeyVal::text).unwrap_or_default();
            let runtime_only = matches!(
                swc_type_name(value),
                "CallExpression"
                    | "NewExpression"
                    | "AwaitExpression"
                    | "TaggedTemplateExpression"
                    | "YieldExpression"
            );
            if runtime_only && !reads {
                return Err(self.unresolvable(&key_text, value));
            }
            let is_reference = matches!(swc_type_name(value), "Identifier" | "MemberExpression");
            if is_reference && !reads && !self.resolves_value(value) {
                return Err(self.unresolvable(&key_text, value));
            }
        }
        Ok(())
    }

    pub fn assert_no_dropped_values(
        &self,
        node: &'b ObjectExpression<'a>,
        resolved: &Object,
        ignore: Option<&FxHashSet<String>>,
    ) -> Result<(), String> {
        for (index, prop) in node.properties.iter().enumerate() {
            if let ObjectPropertyKind::SpreadProperty(_) = prop {
                let Some(provided) = self.spread(prop) else {
                    continue;
                };
                let Some(source) = provided.source else {
                    continue;
                };
                if let Some(replaced) = self.keys_supplied_after(&node.properties, index) {
                    self.assert_no_dropped_values(source, &provided.values, Some(&replaced))?;
                }
                continue;
            }
            let Some(p) = as_key_value(prop) else {
                continue;
            };
            let Some(key) = key_value(p) else { continue };
            let key_text = key.text();
            if ignore.is_some_and(|ignore| ignore.contains(&key_text)) {
                continue;
            }
            if self.overwritten_later(&node.properties, index, &key) {
                continue;
            }
            let value = &p.value;
            if matches!(
                value,
                Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
            ) {
                self.assert_style_function(value)?;
                continue;
            }
            if matches!(value, Expression::NullLiteral(_)) {
                continue;
            }
            let Some(nested) = resolved.get(&key_text) else {
                return Err(self.unresolvable(&key_text, value));
            };
            if let Expression::ObjectExpression(inner) = value
                && let Value::Obj(nested) = nested
            {
                self.assert_no_dropped_values(inner, nested, None)?;
            }
        }
        Ok(())
    }
}

fn parameter_names(pattern: &BindingPattern, out: &mut FxHashSet<String>) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            out.insert(ident.name.to_string());
        }
        BindingPattern::ObjectPattern(object) => {
            for prop in &object.properties {
                if !prop.computed
                    && let PropertyKey::StaticIdentifier(ident) = &prop.key
                {
                    out.insert(ident.name.to_string());
                }
                match &prop.value {
                    BindingPattern::AssignmentPattern(assign) if prop.shorthand => {
                        parameter_names(&assign.left, out);
                        expression_names(&assign.right, out);
                    }
                    other => parameter_names(other, out),
                }
            }
            if let Some(rest) = &object.rest {
                parameter_names(&rest.argument, out);
            }
        }
        BindingPattern::ArrayPattern(array) => {
            for element in array.elements.iter().flatten() {
                parameter_names(element, out);
            }
            if let Some(rest) = &array.rest {
                parameter_names(&rest.argument, out);
            }
        }
        BindingPattern::AssignmentPattern(assign) => parameter_names(&assign.left, out),
    }
}

fn expression_names(expr: &Expression, out: &mut FxHashSet<String>) {
    match expr {
        Expression::Identifier(ident) => {
            out.insert(ident.name.to_string());
        }
        Expression::BinaryExpression(binary) => expression_names(&binary.left, out),
        Expression::LogicalExpression(logical) => expression_names(&logical.left, out),
        Expression::UnaryExpression(unary) => expression_names(&unary.argument, out),
        _ => {}
    }
}
