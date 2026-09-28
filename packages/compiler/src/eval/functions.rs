use indexmap::IndexMap;
use oxc_ast::ast::*;
use rustc_hash::{FxBuildHasher, FxHashSet};

use super::{Env, EvalResult, Evaluator, Layer, Lookup};
use crate::engine::hash::hash_object;
use crate::js::{Object, Value};
use crate::style::units::{VarGroup, VarUnit, apply_var_fallback, split_var_by_unit};
use crate::syntax::expr::E;

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

pub struct DynamicStyle {
    pub style: Object,
    pub var_groups: IndexMap<String, Vec<VarGroup>, FxBuildHasher>,
}

pub fn resolve_dynamic_style(
    func: &StyleFunction,
    runtime_params: &[String],
    statics: &dyn Lookup<Value>,
    tables: Env,
    provided: Option<&FxHashSet<String>>,
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

    let mut var_params: Vec<String> = Vec::new();
    for param in runtime_params
        .iter()
        .chain(with_default.iter().map(|(param, _)| param))
    {
        if !var_params.contains(param) {
            var_params.push(param.clone());
        }
    }

    let mut css_vars: IndexMap<String, String, FxBuildHasher> = IndexMap::default();
    if !var_params.is_empty() {
        for param in &var_params {
            temp.set(param.clone(), Value::str(param.as_str()));
        }
        let probe = Evaluator::new(tables.with_statics(&temp)).object(func.body)?;
        let hash = hash_object(&probe);
        for param in &var_params {
            let css_var = format!("--{hash}-{param}");
            temp.set(param.clone(), Value::Str(format!("var({css_var})")));
            css_vars.insert(param.clone(), css_var);
        }
    }

    let mut style = Evaluator::new(tables.with_statics(&temp)).object(func.body)?;

    let mut var_groups: IndexMap<String, Vec<VarGroup>, FxBuildHasher> = IndexMap::default();
    for param in &var_params {
        let css_var = css_vars.get(param).cloned().unwrap_or_default();
        let groups = split_var_by_unit(&mut style, &css_var);
        var_groups.insert(param.clone(), groups);
    }

    for (param, expr) in with_default {
        let literal = Evaluator::new(tables.with_statics(statics)).property_value(E::new(expr))?;
        let Some(literal) = literal else { continue };
        if !matches!(literal, Value::Str(_) | Value::Num(_)) {
            continue;
        }
        if let Some(groups) = var_groups.get(&param) {
            for group in groups.clone() {
                apply_var_fallback(
                    &mut style,
                    &group.css_var,
                    &literal,
                    &VarUnit {
                        unit: group.unit.clone(),
                        written: group.written,
                    },
                );
            }
        }
    }

    Ok(DynamicStyle { style, var_groups })
}
