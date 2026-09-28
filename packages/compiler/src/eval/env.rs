use std::hash::BuildHasher;

use indexmap::IndexMap;
use rustc_hash::FxHashMap;

use crate::js::{Object, Value};

pub trait Lookup<V: Clone> {
    fn lookup(&self, key: &str) -> Option<V>;
}

impl<V: Clone, S: BuildHasher> Lookup<V> for std::collections::HashMap<String, V, S> {
    fn lookup(&self, key: &str) -> Option<V> {
        self.get(key).cloned()
    }
}

impl<V: Clone, S: BuildHasher> Lookup<V> for IndexMap<String, V, S> {
    fn lookup(&self, key: &str) -> Option<V> {
        self.get(key).cloned()
    }
}

impl Lookup<Value> for Object {
    fn lookup(&self, key: &str) -> Option<Value> {
        self.get(key).cloned()
    }
}

pub struct Nothing;

impl<V: Clone> Lookup<V> for Nothing {
    fn lookup(&self, _key: &str) -> Option<V> {
        None
    }
}

pub struct Layer<'p, V: Clone> {
    pub own: FxHashMap<String, V>,
    pub parent: &'p dyn Lookup<V>,
}

impl<'p, V: Clone> Layer<'p, V> {
    pub fn over(parent: &'p dyn Lookup<V>) -> Self {
        Layer {
            own: FxHashMap::default(),
            parent,
        }
    }

    pub fn set(&mut self, key: impl Into<String>, value: V) {
        self.own.insert(key.into(), value);
    }
}

impl<V: Clone> Lookup<V> for Layer<'_, V> {
    fn lookup(&self, key: &str) -> Option<V> {
        match self.own.get(key) {
            Some(value) => Some(value.clone()),
            None => self.parent.lookup(key),
        }
    }
}

pub struct Single<'p, V: Clone> {
    pub key: &'p str,
    pub value: V,
    pub parent: &'p dyn Lookup<V>,
}

impl<V: Clone> Lookup<V> for Single<'_, V> {
    fn lookup(&self, key: &str) -> Option<V> {
        if key == self.key {
            return Some(self.value.clone());
        }
        self.parent.lookup(key)
    }
}

#[derive(Clone, Copy)]
pub struct Env<'e> {
    pub statics: &'e dyn Lookup<Value>,
    pub keyframes: &'e dyn Lookup<String>,
    pub view_transitions: &'e dyn Lookup<String>,
    pub theme_hashes: &'e dyn Lookup<String>,
    pub theme_objects: &'e dyn Lookup<Value>,
    pub create_hashes: &'e dyn Lookup<String>,
    pub static_hashes: &'e dyn Lookup<String>,
    pub static_objects: &'e dyn Lookup<Value>,
}

pub static NOTHING: Nothing = Nothing;

impl<'e> Env<'e> {
    pub fn statics_only(statics: &'e dyn Lookup<Value>) -> Self {
        Env {
            statics,
            keyframes: &NOTHING,
            view_transitions: &NOTHING,
            theme_hashes: &NOTHING,
            theme_objects: &NOTHING,
            create_hashes: &NOTHING,
            static_hashes: &NOTHING,
            static_objects: &NOTHING,
        }
    }

    pub fn with_statics(self, statics: &'e dyn Lookup<Value>) -> Self {
        Env { statics, ..self }
    }
}
