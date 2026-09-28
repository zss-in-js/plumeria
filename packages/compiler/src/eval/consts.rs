use std::cell::RefCell;

use indexmap::IndexMap;
use oxc_ast::ast::*;
use rustc_hash::{FxBuildHasher, FxHashSet};

use super::{Env, Evaluator, Lookup};
use crate::js::{Object, Value};
use crate::syntax::expr::{E, K, unwrap};

pub type ConstNodes<'b, 'a> = IndexMap<&'b str, &'b Expression<'a>, FxBuildHasher>;

pub fn top_level_variable_declarations<'b, 'a>(
    program: &'b Program<'a>,
) -> impl Iterator<Item = &'b VariableDeclaration<'a>> {
    program.body.iter().filter_map(|statement| match statement {
        Statement::VariableDeclaration(declaration) => Some(&**declaration),
        Statement::ExportNamedDeclaration(_) => None,
        Statement::ExportDeclaration(export) => match &export.declaration {
            Declaration::VariableDeclaration(declaration) => Some(&**declaration),
            _ => None,
        },
        _ => None,
    })
}

pub fn binding_name<'b>(pattern: &'b BindingPattern) -> Option<&'b str> {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => Some(ident.name.as_str()),
        _ => None,
    }
}

pub fn collect_local_const_nodes<'b, 'a>(program: &'b Program<'a>) -> ConstNodes<'b, 'a> {
    let mut nodes = ConstNodes::default();
    for declaration in top_level_variable_declarations(program) {
        for declarator in &declaration.declarations {
            if let (Some(name), Some(init)) = (binding_name(&declarator.id), &declarator.init) {
                nodes.insert(name, init);
            }
        }
    }
    nodes
}

struct Consts<'b, 'a> {
    decls: ConstNodes<'b, 'a>,
    values: RefCell<Object>,
    visiting: RefCell<FxHashSet<String>>,
}

struct Live<'c>(&'c RefCell<Object>);

impl Lookup<Value> for Live<'_> {
    fn lookup(&self, key: &str) -> Option<Value> {
        self.0.borrow().get(key).cloned()
    }
}

impl<'b, 'a> Consts<'b, 'a> {
    fn resolve(&self, name: &str) -> Option<Value> {
        if let Some(value) = self.values.borrow().get(name) {
            return Some(value.clone());
        }
        let init = *self.decls.get(name)?;
        if self.visiting.borrow().contains(name) {
            return None;
        }
        self.visiting.borrow_mut().insert(name.to_string());
        let init = unwrap(E::new(init));
        let live = Live(&self.values);
        let env = Env::statics_only(&live);
        let result = match init.kind() {
            K::Str(value) => Some(Value::str(value.value.as_str())),
            K::Num(value) => Some(Value::Num(value.value)),
            K::Bool(value) => Some(Value::Bool(value)),
            K::Ident(ident) => self.resolve(ident.name.as_str()),
            K::Object(object) => {
                let resolver = |key: &str| self.resolve(key);
                Evaluator::with_resolver(env, &resolver)
                    .object(object)
                    .ok()
                    .map(Value::obj)
            }
            K::Binary(..) | K::Template(_) | K::Unary(_) => {
                Evaluator::new(env).expression(init).ok()
            }
            _ => None,
        };
        self.visiting.borrow_mut().remove(name);
        if let Some(value) = &result {
            self.values.borrow_mut().insert(name, value.clone());
        }
        result
    }
}

pub fn collect_local_consts(program: &Program) -> Object {
    let consts = Consts {
        decls: collect_local_const_nodes(program),
        values: RefCell::new(Object::new()),
        visiting: RefCell::new(FxHashSet::default()),
    };
    let names: Vec<&str> = consts.decls.keys().copied().collect();
    for name in names {
        consts.resolve(name);
    }
    consts.values.into_inner()
}
