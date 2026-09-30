pub mod consts;
pub mod env;
pub mod functions;

use oxc_ast::ast::*;
use oxc_syntax::operator::{BinaryOperator, LogicalOperator, UnaryOperator};

pub use env::{Env, Layer, Lookup, NOTHING, Single};

use crate::engine::hash::hash_object;
use crate::engine::specificity::find_same_name_nesting;
use crate::js::number::{number_to_string, to_int32, to_uint32};
use crate::js::{Object, Value};
use crate::style::theme::theme_var_reference;
use crate::syntax::expr::{BinOp, E, K, Prop, expression_label, root_identifier, unwrap};

pub type EvalResult<T> = Result<T, String>;

pub type ResolveVariable<'r> = &'r dyn Fn(&str) -> Option<Value>;

pub type Replacements = rustc_hash::FxHashMap<(u32, u32), Value>;

fn to_ident(value: &str) -> String {
    value
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
        .collect()
}

pub fn marker_var(id: &str, pseudo: &str) -> String {
    let mut source = Object::new();
    source.insert(id, Value::str(pseudo));
    let hash = hash_object(&source);
    let head = pseudo.split('(').next().unwrap_or("");
    format!("--{hash}-{}-{}", to_ident(id), to_ident(head))
}

pub fn argument_expr<'b, 'a>(argument: &'b Argument<'a>) -> E<'b, 'a> {
    match argument {
        Argument::SpreadElement(spread) => E::new(&spread.argument),
        other => E::new(other.to_expression()),
    }
}

pub fn property_is_plain(prop: &ObjectProperty) -> bool {
    !prop.method && prop.kind == PropertyKind::Init
}

#[derive(Clone, Copy)]
pub struct Evaluator<'e, 'r> {
    pub env: Env<'e>,
    pub resolve_variable: Option<ResolveVariable<'r>>,
    pub replacements: Option<&'r Replacements>,
}

impl<'e, 'r> Evaluator<'e, 'r> {
    pub fn new(env: Env<'e>) -> Self {
        Evaluator {
            env,
            resolve_variable: None,
            replacements: None,
        }
    }

    pub fn with_resolver(env: Env<'e>, resolve_variable: ResolveVariable<'r>) -> Self {
        Evaluator {
            env,
            resolve_variable: Some(resolve_variable),
            replacements: None,
        }
    }

    pub fn with_replacements(env: Env<'e>, replacements: &'r Replacements) -> Self {
        Evaluator {
            env,
            resolve_variable: None,
            replacements: Some(replacements),
        }
    }

    fn plain(&self) -> Evaluator<'e, 'r> {
        Evaluator {
            env: self.env,
            resolve_variable: None,
            replacements: self.replacements,
        }
    }

    pub fn plain_property_into(
        &self,
        prop: &ObjectPropertyKind,
        obj: &mut Object,
    ) -> EvalResult<()> {
        self.plain().property_into(prop, obj)
    }

    pub fn plain_property_value(&self, value: E) -> EvalResult<Option<Value>> {
        self.plain().property_value(value)
    }

    pub fn object(&self, node: &ObjectExpression) -> EvalResult<Object> {
        self.properties(node.properties.iter())
    }

