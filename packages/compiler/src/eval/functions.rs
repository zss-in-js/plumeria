use indexmap::IndexMap;
use oxc_ast::ast::*;
use rustc_hash::{FxBuildHasher, FxHashSet};

use oxc_syntax::operator::{BinaryOperator, UnaryOperator};

use super::{Env, EvalResult, Evaluator, Layer, Lookup, Replacements};
use crate::engine::hash::hash_object;
use crate::js::json::quote;
use crate::js::number::number_to_string;
use crate::js::{Object, Value};
use crate::style::units::{VarGroup, VarUnit, apply_var_fallback, split_var_by_unit};
use crate::syntax::expr::{BinOp, E, K, expression_label, unwrap};
use crate::syntax::visit::{reads_names_expr, reads_names_property};

#[derive(Clone, Debug)]
pub struct NamedParam {
    pub key: String,
    pub local: String,
}

#[derive(Clone)]
pub struct StyleFunction<'b, 'a> {
    pub params: Vec<String>,
    pub unsupported_params: bool,
    pub named: Option<Vec<NamedParam>>,
    pub defaults: IndexMap<String, &'b Expression<'a>, FxBuildHasher>,
    pub body: &'b ObjectExpression<'a>,
}

pub type StyleFunctions<'b, 'a> = IndexMap<String, StyleFunction<'b, 'a>, FxBuildHasher>;

pub struct ParamView<'b, 'a> {
    pub pattern: Option<&'b BindingPattern<'a>>,
    pub initializer: Option<&'b Expression<'a>>,
    pub rest: bool,
}

pub fn param_views<'b, 'a>(params: &'b FormalParameters<'a>) -> Vec<ParamView<'b, 'a>> {
    let mut views: Vec<ParamView> = params
        .items
        .iter()
        .map(|item| ParamView {
            pattern: Some(&item.pattern),
            initializer: item.initializer.as_deref(),
            rest: false,
        })
        .collect();
    if let Some(rest) = &params.rest {
        views.push(ParamView {
            pattern: Some(&rest.rest.argument),
            initializer: None,
            rest: true,
        });
    }
    views
}

fn named_params_of<'b, 'a>(
    params: &[ParamView<'b, 'a>],
    defaults: &mut IndexMap<String, &'b Expression<'a>, FxBuildHasher>,
) -> Option<Vec<NamedParam>> {
    if params.len() != 1 {
        return None;
    }
    let first = &params[0];
    if first.rest || first.initializer.is_some() {
        return None;
    }
    let BindingPattern::ObjectPattern(pattern) = first.pattern? else {
        return None;
    };
    if pattern.rest.is_some() {
        return None;
    }
    let mut named = Vec::new();
    for prop in &pattern.properties {
        if prop.computed {
            return None;
        }
        let PropertyKey::StaticIdentifier(key) = &prop.key else {
            return None;
        };
        let key = key.name.as_str();
        if prop.shorthand {
            match &prop.value {
                BindingPattern::BindingIdentifier(_) => {
                    named.push(NamedParam {
                        key: key.to_string(),
                        local: key.to_string(),
                    });
                }
                BindingPattern::AssignmentPattern(assign) => {
                    named.push(NamedParam {
                        key: key.to_string(),
                        local: key.to_string(),
                    });
                    defaults.insert(key.to_string(), &assign.right);
                }
                _ => return None,
            }
            continue;
        }
        match &prop.value {
            BindingPattern::BindingIdentifier(local) => {
                named.push(NamedParam {
                    key: key.to_string(),
                    local: local.name.to_string(),
                });
            }
            BindingPattern::AssignmentPattern(assign) => {
                let BindingPattern::BindingIdentifier(local) = &assign.left else {
                    return None;
                };
                named.push(NamedParam {
                    key: key.to_string(),
                    local: local.name.to_string(),
                });
                defaults.insert(local.name.to_string(), &assign.right);
            }
            _ => return None,
        }
    }
    if named.is_empty() { None } else { Some(named) }
}

