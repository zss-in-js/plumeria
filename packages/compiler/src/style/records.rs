use rustc_hash::FxHashMap;

use crate::engine::hash::{hash_normalized, normalize_object};
use crate::engine::transpile::{AtomicMap, process_atomic_props, split_atomic_and_nested};
use crate::engine::{NOT_NORMALIZE, is_at_rule, transpile_atomic};
use crate::js::number::number_to_string;
use crate::js::{Object, Value};

#[derive(Clone, Debug)]
pub struct StyleRecord {
    pub key: String,
    pub hash: String,
    pub sheet: String,
}

pub type Weights = FxHashMap<String, i64>;

fn replace_first(text: &str, from: &str, to: &str) -> String {
    match text.find(from) {
        Some(index) => format!("{}{}{}", &text[..index], to, &text[index + from.len()..]),
        None => text.to_string(),
    }
}

fn single(key: &str, value: Value) -> Object {
    let mut object = Object::new();
    object.insert(key, value);
    object
}

pub fn style_records(style: &Object, weights: Option<&Weights>) -> Vec<StyleRecord> {
    let mut flat = Object::new();
    let mut non_flat = Object::new();
    split_atomic_and_nested(style, &mut flat, &mut non_flat);

    let mut records = Vec::new();

    for (prop, value) in flat.iter() {
        if is_at_rule(prop) {
            let Value::Obj(inner) = value else { continue };
            for (inner_prop, inner_value) in inner.iter() {
                let mut atomic_map = AtomicMap::default();
                let not_suffix = if inner_prop.starts_with("--") {
                    ""
                } else {
                    NOT_NORMALIZE
                };
                process_atomic_props(
                    &single(inner_prop, inner_value.clone()),
                    &mut atomic_map,
                    Some(prop),
                );
                let mut sheets = String::new();
                let mut hashes: Vec<&str> = Vec::new();
                for (hash, sheet) in atomic_map.iter() {
                    sheets.push_str(&replace_first(
                        sheet,
                        &format!(".{hash}"),
                        &format!(".{hash}{not_suffix}"),
                    ));
                    hashes.push(hash);
                }
                records.push(StyleRecord {
                    key: format!("{prop}:{inner_prop}"),
                    hash: hashes.join(" "),
                    sheet: sheets,
                });
            }
        } else if value.is_primitive_text() {
            let mut atomic_map = AtomicMap::default();
            process_atomic_props(&single(prop, value.clone()), &mut atomic_map, None);
            let mut sheets = String::new();
            let mut hashes: Vec<&str> = Vec::new();
            for (hash, sheet) in atomic_map.iter() {
                sheets.push_str(sheet);
                hashes.push(hash);
            }
            records.push(StyleRecord {
                key: prop.to_string(),
                hash: hashes.join(" "),
                sheet: sheets,
            });
        }
    }

    if !non_flat.is_empty() {
        let mut base: Vec<(&str, &Value)> = Vec::new();
        let mut query: Vec<(&str, &Value)> = Vec::new();
        for (key, nested) in non_flat.iter() {
            if is_at_rule(key) {
                query.push((key, nested));
            } else {
                base.push((key, nested));
            }
        }
        for (selector, style) in base {
            process_selector_style(selector, style, None, weights, &mut records);
        }
        for (at_rule, nested) in query {
            if let Value::Obj(nested) = nested {
                for (selector, style) in nested.iter() {
                    process_selector_style(selector, style, Some(at_rule), weights, &mut records);
                }
            }
        }
    }

    records
}

fn entries_of(value: &Value) -> Vec<(String, Value)> {
    match value {
        Value::Obj(object) => object
            .iter()
            .map(|(k, v)| (k.to_string(), v.clone()))
            .collect(),
        Value::Str(text) => text
            .encode_utf16()
            .enumerate()
            .map(|(index, unit)| {
                (
                    index.to_string(),
                    Value::Str(String::from_utf16_lossy(&[unit])),
                )
            })
            .collect(),
        _ => Vec::new(),
    }
}

fn process_selector_style(
    selector: &str,
    style: &Value,
    at_rule: Option<&str>,
    weights: Option<&Weights>,
    records: &mut Vec<StyleRecord>,
) {
    for (prop, value) in entries_of(style) {
        let inner = single(&prop, value.clone());
        let source = match at_rule {
            Some(rule) => single(rule, Value::obj(single(selector, Value::obj(inner)))),
            None => single(selector, Value::obj(inner)),
        };
        let key = match at_rule {
            Some(rule) => format!("{rule}:{selector}:{prop}"),
            None => format!("{selector}:{prop}"),
        };
        let weight = weights.and_then(|w| w.get(&key)).copied().unwrap_or(0);
        let normalized = if weight > 0 {
            format!(
                "[{},{}]",
                normalize_object(&source),
                number_to_string(weight as f64)
            )
        } else {
            normalize_object(&source)
        };
        let hash = hash_normalized(&normalized, 1, 8);
        let condition_depth = 1 + usize::from(at_rule.is_some());
        let state_depth = if prop.starts_with("--") {
            0
        } else {
            condition_depth
        };
        let not_suffix = NOT_NORMALIZE.repeat(state_depth + weight.max(0) as usize);

        let mut sheet = transpile_atomic(&prop, &value, &hash, Some(selector));
        sheet = replace_first(&sheet, &format!(".{hash}"), &format!(".{hash}{not_suffix}"));
        if let Some(rule) = at_rule {
            sheet = format!("{rule} {{ {sheet} }}");
        }
        sheet.push('\n');
        records.push(StyleRecord { key, hash, sheet });
    }
}

pub fn class_string(records: &[StyleRecord]) -> String {
    records
        .iter()
        .map(|r| r.hash.as_str())
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn atom_map(style: &Object) -> Object {
    let mut map = Object::new();
    for record in style_records(style, None) {
        map.insert(record.key, Value::Str(record.hash));
    }
    map
}

pub fn atom_class_string(atoms: &Object) -> String {
    atoms
        .values()
        .map(|value| value.to_js_string())
        .collect::<Vec<_>>()
        .join(" ")
}