    pub fn properties<'b, 'a: 'b>(
        &self,
        properties: impl Iterator<Item = &'b ObjectPropertyKind<'a>>,
    ) -> EvalResult<Object> {
        let mut obj = Object::new();
        for prop in properties {
            self.property_into(prop, &mut obj)?;
        }
        Ok(obj)
    }

    pub fn property_into(&self, prop: &ObjectPropertyKind, obj: &mut Object) -> EvalResult<()> {
        match prop {
            ObjectPropertyKind::SpreadProperty(spread) => {
                let value = self.plain().expression(E::new(&spread.argument))?;
                if let Value::Obj(spread_obj) = value {
                    obj.assign(&spread_obj);
                }
                Ok(())
            }
            ObjectPropertyKind::ObjectProperty(prop) => {
                if prop.shorthand {
                    let Expression::Identifier(ident) = &prop.value else {
                        return Ok(());
                    };
                    let key = ident.name.as_str();
                    if let Some(resolve) = self.resolve_variable
                        && let Some(resolved) = resolve(key)
                    {
                        obj.insert(key, resolved);
                        return Ok(());
                    }
                    if let Some(value) = self.env.statics.lookup(key) {
                        obj.insert(key, value);
                    }
                    return Ok(());
                }
                if !property_is_plain(prop) {
                    return Ok(());
                }
                let key = self.property_key(&prop.key, prop.computed)?;
                if !key.truthy() {
                    return Ok(());
                }
                let key = key.to_js_string();
                if (key.starts_with(':') || key.starts_with('['))
                    && let Some(name) = find_same_name_nesting(&key)
                {
                    return Err(format!(
                        "[plumeria] \"{name}()\" cannot be nested inside another \"{name}()\": \"{key}\". Rewrite the selector without nesting."
                    ));
                }
                if let Some(value) = self.property_value(E::new(&prop.value))? {
                    obj.insert(key, value);
                }
                Ok(())
            }
        }
    }

    pub fn property_value(&self, value: E) -> EvalResult<Option<Value>> {
        let val = unwrap(value);
        let statics = self.env.statics;
        match val.kind() {
            K::Ident(_) | K::Member(_) => {
                if let (Some(resolve), true) = (self.resolve_variable, val.is_member())
                    && let Some(root) = root_identifier(val)
                    && let Some(resolved) = resolve(root)
                {
                    let layered = Single {
                        key: root,
                        value: resolved,
                        parent: statics,
                    };
                    return match resolve_static_member(val, &layered) {
                        Some(member) => Ok(Some(member)),
                        None => Err(format!(
                            "[plumeria] Unknown style member: {} does not exist.",
                            expression_label(val)
                        )),
                    };
                }
                if let Some(hash) = self.keyframes_member(val) {
                    return Ok(Some(Value::Str(format!("kf-{hash}"))));
                }
                if let Some(hash) = self.view_transition_member(val) {
                    return Ok(Some(Value::Str(format!("vt-{hash}"))));
                }
                if let Some(name) = val.ident_name()
                    && let Some(hash) = self.env.create_hashes.lookup(name)
                {
                    return Ok(Some(Value::Str(format!("cr-{hash}"))));
                }
                if let Some(theme) = self.theme_member(val) {
                    return Ok(Some(theme));
                }
                if let Some(value) = self.static_object_member(val) {
                    return Ok(Some(value));
                }
            }
            _ => {}
        }

        match val.kind() {
            K::Str(value) => Ok(Some(Value::str(value.value.as_str()))),
            K::Num(value) => Ok(Some(Value::Num(value.value))),
            K::Bool(value) => Ok(Some(Value::Bool(value))),
            K::Unary(_) => self.plain().expression(val).map(Some),
            K::Object(object) => Ok(Some(Value::obj(self.object(object)?))),
            K::Binary(..) | K::Template(_) => self.plain().expression(val).map(Some),
            K::Member(_) => Ok(resolve_static_member(val, statics)),
            K::Ident(ident) => {
                if let Some(resolve) = self.resolve_variable
                    && let Some(resolved) = resolve(ident.name.as_str())
                {
                    return Ok(Some(resolved));
                }
                Ok(statics.lookup(ident.name.as_str()))
            }
            _ => Ok(None),
        }
    }

    pub fn property_key(&self, key: &PropertyKey, computed: bool) -> EvalResult<Value> {
        if !computed {
            return match key {
                PropertyKey::StaticIdentifier(ident) => Ok(Value::str(ident.name.as_str())),
                PropertyKey::StringLiteral(value) => Ok(Value::str(value.value.as_str())),
                PropertyKey::NumericLiteral(value) => {
                    let text = number_to_string(value.value);
                    Err(format!(
                        "[plumeria] The style key {text} is a number. Style keys have to be names — quote it as '{text}' or rename it."
                    ))
                }
                PropertyKey::TemplateLiteral(template) => {
                    self.plain().template(template).map(Value::Str)
                }
                _ => Ok(Value::str("")),
            };
        }
        let Some(expr) = key.as_expression() else {
            return Ok(Value::str(""));
        };
        let expr = E::new(expr);
        match expr.kind() {
            K::Str(value) => return Ok(Value::str(value.value.as_str())),
            K::Ident(ident) => {
                if let Some(Value::Str(text)) = self.env.statics.lookup(ident.name.as_str())
                    && !text.is_empty()
                {
                    return Ok(Value::Str(text));
                }
            }
            _ => {}
        }
        if let K::Call(_) = expr.kind()
            && let Value::Str(text) = self.plain().expression(expr)?
        {
            return Ok(Value::Str(text));
        }
        if let K::Member(_) = expr.kind() {
            if let Some(Value::Str(text)) = resolve_static_member(expr, self.env.statics) {
                return Ok(Value::Str(text));
            }
            if let Some(Value::Str(text)) = self.static_object_member(expr) {
                return Ok(Value::Str(text));
            }
            if let Some(Value::Str(text)) = self.theme_member(expr) {
                return Ok(Value::Str(text));
            }
        }
        match expr.kind() {
            K::Template(template) => self.plain().template(template).map(Value::Str),
            K::Binary(left, op, right) => self.plain().binary(left, op, right),
            _ => Ok(Value::str("")),
        }
    }

    pub fn template(&self, node: &TemplateLiteral) -> EvalResult<String> {
        let mut result = String::new();
        for (index, quasi) in node.quasis.iter().enumerate() {
            match &quasi.value.cooked {
                Some(cooked) if !cooked.is_empty() => result.push_str(cooked.as_str()),
                _ => result.push_str(quasi.value.raw.as_str()),
            }
            if let Some(expr) = node.expressions.get(index) {
                let value = self.expression(E::new(expr))?;
                if matches!(value, Value::Null | Value::Obj(_)) {
                    return Err(format!(
                        "[plumeria] Template value cannot be resolved to a primitive: {} inside ${{}} must resolve to a string or number at build time.",
                        expression_label(E::new(expr))
                    ));
                }
                result.push_str(&value.to_js_string());
            }
        }
        Ok(result)
    }

    pub fn binary(&self, left: E, op: BinOp, right: E) -> EvalResult<Value> {
        let left_value = self.expression(left)?;
        match op {
            BinOp::Logical(LogicalOperator::And) if !left_value.truthy() => return Ok(left_value),
            BinOp::Logical(LogicalOperator::Or) if left_value.truthy() => return Ok(left_value),
            BinOp::Logical(LogicalOperator::Coalesce) if left_value != Value::Null => {
                return Ok(left_value);
            }
            _ => {}
        }
        let right_value = self.expression(right)?;
        if let BinOp::Logical(_) = op {
            return Ok(right_value);
        }
        let BinOp::Binary(operator) = op else {
            unreachable!()
        };
        if let (Value::Num(l), Value::Num(r)) = (&left_value, &right_value) {
            let (l, r) = (*l, *r);
            let result = match operator {
                BinaryOperator::Addition => Some(l + r),
                BinaryOperator::Subtraction => Some(l - r),
                BinaryOperator::Multiplication => Some(l * r),
                BinaryOperator::Division => Some(l / r),
                BinaryOperator::Remainder => Some(l % r),
                BinaryOperator::Exponential => Some(js_pow(l, r)),
                BinaryOperator::BitwiseAnd => Some((to_int32(l) & to_int32(r)) as f64),
                BinaryOperator::ShiftLeft => {
                    Some(to_int32(l).wrapping_shl(to_uint32(r) & 31) as f64)
                }
                BinaryOperator::ShiftRight => {
                    Some(to_int32(l).wrapping_shr(to_uint32(r) & 31) as f64)
                }
                BinaryOperator::ShiftRightZeroFill => {
                    Some(to_uint32(l).wrapping_shr(to_uint32(r) & 31) as f64)
                }
                BinaryOperator::BitwiseXOR => Some((to_int32(l) ^ to_int32(r)) as f64),
                BinaryOperator::BitwiseOR => Some((to_int32(l) | to_int32(r)) as f64),
                _ => None,
            };
            if let Some(result) = result {
                return Ok(Value::Num(result));
            }
        }
        if operator == BinaryOperator::Addition
            && !matches!(left_value, Value::Null | Value::Obj(_))
            && !matches!(right_value, Value::Null | Value::Obj(_))
        {
            return Ok(Value::Str(format!(
                "{}{}",
                left_value.to_js_string(),
                right_value.to_js_string()
            )));
        }
        let arithmetic = matches!(
            operator,
            BinaryOperator::Addition
                | BinaryOperator::Subtraction
                | BinaryOperator::Multiplication
                | BinaryOperator::Division
                | BinaryOperator::Remainder
                | BinaryOperator::Exponential
                | BinaryOperator::BitwiseAnd
                | BinaryOperator::ShiftLeft
                | BinaryOperator::ShiftRight
                | BinaryOperator::ShiftRightZeroFill
                | BinaryOperator::BitwiseXOR
                | BinaryOperator::BitwiseOR
        );
        if arithmetic {
            let expected = if operator == BinaryOperator::Addition {
                "non-null primitive"
            } else {
                "numeric"
            };
            let type_of = |value: &Value| {
                if *value == Value::Null {
                    "null"
                } else {
                    value.type_of()
                }
            };
            return Err(format!(
                "[plumeria] Binary operator {} requires {expected} operands; received {} and {}.",
                operator.as_str(),
                type_of(&left_value),
                type_of(&right_value)
            ));
        }
        Err(format!(
            "[plumeria] Unsupported binary operator: {}. Use arithmetic, bitwise, &&, ||, or ?? operators, which can be resolved at build time.",
            operator.as_str()
        ))
    }

    fn call(&self, call: &CallExpression) -> EvalResult<Value> {
        let method = match E::new(&call.callee).kind() {
            K::Ident(ident) => Some(ident.name.as_str()),
            K::Member(_) => match E::new(&call.callee).prop() {
                Some(Prop::Name(name)) => Some(name),
                _ => None,
            },
            _ => None,
        };
        let Some(method) = method else {
            return Ok(Value::Null);
        };
        if (method == "marker" || method == "extended") && call.arguments.len() >= 2 {
            let statics_only = Evaluator::new(Env::statics_only(self.env.statics));
            let id = statics_only.expression(argument_expr(&call.arguments[0]))?;
            let pseudo = statics_only.expression(argument_expr(&call.arguments[1]))?;
            if let (Value::Str(id), Value::Str(pseudo)) = (&id, &pseudo) {
                let var_name = marker_var(id, pseudo);
                if method == "marker" {
                    let mut inner = Object::new();
                    inner.insert(var_name, Value::Num(1.0));
                    let mut outer = Object::new();
                    outer.insert(pseudo.clone(), Value::obj(inner));
                    return Ok(Value::obj(outer));
                }
                return Ok(Value::Str(format!("@container style({var_name}: 1)")));
            }
        }
        Ok(Value::Null)
    }

    pub fn expression(&self, node: E) -> EvalResult<Value> {
        let node = unwrap(node);
        if let Some(replacements) = self.replacements {
            let span = node.span();
            if let Some(value) = replacements.get(&(span.start, span.end)) {
                return Ok(value.clone());
            }
        }
        match node.kind() {
            K::Call(call) => self.call(call),
            K::Str(value) => Ok(Value::str(value.value.as_str())),
            K::Num(value) => Ok(Value::Num(value.value)),
            K::Bool(value) => Ok(Value::Bool(value)),
            K::Null => Ok(Value::Null),
            K::Ident(ident) => {
                let name = ident.name.as_str();
                if let Some(value) = self.env.statics.lookup(name) {
                    return Ok(value);
                }
                if let Some(hash) = self.env.keyframes.lookup(name) {
                    return Ok(Value::Str(format!("kf-{hash}")));
                }
                if let Some(hash) = self.env.view_transitions.lookup(name) {
                    return Ok(Value::Str(format!("vt-{hash}")));
                }
                if let Some(hash) = self.env.static_hashes.lookup(name)
                    && let Some(object) = self.env.static_objects.lookup(&hash)
                {
                    return Ok(object);
                }
                Err(format!(
                    "[plumeria] Cannot resolve static value: {name}. It must be a const holding a string or number, declared in this file or imported from a module plumeria can read."
                ))
            }
            K::Member(_) => {
                if let Some(value) = resolve_static_member(node, self.env.statics) {
                    return Ok(value);
                }
                if let Some(value) = self.theme_member(node) {
                    return Ok(value);
                }
                if let Some(value) = self.static_object_member(node) {
                    return Ok(value);
                }
                Err(format!(
                    "[plumeria] Cannot resolve static member expression: {}. Its object must be a const or a value created by css.createStatic or css.createTheme.",
                    expression_label(node)
                ))
            }
            K::Binary(left, op, right) => self.binary(left, op, right),
            K::Template(template) => self.template(template).map(Value::Str),
            K::Unary(unary) => {
                let value = self.expression(E::new(&unary.argument))?;
                if unary.operator == UnaryOperator::LogicalNot {
                    return Ok(Value::Bool(!value.truthy()));
                }
                if let Value::Num(number) = value {
                    match unary.operator {
                        UnaryOperator::UnaryNegation => return Ok(Value::Num(-number)),
                        UnaryOperator::UnaryPlus => return Ok(Value::Num(number)),
                        UnaryOperator::BitwiseNot => {
                            return Ok(Value::Num(!to_int32(number) as f64));
                        }
                        _ => {}
                    }
                }
                Err(format!(
                    "[plumeria] Unsupported unary operand for {}: {} must resolve to a number at build time.",
                    unary.operator.as_str(),
                    expression_label(E::new(&unary.argument))
                ))
            }
            K::Paren(paren) => self.expression(E::new(&paren.expression)),
            _ => Err(format!(
                "[plumeria] Unsupported expression type: {}. Style values must be literals, consts, or arithmetic and template expressions of them.",
                expression_label(node)
            )),
        }
    }

    fn keyframes_member(&self, node: E) -> Option<String> {
        match node.kind() {
            K::Ident(ident) => self.env.keyframes.lookup(ident.name.as_str()),
            K::Member(_) => node
                .object()?
                .ident_name()
                .and_then(|name| self.env.keyframes.lookup(name)),
            _ => None,
        }
    }

    fn view_transition_member(&self, node: E) -> Option<String> {
        match node.kind() {
            K::Ident(ident) => self.env.view_transitions.lookup(ident.name.as_str()),
            K::Member(_) => node
                .object()?
                .ident_name()
                .and_then(|name| self.env.view_transitions.lookup(name)),
            _ => None,
        }
    }

    pub fn theme_member(&self, node: E) -> Option<Value> {
        let object_name = node.object()?.ident_name()?;
        let hash = self.env.theme_hashes.lookup(object_name)?;
        if hash.is_empty() {
            return None;
        }
        let theme = self.env.theme_objects.lookup(&hash)?;
        let theme = theme.as_obj()?;
        let key = simple_member_key(node)?;
        let value = theme.get(key)?;
        Some(Value::Str(theme_var_reference(&hash, key, value)))
    }

    pub fn static_object_member(&self, node: E) -> Option<Value> {
        let object_name = node.object()?.ident_name()?;
        let hash = self.env.static_hashes.lookup(object_name)?;
        if hash.is_empty() {
            return None;
        }
        let object = self.env.static_objects.lookup(&hash)?;
        let object = object.as_obj()?;
        let key = simple_member_key(node)?;
        object.get(key).cloned()
    }
}

