use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};

use crate::engine::camel_to_kebab_case;
use crate::engine::kebab_to_camel_case;
use crate::engine::logical_physical::{Spelling, counterpart_of, spelling_of};
use crate::fs::path::basename;
use crate::syntax::module::{Aliases, CORE, add_core_aliases, plumeria_method};

#[derive(Clone, Copy, Debug, Default)]
pub struct PolicyOption {
    pub enabled: bool,
    pub sizes: bool,
}

#[derive(Clone, Copy, Debug)]
pub struct PropertyPolicy {
    pub reject: Spelling,
    pub include_axes: bool,
}

pub fn resolve_property_policy(
    logical: PolicyOption,
    physical: PolicyOption,
) -> Result<Option<PropertyPolicy>, String> {
    if logical.enabled && physical.enabled {
        return Err("[plumeria] withoutLogicalProperties and withoutPhysicalProperties contradict each other. Enable only the one this project writes against.".to_string());
    }
    if logical.enabled {
        return Ok(Some(PropertyPolicy {
            reject: Spelling::Logical,
            include_axes: logical.sizes,
        }));
    }
    if physical.enabled {
        return Ok(Some(PropertyPolicy {
            reject: Spelling::Physical,
            include_axes: physical.sizes,
        }));
    }
    Ok(None)
}

fn message(reject: Spelling, name: &str, counterpart: &str) -> String {
    match reject {
        Spelling::Physical => format!(
            "'{name}' is the physical name of this property. Write it as '{counterpart}', which follows the writing mode."
        ),
        Spelling::Logical => format!(
            "'{name}' is the logical name of this property. This project is written in physical properties; use '{counterpart}'."
        ),
    }
}

fn style_object_of<'b, 'a>(node: &'b Expression<'a>) -> Option<&'b ObjectExpression<'a>> {
    match node {
        Expression::ObjectExpression(object) => Some(object),
        Expression::ArrowFunctionExpression(arrow) => match &arrow.body {
            ArrowFunctionBody::FunctionBody(_) => None,
            other => match other.to_expression() {
                Expression::ObjectExpression(object) => Some(object),
                Expression::ParenthesizedExpression(paren) => style_object_of(&paren.expression),
                _ => None,
            },
        },
        _ => None,
    }
}

fn key_name<'b>(prop: &'b ObjectProperty) -> &'b str {
    if prop.computed {
        return "";
    }
    match &prop.key {
        PropertyKey::StaticIdentifier(ident) => ident.name.as_str(),
        PropertyKey::StringLiteral(value) => value.value.as_str(),
        _ => "",
    }
}

fn is_key_value<'b, 'a>(prop: &'b ObjectPropertyKind<'a>) -> Option<&'b ObjectProperty<'a>> {
    match prop {
        ObjectPropertyKind::ObjectProperty(p)
            if !p.shorthand && !p.method && p.kind == PropertyKind::Init =>
        {
            Some(p)
        }
        _ => None,
    }
}

struct Check<'p> {
    policy: PropertyPolicy,
    resource: &'p str,
    aliases: Aliases,
    error: Option<String>,
}

impl Check<'_> {
    fn check(&mut self, node: &ObjectExpression) {
        for prop in &node.properties {
            if self.error.is_some() {
                return;
            }
            let Some(prop) = is_key_value(prop) else {
                continue;
            };
            if let Some(nested) = style_object_of(&prop.value) {
                self.check(nested);
                continue;
            }
            let name = key_name(prop);
            if name.is_empty() {
                continue;
            }
            let kebab = camel_to_kebab_case(name);
            if spelling_of(&kebab, self.policy.include_axes) != Some(self.policy.reject) {
                continue;
            }
            let counterpart = kebab_to_camel_case(counterpart_of(&kebab).unwrap_or(""));
            self.error = Some(format!(
                "[plumeria] {} ({})",
                message(self.policy.reject, name, &counterpart),
                basename(self.resource)
            ));
        }
    }
}

impl<'a> Visit<'a> for Check<'_> {
    fn visit_import_declaration(&mut self, it: &ImportDeclaration<'a>) {
        if it.source.value.as_str() == CORE {
            add_core_aliases(it, &mut self.aliases);
        }
        walk::walk_import_declaration(self, it);
    }

    fn visit_call_expression(&mut self, it: &CallExpression<'a>) {
        if self.error.is_some() {
            return;
        }
        let api = plumeria_method(&it.callee, &self.aliases).map(str::to_string);
        if let Some(api) = api
            && ["create", "keyframes", "viewTransition"].contains(&api.as_str())
        {
            for argument in &it.arguments {
                let expr = match argument {
                    Argument::SpreadElement(spread) => &spread.argument,
                    other => other.to_expression(),
                };
                let Expression::ObjectExpression(object) = expr else {
                    continue;
                };
                for prop in &object.properties {
                    let Some(prop) = is_key_value(prop) else {
                        continue;
                    };
                    if let Some(style) = style_object_of(&prop.value) {
                        self.check(style);
                        if self.error.is_some() {
                            return;
                        }
                    }
                }
            }
        }
        walk::walk_call_expression(self, it);
    }
}

pub fn assert_property_policy(
    program: &Program,
    policy: Option<PropertyPolicy>,
    resource: &str,
) -> Result<(), String> {
    let Some(policy) = policy else { return Ok(()) };
    let mut check = Check {
        policy,
        resource,
        aliases: Aliases::default(),
        error: None,
    };
    check.visit_program(program);
    match check.error {
        Some(error) => Err(error),
        None => Ok(()),
    }
}