#[derive(Clone, Copy)]
pub enum Body<'b, 'a> {
    Block(&'b FunctionBody<'a>),
    Expr(&'b Expression<'a>),
}

pub fn function_parts<'b, 'a>(
    value: &'b Expression<'a>,
) -> Option<(&'b FormalParameters<'a>, Body<'b, 'a>)> {
    match value {
        Expression::ArrowFunctionExpression(arrow) => Some((&arrow.params, arrow_body(arrow))),
        Expression::FunctionExpression(function) => function
            .body
            .as_deref()
            .map(|body| (&*function.params, Body::Block(body))),
        _ => None,
    }
}

pub fn arrow_body<'b, 'a>(arrow: &'b ArrowFunctionExpression<'a>) -> Body<'b, 'a> {
    match &arrow.body {
        ArrowFunctionBody::FunctionBody(body) => Body::Block(body),
        other => Body::Expr(other.to_expression()),
    }
}

pub fn returned_expression<'b, 'a>(body: Body<'b, 'a>) -> Option<&'b Expression<'a>> {
    match body {
        Body::Expr(expr) => Some(expr),
        Body::Block(block) => match block.statements.first()? {
            Statement::ReturnStatement(statement) => statement.argument.as_ref(),
            _ => None,
        },
    }
}

fn strip_one_paren<'b, 'a>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    match expr {
        Expression::ParenthesizedExpression(paren) => &paren.expression,
        other => other,
    }
}

pub fn style_function_body<'b, 'a>(value: &'b Expression<'a>) -> Option<&'b ObjectExpression<'a>> {
    let (_, body) = function_parts(value)?;
    let returned = strip_one_paren(returned_expression(body)?);
    match returned {
        Expression::ObjectExpression(object) => Some(object),
        _ => None,
    }
}

pub fn style_functions_of<'b, 'a>(object: &'b ObjectExpression<'a>) -> StyleFunctions<'b, 'a> {
    let mut functions = StyleFunctions::default();
    for prop in &object.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            continue;
        };
        if prop.computed || prop.shorthand || prop.method || prop.kind != PropertyKind::Init {
            continue;
        }
        let PropertyKey::StaticIdentifier(key) = &prop.key else {
            continue;
        };
        let Some((params, _)) = function_parts(&prop.value) else {
            continue;
        };
        let views = param_views(params);

        let mut defaults: IndexMap<String, &'b Expression<'a>, FxBuildHasher> = IndexMap::default();
        let names: Vec<String> = views
            .iter()
            .map(|view| {
                if view.rest {
                    return "arg".to_string();
                }
                match (view.pattern, view.initializer) {
                    (Some(BindingPattern::BindingIdentifier(ident)), None) => {
                        ident.name.to_string()
                    }
                    (Some(BindingPattern::BindingIdentifier(ident)), Some(right)) => {
                        defaults.insert(ident.name.to_string(), right);
                        ident.name.to_string()
                    }
                    _ => "arg".to_string(),
                }
            })
            .collect();

        let Some(body) = style_function_body(&prop.value) else {
            continue;
        };

        let unsupported = views.iter().any(|view| {
            if view.rest {
                return true;
            }
            if view.initializer.is_some() {
                return false;
            }
            match view.pattern {
                Some(BindingPattern::ArrayPattern(_)) => true,
                Some(BindingPattern::ObjectPattern(_)) => {
                    let mut scratch = IndexMap::default();
                    named_params_of(&views, &mut scratch).is_none()
                }
                _ => false,
            }
        });
        let named = named_params_of(&views, &mut defaults);

        functions.insert(
            key.name.to_string(),
            StyleFunction {
                params: names,
                unsupported_params: unsupported,
                named,
                defaults,
                body,
            },
        );
    }
    functions
}

#[derive(Clone, Debug, PartialEq)]
pub enum DerivedPiece {
    Text(String),
    Param(String, Option<String>),
}