fn simple_member_key<'b>(node: E<'b, '_>) -> Option<&'b str> {
    match node.prop()? {
        Prop::Name(name) => Some(name),
        Prop::Computed(expr) => match expr.kind() {
            K::Str(value) => Some(value.value.as_str()),
            _ => None,
        },
        Prop::Private => None,
    }
}

fn js_pow(base: f64, exponent: f64) -> f64 {
    if exponent.is_nan() || ((base == 1.0 || base == -1.0) && exponent.is_infinite()) {
        return f64::NAN;
    }
    base.powf(exponent)
}

pub fn resolve_static_member(node: E, statics: &dyn Lookup<Value>) -> Option<Value> {
    let mut keys: Vec<String> = Vec::new();
    let mut current = node;
    while let K::Member(member) = current.kind() {
        let key = match crate::syntax::expr::member_prop(member) {
            Prop::Name(name) => Some(name.to_string()),
            Prop::Computed(expr) => {
                let inner = unwrap(expr);
                match inner.kind() {
                    K::Str(value) => Some(value.value.to_string()),
                    K::Num(value) => Some(number_to_string(value.value)),
                    K::Ident(ident) => match statics.lookup(ident.name.as_str()) {
                        Some(Value::Str(text)) => Some(text),
                        Some(Value::Num(number)) => Some(number_to_string(number)),
                        _ => None,
                    },
                    _ => None,
                }
            }
            Prop::Private => None,
        };
        let key = key?;
        keys.push(key);
        current = unwrap(current.member_object(member));
    }
    let root = current.ident_name()?;
    let mut value = statics.lookup(root)?;
    for key in keys.iter().rev() {
        let next = match &value {
            Value::Obj(object) => object.get(key).cloned(),
            _ => None,
        };
        value = next?;
    }
    Some(value)
}

pub fn resolve_theme_selector(node: E, env: Env) -> String {
    let limited = Env {
        statics: env.statics,
        keyframes: &NOTHING,
        view_transitions: &NOTHING,
        theme_hashes: &NOTHING,
        theme_objects: &NOTHING,
        create_hashes: &NOTHING,
        static_hashes: env.static_hashes,
        static_objects: env.static_objects,
    };
    match Evaluator::new(limited).expression(node) {
        Ok(Value::Str(text)) => text,
        _ => String::new(),
    }
}
