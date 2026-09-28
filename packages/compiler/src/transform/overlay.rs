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

#[derive(Default)]
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