#[derive(Clone, Debug)]
pub struct DerivedVar {
    pub name: String,
    pub pieces: Vec<DerivedPiece>,
}

enum Replacement {
    Constant(f64),
    Derived(String),
}

pub fn is_defined_argument(node: E) -> bool {
    let node = unwrap(node);
    match node.kind() {
        K::Str(_) | K::Num(_) | K::Bool(_) | K::Null | K::Template(_) => true,
        K::Unary(unary) => {
            is_sign(unary.operator) && matches!(unwrap(E::new(&unary.argument)).kind(), K::Num(_))
        }
        _ => false,
    }
}

fn default_error(param: &str, node: E, literal: Option<&Value>) -> String {
    let kind = match (node.kind(), literal) {
        (K::Null, _) | (_, Some(Value::Null)) => Some("null"),
        (_, Some(Value::Bool(_))) => Some("a boolean"),
        (_, Some(_)) => Some("an object"),
        _ => None,
    };
    match kind {
        Some(kind) => format!(
            "[plumeria] The default of \"{param}\" is {kind}, which a dynamic style function cannot fall back on. Use a string or a number, or pass the value from the call."
        ),
        None => format!(
            "[plumeria] Cannot resolve the default of \"{param}\" at build time ({}). A dynamic style function falls back on it when the argument is undefined, so it has to be a string or a number plumeria can read. Pass the value from the call instead.",
            expression_label(node)
        ),
    }
}

fn literal_source(value: &Value) -> Option<String> {
    match value {
        Value::Str(text) => Some(quote(text)),
        Value::Num(number) => {
            let text = number_to_string(*number);
            Some(if text.starts_with('-') {
                format!("({text})")
            } else {
                text
            })
        }
        _ => None,
    }
}

struct Deriver<'d> {
    runtime: &'d [String],
    vars: &'d [String],
    defaults: &'d IndexMap<String, Value, FxBuildHasher>,
    evaluate: &'d dyn Fn(E) -> Option<Value>,
    derived: Vec<DerivedVar>,
    replacements: Vec<((u32, u32), Replacement)>,
}

fn is_arithmetic(operator: BinaryOperator) -> bool {
    matches!(
        operator,
        BinaryOperator::Addition
            | BinaryOperator::Subtraction
            | BinaryOperator::Multiplication
            | BinaryOperator::Division
            | BinaryOperator::Remainder
            | BinaryOperator::Exponential
    )
}

fn is_sign(operator: UnaryOperator) -> bool {
    matches!(
        operator,
        UnaryOperator::UnaryNegation | UnaryOperator::UnaryPlus
    )
}

fn reads(node: E, names: &[String]) -> bool {
    node.expr()
        .is_some_and(|expr| reads_names_expr(expr, &|name| names.iter().any(|param| param == name)))
}

