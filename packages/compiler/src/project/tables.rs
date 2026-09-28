use std::sync::Arc;

use indexmap::IndexMap;
use rustc_hash::{FxBuildHasher, FxHashMap};

use crate::js::{Object, Value};

pub type Map<V> = FxHashMap<String, V>;
pub type Ordered<V> = IndexMap<String, V, FxBuildHasher>;

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Condition {
    pub test: (u32, u32),
    pub truthy: bool,
}

#[derive(Clone, Debug)]
pub struct TableEntry {
    pub key: String,
    pub style: Object,
    pub span_start: u32,
    pub file: String,
    pub has_vars: bool,
    pub conditions: Option<Vec<Condition>>,
    pub dynamic_calls: Option<Vec<(u32, u32)>>,
}

impl TableEntry {
    pub fn identity(&self) -> (String, u32, String, Option<Vec<Condition>>) {
        (
            self.file.clone(),
            self.span_start,
            self.key.clone(),
            self.conditions.clone(),
        )
    }
}

pub type PropsTable = Ordered<Ordered<Vec<TableEntry>>>;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum KeyTable {
    Static,
    KeyframesHash,
    ViewTransitionHash,
    ThemeHash,
    CreateHash,
    CreateFunction,
    StaticHash,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum ObjectTable {
    KeyframesObject,
    ViewTransitionObject,
    ThemeObject,
    ThemeSelector,
    CreateObject,
    AtomicMap,
    StaticObject,
}

#[derive(Default, Clone)]
pub struct Tables {
    pub static_table: Map<Value>,
    pub keyframes_hash: Map<String>,
    pub keyframes_obj: Map<Value>,
    pub view_transition_hash: Map<String>,
    pub view_transition_obj: Map<Value>,
    pub theme_hash: Map<String>,
    pub theme_selector: Map<String>,
    pub theme_obj: Map<Value>,
    pub create_hash: Map<String>,
    pub create_obj: Map<Value>,
    pub create_function: Map<Arc<str>>,
    pub atomic_map: Map<Value>,
    pub static_hash: Map<String>,
    pub static_obj: Map<Value>,
    pub component_props: PropsTable,
    pub style_receiver: Ordered<Vec<String>>,
}

impl Tables {
    pub fn remove_key(&mut self, table: KeyTable, key: &str) {
        match table {
            KeyTable::Static => {
                self.static_table.remove(key);
            }
            KeyTable::KeyframesHash => {
                self.keyframes_hash.remove(key);
            }
            KeyTable::ViewTransitionHash => {
                self.view_transition_hash.remove(key);
            }
            KeyTable::ThemeHash => {
                self.theme_hash.remove(key);
            }
            KeyTable::CreateHash => {
                self.create_hash.remove(key);
            }
            KeyTable::CreateFunction => {
                self.create_function.remove(key);
            }
            KeyTable::StaticHash => {
                self.static_hash.remove(key);
            }
        }
    }

    pub fn remove_object(&mut self, table: ObjectTable, hash: &str) {
        match table {
            ObjectTable::KeyframesObject => {
                self.keyframes_obj.remove(hash);
            }
            ObjectTable::ViewTransitionObject => {
                self.view_transition_obj.remove(hash);
            }
            ObjectTable::ThemeObject => {
                self.theme_obj.remove(hash);
            }
            ObjectTable::ThemeSelector => {
                self.theme_selector.remove(hash);
            }
            ObjectTable::CreateObject => {
                self.create_obj.remove(hash);
            }
            ObjectTable::AtomicMap => {
                self.atomic_map.remove(hash);
            }
            ObjectTable::StaticObject => {
                self.static_obj.remove(hash);
            }
        }
    }
}
