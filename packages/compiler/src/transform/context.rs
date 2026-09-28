use oxc_ast::ast::*;
use oxc_semantic::Scoping;
use oxc_span::Span;
use oxc_syntax::symbol::SymbolId;

use super::overlay::{Chain, Map};
use crate::eval::{Env, Lookup};
use crate::js::{Object, Value};
use crate::syntax::expr::{E, K};

pub fn extend<'b, T: ?Sized>(value: &T) -> &'b T {
    unsafe { &*(value as *const T) }
}

pub struct StaticStack<'x> {
    pub own: &'x Object,
    pub base: &'x Map<Value>,
}

impl Lookup<Value> for StaticStack<'_> {
    fn lookup(&self, key: &str) -> Option<Value> {
        self.own.get(key).or_else(|| self.base.get(key)).cloned()
    }
}

pub struct EnvParts<'x> {
    pub statics: StaticStack<'x>,
    pub keyframes: Chain<'x, String>,
    pub view_transitions: Chain<'x, String>,
    pub theme_hashes: Chain<'x, String>,
    pub theme_objects: Chain<'x, Value>,
    pub create_hashes: Chain<'x, String>,
    pub static_hashes: Chain<'x, String>,
    pub static_objects: Chain<'x, Value>,
}

impl EnvParts<'_> {
    pub fn env(&self) -> Env<'_> {
        Env {
            statics: &self.statics,
            keyframes: &self.keyframes,
            view_transitions: &self.view_transitions,
            theme_hashes: &self.theme_hashes,
            theme_objects: &self.theme_objects,
            create_hashes: &self.create_hashes,
            static_hashes: &self.static_hashes,
            static_objects: &self.static_objects,
        }
    }
}

pub struct Visibility<'s> {
    pub scoping: &'s Scoping,
}

impl Visibility<'_> {
    pub fn ident(&self, ident: &IdentifierReference) -> bool {
        let Some(reference) = ident.reference_id.get() else {
            return true;
        };
        match self.scoping.get_reference(reference).symbol_id() {
            Some(symbol) => self.scoping.symbol_scope_id(symbol) == self.scoping.root_scope_id(),
            None => true,
        }
    }

    pub fn symbol_of(&self, ident: &IdentifierReference) -> Option<SymbolId> {
        let reference = ident.reference_id.get()?;
        self.scoping.get_reference(reference).symbol_id()
    }

    pub fn expr(&self, expr: E) -> bool {
        match expr.kind() {
            K::Ident(ident) => self.ident(ident),
            K::Member(member) => self.expr(expr.member_object(member)),
            K::Call(call) => match &call.callee {
                Expression::Super(_) => true,
                callee => self.expr(E::new(callee)),
            },
            _ => true,
        }
    }
}

pub fn line_col_suffix(source: &str, offset: u32, resource: &str) -> String {
    let bytes = source.as_bytes();
    let offset = offset as usize;
    let mut line = 1;
    let mut col_start = 0;
    for (index, byte) in bytes.iter().enumerate().take(offset.min(bytes.len())) {
        if *byte == b'\n' {
            line += 1;
            col_start = index + 1;
        }
    }
    let col = offset.saturating_sub(col_start) + 1;
    format!(" ({}:{line}:{col})", crate::fs::path::basename(resource))
}

pub fn span_text(source: &str, span: Span) -> String {
    source
        .get(span.start as usize..span.end as usize)
        .unwrap_or_default()
        .to_string()
}
