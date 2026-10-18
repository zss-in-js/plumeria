use std::sync::Arc;

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
    pub var_type_obj: Map<Value>,
    pub create_obj: Map<Value>,
    pub atomic_map: Map<Value>,
}

type Undo<V> = Vec<Option<V>>;

fn swap<V: Clone>(table: &mut Map<V>, writes: &Map<V>, undo: &mut Undo<V>) {
    for (key, value) in writes {
        let previous = match table.get_mut(key) {
            Some(current) => Some(std::mem::replace(current, value.clone())),
            None => {
                table.insert(key.clone(), value.clone());
                None
            }
        };
        undo.push(previous);
    }
}

fn restore<V>(table: &mut Map<V>, writes: &Map<V>, undo: &mut Undo<V>) {
    // Each map has unique keys, so only file order needs to be reversed.
    let start = undo.len() - writes.len();
    for ((key, _), previous) in writes.iter().zip(undo.drain(start..)) {
        match previous {
            Some(value) => {
                *table.get_mut(key).expect("applied overlay key") = value;
            }
            None => {
                table.remove(key);
            }
        }
    }
}

#[derive(Default)]
pub struct Restore {
    writes: Vec<Arc<Writes>>,
    theme_hash: Undo<String>,
    theme_obj: Undo<Value>,
    theme_selector: Undo<String>,
    static_hash: Undo<String>,
    static_obj: Undo<Value>,
    keyframes_obj: Undo<Value>,
    view_transition_obj: Undo<Value>,
    var_type_obj: Undo<Value>,
    create_obj: Undo<Value>,
    atomic_map: Undo<Value>,
}

impl Writes {
    pub fn apply(self: &Arc<Self>, tables: &mut crate::project::Tables, undo: &mut Restore) {
        if self.theme_hash.is_empty()
            && self.theme_obj.is_empty()
            && self.theme_selector.is_empty()
            && self.static_hash.is_empty()
            && self.static_obj.is_empty()
            && self.keyframes_obj.is_empty()
            && self.view_transition_obj.is_empty()
            && self.var_type_obj.is_empty()
            && self.create_obj.is_empty()
            && self.atomic_map.is_empty()
        {
            return;
        }
        undo.writes.push(Arc::clone(self));
        swap(
            &mut tables.theme_hash,
            &self.theme_hash,
            &mut undo.theme_hash,
        );
        swap(&mut tables.theme_obj, &self.theme_obj, &mut undo.theme_obj);
        swap(
            &mut tables.theme_selector,
            &self.theme_selector,
            &mut undo.theme_selector,
        );
        swap(
            &mut tables.static_hash,
            &self.static_hash,
            &mut undo.static_hash,
        );
        swap(
            &mut tables.static_obj,
            &self.static_obj,
            &mut undo.static_obj,
        );
        swap(
            &mut tables.keyframes_obj,
            &self.keyframes_obj,
            &mut undo.keyframes_obj,
        );
        swap(
            &mut tables.view_transition_obj,
            &self.view_transition_obj,
            &mut undo.view_transition_obj,
        );
        swap(
            &mut tables.var_type_obj,
            &self.var_type_obj,
            &mut undo.var_type_obj,
        );
        swap(
            &mut tables.create_obj,
            &self.create_obj,
            &mut undo.create_obj,
        );
        swap(
            &mut tables.atomic_map,
            &self.atomic_map,
            &mut undo.atomic_map,
        );
    }
}

impl Restore {
    pub fn undo(mut self, tables: &mut crate::project::Tables) {
        for writes in self.writes.into_iter().rev() {
            restore(
                &mut tables.theme_hash,
                &writes.theme_hash,
                &mut self.theme_hash,
            );
            restore(
                &mut tables.theme_obj,
                &writes.theme_obj,
                &mut self.theme_obj,
            );
            restore(
                &mut tables.theme_selector,
                &writes.theme_selector,
                &mut self.theme_selector,
            );
            restore(
                &mut tables.static_hash,
                &writes.static_hash,
                &mut self.static_hash,
            );
            restore(
                &mut tables.static_obj,
                &writes.static_obj,
                &mut self.static_obj,
            );
            restore(
                &mut tables.keyframes_obj,
                &writes.keyframes_obj,
                &mut self.keyframes_obj,
            );
            restore(
                &mut tables.view_transition_obj,
                &writes.view_transition_obj,
                &mut self.view_transition_obj,
            );
            restore(
                &mut tables.var_type_obj,
                &writes.var_type_obj,
                &mut self.var_type_obj,
            );
            restore(
                &mut tables.create_obj,
                &writes.create_obj,
                &mut self.create_obj,
            );
            restore(
                &mut tables.atomic_map,
                &writes.atomic_map,
                &mut self.atomic_map,
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_writes_do_not_create_restore_work() {
        let mut tables = crate::project::Tables::default();
        let mut undo = Restore::default();
        Arc::new(Writes::default()).apply(&mut tables, &mut undo);
        assert!(undo.writes.is_empty());
        undo.undo(&mut tables);
    }

    #[test]
    fn restores_all_maps_after_the_cached_owner_is_dropped() {
        let mut tables = crate::project::Tables::default();
        let mut writes = Writes::default();
        macro_rules! populate {
            ($value:expr; $($field:ident),+) => { $(
                tables.$field.insert("base".into(), $value);
                writes.$field.insert("base".into(), $value);
                writes.$field.insert("added".into(), $value);
            )+ };
        }
        populate!("value".to_string(); theme_hash, theme_selector, static_hash);
        populate!(Value::str("value"); theme_obj, static_obj, keyframes_obj,
            view_transition_obj, var_type_obj, create_obj, atomic_map);
        let original = tables.clone();
        let writes = Arc::new(writes);
        let mut undo = Restore::default();
        writes.apply(&mut tables, &mut undo);
        writes.apply(&mut tables, &mut undo);
        drop(writes);
        undo.undo(&mut tables);
        macro_rules! check {
            ($($field:ident),+) => { $(assert_eq!(tables.$field, original.$field);)+ };
        }
        check!(
            theme_hash,
            theme_selector,
            static_hash,
            theme_obj,
            static_obj,
            keyframes_obj,
            view_transition_obj,
            var_type_obj,
            create_obj,
            atomic_map
        );
    }

    #[test]
    fn repeated_writes_restore_the_original_map() {
        let original = Map::from_iter([("base".into(), "original".to_string())]);
        let mut table = original.clone();
        let mut undo = Vec::new();
        let first = Map::from_iter([
            ("base".into(), "first".into()),
            ("added".into(), "first".into()),
        ]);
        let second = Map::from_iter([
            ("base".into(), "second".into()),
            ("added".into(), "second".into()),
        ]);
        swap(&mut table, &first, &mut undo);
        swap(&mut table, &second, &mut undo);
        assert_eq!(table["base"], "second");
        assert_eq!(table["added"], "second");
        restore(&mut table, &second, &mut undo);
        assert_eq!(table["base"], "first");
        assert_eq!(table["added"], "first");
        restore(&mut table, &first, &mut undo);
        assert_eq!(table, original);
        assert!(undo.is_empty());
    }
}
