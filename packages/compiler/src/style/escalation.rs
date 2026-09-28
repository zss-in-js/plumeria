use indexmap::IndexMap;
use rustc_hash::{FxBuildHasher, FxHashMap};

use super::records::Weights;
use crate::engine::shorthand::{covers, get_property_depth};
use crate::engine::specificity::{Specificity, get_pseudo_element, get_specificity};
use crate::engine::{camel_to_kebab_case, is_at_rule};
use crate::js::{Object, Value};

pub struct StyleSource<'a> {
    pub order: i64,
    pub style: &'a Object,
}

struct Atom {
    key: String,
    seat: String,
    group: String,
    target: String,
    property: String,
    base: Specificity,
}

fn conflicts(a: &str, b: &str) -> bool {
    a == b || covers(a, b) || covers(b, a)
}

fn compare(a: &Specificity, b: &Specificity) -> i64 {
    let first = a[0] - b[0];
    if first != 0 {
        return first;
    }
    let second = a[1] - b[1];
    if second != 0 {
        return second;
    }
    a[2] - b[2]
}

fn weighted(base: &Specificity, weight: i64) -> Specificity {
    [base[0] + weight, base[1], base[2]]
}

pub fn get_state_weights(sources: &[StyleSource]) -> Weights {
    let mut atoms: Vec<Atom> = Vec::new();
    let mut by_key: FxHashMap<String, usize> = FxHashMap::default();
    let mut last_order: FxHashMap<String, i64> = FxHashMap::default();

    let mut collect = |selector: &str, style: &Object, at_rule: &str, order: i64| {
        let specificity = get_specificity(selector);
        let pseudo_element = get_pseudo_element(selector);
        for (prop, value) in style.iter() {
            if !value.is_primitive_text() {
                continue;
            }
            let property = camel_to_kebab_case(prop);
            let condition_depth: i64 = if prop.starts_with("--") {
                0
            } else {
                1 + i64::from(!at_rule.is_empty())
            };
            let target = format!("{at_rule}|{pseudo_element}");
            let group = format!(
                "{target}|{},{},{}|{property}",
                specificity[0], specificity[1], specificity[2]
            );
            let seat = format!("{group}|{selector}");
            let key = if at_rule.is_empty() {
                format!("{selector}:{prop}")
            } else {
                format!("{at_rule}:{selector}:{prop}")
            };
            let previous = last_order.get(&seat).copied().unwrap_or(-1);
            last_order.insert(seat.clone(), previous.max(order));
            if by_key.contains_key(&key) {
                continue;
            }
            let depth = get_property_depth(&property) as i64;
            by_key.insert(key.clone(), atoms.len());
            atoms.push(Atom {
                key,
                seat,
                group,
                target,
                property,
                base: [
                    condition_depth + depth + specificity[0],
                    1 + specificity[1],
                    specificity[2],
                ],
            });
        }
    };

    for source in sources {
        for (key, value) in source.style.iter() {
            let Value::Obj(nested) = value else { continue };
            if is_at_rule(key) {
                for (inner, inner_value) in nested.iter() {
                    if let Value::Obj(inner_style) = inner_value {
                        collect(inner, inner_style, key, source.order);
                    }
                }
                continue;
            }
            collect(key, nested, "", source.order);
        }
    }

    let mut weights: Weights = Weights::default();
    let mut groups: IndexMap<&str, Vec<usize>, FxBuildHasher> = IndexMap::default();
    for (index, atom) in atoms.iter().enumerate() {
        groups.entry(atom.group.as_str()).or_default().push(index);
    }

    for members in groups.values() {
        if members.len() < 2 {
            continue;
        }
        let seat_orders: Vec<i64> = members
            .iter()
            .map(|index| last_order.get(&atoms[*index].seat).copied().unwrap_or(-1))
            .collect();
        let mut ranks: Vec<i64> = seat_orders.clone();
        ranks.sort_unstable();
        ranks.dedup();
        if ranks.len() < 2 {
            continue;
        }
        for (position, index) in members.iter().enumerate() {
            let rank = ranks
                .iter()
                .position(|r| *r == seat_orders[position])
                .unwrap_or(0) as i64;
            if rank > 0 {
                weights.insert(atoms[*index].key.clone(), rank);
            }
        }
    }

    if weights.is_empty() {
        return weights;
    }

    for _ in 0..atoms.len() {
        let mut repaired = false;
        for above in 0..atoms.len() {
            for below in 0..atoms.len() {
                if above == below {
                    continue;
                }
                let (a, b) = (&atoms[above], &atoms[below]);
                if a.target != b.target {
                    continue;
                }
                if !conflicts(&a.property, &b.property) {
                    continue;
                }
                if compare(&a.base, &b.base) <= 0 {
                    continue;
                }
                let above_weight = weights.get(&a.key).copied().unwrap_or(0);
                let post = weighted(&a.base, above_weight);
                let rival = weighted(&b.base, weights.get(&b.key).copied().unwrap_or(0));
                if compare(&post, &rival) > 0 {
                    continue;
                }
                let outranks_on_rest =
                    compare(&[0, post[1], post[2]], &[0, rival[1], rival[2]]) > 0;
                let next = above_weight + (rival[0] - post[0]) + i64::from(!outranks_on_rest);
                weights.insert(a.key.clone(), next);
                repaired = true;
            }
        }
        if !repaired {
            break;
        }
    }

    weights
}