impl Deriver<'_> {
    fn render(&self, expression: E) -> Option<Vec<DerivedPiece>> {
        let node = unwrap(expression);
        match node.kind() {
            K::Ident(ident)
                if self
                    .runtime
                    .iter()
                    .any(|param| param == ident.name.as_str()) =>
            {
                let name = ident.name.as_str();
                let fallback = self.defaults.get(name).and_then(literal_source);
                return Some(vec![DerivedPiece::Param(name.to_string(), fallback)]);
            }
            K::Binary(left, BinOp::Binary(operator), right) if is_arithmetic(operator) => {
                let left = self.render(left)?;
                let right = self.render(right)?;
                let mut pieces = vec![DerivedPiece::Text("(".to_string())];
                pieces.extend(left);
                pieces.push(DerivedPiece::Text(format!(" {} ", operator.as_str())));
                pieces.extend(right);
                pieces.push(DerivedPiece::Text(")".to_string()));
                return Some(pieces);
            }
            K::Unary(unary) if is_sign(unary.operator) => {
                let argument = self.render(E::new(&unary.argument))?;
                let mut pieces = vec![
                    DerivedPiece::Text("(".to_string()),
                    DerivedPiece::Text(unary.operator.as_str().to_string()),
                    DerivedPiece::Text("(".to_string()),
                ];
                pieces.extend(argument);
                pieces.push(DerivedPiece::Text(")".to_string()));
                pieces.push(DerivedPiece::Text(")".to_string()));
                return Some(pieces);
            }
            _ => {}
        }
        if reads(node, self.runtime) {
            return None;
        }
        match (self.evaluate)(node) {
            Some(value @ Value::Num(_)) => {
                literal_source(&value).map(|text| vec![DerivedPiece::Text(text)])
            }
            _ => None,
        }
    }

    fn register(&mut self, node: E, pieces: Vec<DerivedPiece>) {
        let span = node.span();
        let key = (span.start, span.end);
        let first = pieces.iter().find_map(|piece| match piece {
            DerivedPiece::Param(param, _) => Some(param.clone()),
            DerivedPiece::Text(_) => None,
        });
        let Some(first) = first else {
            if let Some(Value::Num(number)) = (self.evaluate)(node) {
                self.replacements.push((key, Replacement::Constant(number)));
            }
            return;
        };
        let name = match self.derived.iter().find(|entry| entry.pieces == pieces) {
            Some(entry) => entry.name.clone(),
            None => {
                let name = format!("{first}-{}", self.derived.len() + 1);
                self.derived.push(DerivedVar {
                    name: name.clone(),
                    pieces,
                });
                name
            }
        };
        self.replacements.push((key, Replacement::Derived(name)));
    }

    fn visit_object(&mut self, object: &ObjectExpression) {
        for prop in &object.properties {
            let ObjectPropertyKind::ObjectProperty(prop) = prop else {
                continue;
            };
            if prop.shorthand || prop.method || prop.kind != PropertyKind::Init {
                continue;
            }
            self.visit(E::new(&prop.value));
        }
    }

    fn visit(&mut self, expression: E) {
        let node = unwrap(expression);
        let operands = match node.kind() {
            K::Object(object) => {
                self.visit_object(object);
                return;
            }
            K::Template(template) => {
                for expr in &template.expressions {
                    self.visit(E::new(expr));
                }
                return;
            }
            K::Binary(left, BinOp::Binary(operator), right) if is_arithmetic(operator) => {
                (operator == BinaryOperator::Addition).then_some((left, right))
            }
            K::Unary(unary) if is_sign(unary.operator) => None,
            _ => return,
        };
        if !reads(node, self.vars) {
            return;
        }
        if let Some(mut pieces) = self.render(node) {
            pieces.pop();
            pieces.remove(0);
            self.register(node, pieces);
            return;
        }
        if let Some((left, right)) = operands {
            self.visit(left);
            self.visit(right);
        }
    }
}

pub struct DynamicStyle {
    pub style: Object,
    pub var_groups: IndexMap<String, Vec<VarGroup>, FxBuildHasher>,
    pub derived: Vec<DerivedVar>,
}

