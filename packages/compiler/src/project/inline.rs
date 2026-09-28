use oxc_ast::ast::*;
use oxc_span::{GetSpan, Span};
use rustc_hash::FxHashSet;

use crate::eval::EvalResult;
use crate::eval::functions::{Body, function_parts, param_views};
use crate::js::json::quote;
use crate::js::number::number_to_string;
use crate::js::{Object, Value};
use crate::syntax::visit::{reads_names_expr, reads_names_property};

pub fn literal_text(value: &Value) -> Option<String> {
    match value {
        Value::Str(text) => Some(quote(text)),
        Value::Num(number) => Some(if number.is_nan() {
            "(0/0)".to_string()
        } else if number.is_infinite() {
            if *number > 0.0 {
                "(1/0)".to_string()
            } else {
                "(-1/0)".to_string()
            }
        } else {
            number_to_string(*number)
        }),
        Value::Bool(flag) => Some(flag.to_string()),
        Value::Null => None,
        Value::Obj(object) => {
            let mut parts = Vec::new();
            for (key, entry) in object.iter() {
                parts.push(format!("{}: {}", quote(key), literal_text(entry)?));
            }
            Some(format!("{{{}}}", parts.join(", ")))
        }
    }
}

pub struct Inliner<'s, 'f> {
    pub source: &'s str,
    pub eval_property: &'f dyn Fn(&ObjectPropertyKind) -> EvalResult<Object>,
    pub eval_value: &'f dyn Fn(&Expression) -> EvalResult<Option<Value>>,
    edits: Vec<(u32, u32, String)>,
}

fn pattern_names(pattern: &BindingPattern, out: &mut FxHashSet<String>) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            out.insert(ident.name.to_string());
        }
        BindingPattern::ObjectPattern(object) => {
            for prop in &object.properties {
                if prop.shorthand {
                    match &prop.value {
                        BindingPattern::AssignmentPattern(assign) => {
                            pattern_names(&assign.left, out)
                        }
                        other => pattern_names(other, out),
                    }
                } else {
                    pattern_names(&prop.value, out);
                }
            }
            if let Some(rest) = &object.rest {
                pattern_names(&rest.argument, out);
            }
        }
        BindingPattern::ArrayPattern(array) => {
            for element in array.elements.iter().flatten() {
                pattern_names(element, out);
            }
            if let Some(rest) = &array.rest {
                pattern_names(&rest.argument, out);
            }
        }
        BindingPattern::AssignmentPattern(assign) => pattern_names(&assign.left, out),
    }
}

impl<'s, 'f> Inliner<'s, 'f> {
    pub fn new(
        source: &'s str,
        eval_property: &'f dyn Fn(&ObjectPropertyKind) -> EvalResult<Object>,
        eval_value: &'f dyn Fn(&Expression) -> EvalResult<Option<Value>>,
    ) -> Self {
        Inliner {
            source,
            eval_property,
            eval_value,
            edits: Vec::new(),
        }
    }

    fn edit(&mut self, span: Span, text: String) {
        self.edits.push((span.start, span.end, text));
    }

    fn rewrite_expression(
        &mut self,
        node: &Expression,
        params: &FxHashSet<String>,
    ) -> EvalResult<()> {
        let reads = |name: &str| params.contains(name);
        if !reads_names_expr(node, &reads) {
            if let Some(value) = (self.eval_value)(node)?
                && let Some(text) = literal_text(&value)
            {
                self.edit(node.span(), text);
            }
            return Ok(());
        }
        match node {
            Expression::ObjectExpression(object) => self.rewrite_object(object, params),
            Expression::ParenthesizedExpression(paren) => {
                self.rewrite_expression(&paren.expression, params)
            }
            Expression::TemplateLiteral(template) => {
                for expr in &template.expressions {
                    self.rewrite_expression(expr, params)?;
                }
                Ok(())
            }
            Expression::BinaryExpression(binary) => {
                self.rewrite_expression(&binary.left, params)?;
                self.rewrite_expression(&binary.right, params)
            }
            Expression::LogicalExpression(logical) => {
                self.rewrite_expression(&logical.left, params)?;
                self.rewrite_expression(&logical.right, params)
            }
            _ => Ok(()),
        }
    }

    fn rewrite_object(
        &mut self,
        object: &ObjectExpression,
        params: &FxHashSet<String>,
    ) -> EvalResult<()> {
        for prop in &object.properties {
            self.rewrite_property(prop, params)?;
        }
        Ok(())
    }

