use rustc_hash::FxHashMap;

use crate::eval::Lookup;
use crate::js::Value;

pub type Map<V> = FxHashMap<String, V>;

pub struct Chain<'x, V: Clone> {
    layers: [Option<&'x Map<V>>; 3],
}

impl<'x, V: Clone> Chain<'x, V> {
    pub fn two(first: &'x Map<V>, second: &'x Map<V>) -> Self {
        Chain {
            layers: [Some(first), Some(second), None],
        }
    }

    pub fn three(first: &'x Map<V>, second: &'x Map<V>, third: &'x Map<V>) -> Self {
        Chain {
            layers: [Some(first), Some(second), Some(third)],
        }
    }
}

impl<V: Clone> Lookup<V> for Chain<'_, V> {
    fn lookup(&self, key: &str) -> Option<V> {
        self.layers
            .iter()
            .flatten()
            .find_map(|layer| layer.get(key))
            .cloned()
    }
}

#[derive(Default, Clone, PartialEq)]
pub struct Writes {
    pub theme_hash: Map<String>,
    pub theme_obj: Map<Value>,
    pub theme_selector: Map<String>,
    pub static_hash: Map<String>,
    pub static_obj: Map<Value>,
    pub keyframes_obj: Map<Value>,
    pub view_transition_obj: Map<Value>,
    pub create_obj: Map<Value>,
    pub atomic_map: Map<Value>,
}

impl Writes {
    pub fn apply(&self, tables: &mut crate::project::Tables) {
        tables.theme_hash.extend(self.theme_hash.clone());
        tables.theme_obj.extend(self.theme_obj.clone());
        tables.theme_selector.extend(self.theme_selector.clone());
        tables.static_hash.extend(self.static_hash.clone());
        tables.static_obj.extend(self.static_obj.clone());
        tables.keyframes_obj.extend(self.keyframes_obj.clone());
        tables
            .view_transition_obj
            .extend(self.view_transition_obj.clone());
        tables.create_obj.extend(self.create_obj.clone());
        tables.atomic_map.extend(self.atomic_map.clone());
    }
}