pub fn resolve_dynamic_style(
    func: &StyleFunction,
    runtime_params: &[String],
    statics: &dyn Lookup<Value>,
    tables: Env,
    provided: Option<&FxHashSet<String>>,
    definite: &[String],
) -> EvalResult<DynamicStyle> {
    if func.unsupported_params {
        return Err(
            "[plumeria] Dynamic styles require named parameters or object destructuring; array and rest parameters are not supported."
                .to_string(),
        );
    }
    let mut temp: Layer<Value> = Layer::over(statics);

    let with_default: Vec<(String, &Expression)> = func
        .defaults
        .iter()
        .filter(|(param, _)| match provided {
            Some(provided) => !provided.contains(param.as_str()),
            None => temp.lookup(param).is_none(),
        })
        .map(|(param, expr)| (param.clone(), *expr))
        .collect();

    let mut default_literals: IndexMap<String, Value, FxBuildHasher> = IndexMap::default();
    for (param, expr) in &with_default {
        let node = unwrap(E::new(expr));
        if node.is_undefined_ident() {
            continue;
        }
        let is_definite = definite.contains(param)
            || !func
                .body
                .properties
                .iter()
                .any(|prop| reads_names_property(prop, &|name| name == param.as_str()));
        let literal =
            match Evaluator::new(tables.with_statics(statics)).property_value(E::new(expr)) {
                Ok(literal) => literal,
                Err(_) if is_definite => continue,
                Err(error) => return Err(error),
            };
        match literal {
            Some(literal @ (Value::Str(_) | Value::Num(_))) => {
                default_literals.insert(param.clone(), literal);
            }
            _ if is_definite => {}
            other => return Err(default_error(param, node, other.as_ref())),
        }
    }
    let hole_defaults: IndexMap<String, Value, FxBuildHasher> = default_literals
        .iter()
        .filter(|(param, _)| !definite.contains(*param))
        .map(|(param, literal)| (param.clone(), literal.clone()))
        .collect();

    let mut var_params: Vec<String> = Vec::new();
    for param in runtime_params
        .iter()
        .chain(with_default.iter().map(|(param, _)| param))
    {
        if !var_params.contains(param) {
            var_params.push(param.clone());
        }
    }

    let mut constants: Layer<Value> = Layer::over(statics);
    for (param, literal) in &default_literals {
        if !runtime_params.contains(param) {
            constants.set(param.clone(), literal.clone());
        }
    }
    let evaluate = |node: E| {
        Evaluator::new(tables.with_statics(&constants))
            .property_value(node)
            .ok()
            .flatten()
    };
    let mut deriver = Deriver {
        runtime: runtime_params,
        vars: &var_params,
        defaults: &hole_defaults,
        evaluate: &evaluate,
        derived: Vec::new(),
        replacements: Vec::new(),
    };
    deriver.visit_object(func.body);
    let Deriver {
        derived,
        replacements: planned,
        ..
    } = deriver;

    let mut replacements = Replacements::default();
    for (key, replacement) in &planned {
        let value = match replacement {
            Replacement::Constant(number) => Value::Num(*number),
            Replacement::Derived(name) => Value::str(name.as_str()),
        };
        replacements.insert(*key, value);
    }

    let var_names: Vec<String> = var_params
        .iter()
        .cloned()
        .chain(derived.iter().map(|entry| entry.name.clone()))
        .collect();

    let mut css_vars: IndexMap<String, String, FxBuildHasher> = IndexMap::default();
    if !var_names.is_empty() {
        for param in &var_params {
            temp.set(param.clone(), Value::str(param.as_str()));
        }
        let probe = Evaluator::with_replacements(tables.with_statics(&temp), &replacements)
            .object(func.body)?;
        let hash = hash_object(&probe);
        for name in &var_names {
            css_vars.insert(name.clone(), format!("--{hash}-{name}"));
        }
        for param in &var_params {
            temp.set(
                param.clone(),
                Value::Str(format!("var({})", css_vars[param])),
            );
        }
        for (key, replacement) in &planned {
            if let Replacement::Derived(name) = replacement {
                replacements.insert(*key, Value::Str(format!("var({})", css_vars[name])));
            }
        }
    }

    let mut style = Evaluator::with_replacements(tables.with_statics(&temp), &replacements)
        .object(func.body)?;

    let mut var_groups: IndexMap<String, Vec<VarGroup>, FxBuildHasher> = IndexMap::default();
    for name in &var_names {
        let css_var = css_vars.get(name).cloned().unwrap_or_default();
        let groups = split_var_by_unit(&mut style, &css_var);
        var_groups.insert(name.clone(), groups);
    }

    for (param, literal) in &default_literals {
        if let Some(groups) = var_groups.get(param) {
            for group in groups.clone() {
                apply_var_fallback(
                    &mut style,
                    &group.css_var,
                    literal,
                    &VarUnit {
                        unit: group.unit.clone(),
                        written: group.written,
                    },
                );
            }
        }
    }

    Ok(DynamicStyle {
        style,
        var_groups,
        derived,
    })
}