    fn rewrite_property(
        &mut self,
        prop: &ObjectPropertyKind,
        params: &FxHashSet<String>,
    ) -> EvalResult<()> {
        let mut key_value: Option<&ObjectProperty> = None;
        match prop {
            ObjectPropertyKind::ObjectProperty(p) if !p.shorthand => {
                if p.method || p.kind != PropertyKind::Init {
                    return Ok(());
                }
                if p.computed
                    && let Some(key) = p.key.as_expression()
                {
                    self.rewrite_expression(key, params)?;
                }
                match &p.value {
                    Expression::ObjectExpression(inner) => {
                        return self.rewrite_object(inner, params);
                    }
                    Expression::StringLiteral(_)
                    | Expression::NumericLiteral(_)
                    | Expression::BooleanLiteral(_) => {
                        return Ok(());
                    }
                    _ => {}
                }
                key_value = Some(p);
            }
            _ => {}
        }

        let reads = |name: &str| params.contains(name);
        if reads_names_property(prop, &reads) {
            if let Some(p) = key_value {
                return self.rewrite_expression(&p.value, params);
            }
            return Ok(());
        }

        let entries = (self.eval_property)(prop)?;
        if entries.is_empty() {
            return Ok(());
        }
        if let Some(p) = key_value {
            if let Some((_, first)) = entries.iter().next()
                && let Some(text) = literal_text(first)
            {
                self.edit(p.value.span(), text);
            }
            return Ok(());
        }
        let mut parts = Vec::new();
        for (key, entry) in entries.iter() {
            match literal_text(entry) {
                Some(text) => parts.push(format!("{}: {text}", quote(key))),
                None => return Ok(()),
            }
        }
        let span = match prop {
            ObjectPropertyKind::ObjectProperty(p) => p.span,
            ObjectPropertyKind::SpreadProperty(spread) => spread.span,
        };
        self.edit(span, parts.join(", "));
        Ok(())
    }

    fn rewrite_body_expr(
        &mut self,
        expr: &Expression,
        params: &FxHashSet<String>,
    ) -> EvalResult<()> {
        match expr {
            Expression::ParenthesizedExpression(paren) => {
                self.rewrite_body_expr(&paren.expression, params)
            }
            Expression::ObjectExpression(object) => self.rewrite_object(object, params),
            _ => Ok(()),
        }
    }

    fn rewrite_binding(
        &mut self,
        pattern: &BindingPattern,
        params: &FxHashSet<String>,
    ) -> EvalResult<()> {
        match pattern {
            BindingPattern::AssignmentPattern(assign) => {
                self.rewrite_expression(&assign.right, params)
            }
            BindingPattern::ObjectPattern(object) => {
                for prop in &object.properties {
                    if prop.shorthand {
                        if let BindingPattern::AssignmentPattern(assign) = &prop.value {
                            self.rewrite_expression(&assign.right, params)?;
                        }
                    } else {
                        self.rewrite_binding(&prop.value, params)?;
                    }
                }
                Ok(())
            }
            _ => Ok(()),
        }
    }

    fn rewrite_function(&mut self, value: &Expression) -> EvalResult<()> {
        let Some((formal, body)) = function_parts(value) else {
            return Ok(());
        };
        let mut names: FxHashSet<String> = FxHashSet::default();
        for view in param_views(formal) {
            if let Some(pattern) = view.pattern {
                pattern_names(pattern, &mut names);
            }
        }
        for item in &formal.items {
            match &item.initializer {
                Some(initializer) => self.rewrite_expression(initializer, &names)?,
                None => self.rewrite_binding(&item.pattern, &names)?,
            }
        }
        match body {
            Body::Expr(expr) => self.rewrite_body_expr(expr, &names),
            Body::Block(block) => match block.statements.first() {
                Some(Statement::ReturnStatement(ret)) => match &ret.argument {
                    Some(argument) => self.rewrite_body_expr(argument, &names),
                    None => Ok(()),
                },
                _ => Ok(()),
            },
        }
    }

    pub fn inline(mut self, object: &ObjectExpression) -> EvalResult<String> {
        for prop in &object.properties {
            let ObjectPropertyKind::ObjectProperty(p) = prop else {
                continue;
            };
            if p.shorthand || p.method || p.kind != PropertyKind::Init {
                continue;
            }
            if !matches!(
                p.value,
                Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
            ) {
                continue;
            }
            self.rewrite_function(&p.value)?;
        }
        let mut edits = std::mem::take(&mut self.edits);
        edits.sort_by(|a, b| a.0.cmp(&b.0).then(b.1.cmp(&a.1)));
        let start = object.span.start;
        let end = object.span.end;
        let mut out = String::new();
        let mut cursor = start;
        for (edit_start, edit_end, text) in edits {
            if edit_start < cursor || edit_end > end {
                continue;
            }
            out.push_str(&self.source[cursor as usize..edit_start as usize]);
            out.push_str(&text);
            cursor = edit_end;
        }
        out.push_str(&self.source[cursor as usize..end as usize]);
        Ok(out)
    }
}
