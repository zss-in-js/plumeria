use indexmap::IndexMap;
use rustc_hash::FxBuildHasher;

use super::hash::hash_object;
use super::helper::{apply_css_value, camel_to_kebab_case, is_at_rule};
use super::shorthand::get_property_depth;
use crate::js::{Object, Value};

pub const NOT_NORMALIZE: &str = ":not(#\\#)";

pub fn transpile_atomic(property: &str, value: &Value, hash: &str, pseudo: Option<&str>) -> String {
    if !value.is_primitive_text() {
        return String::new();
    }
    let css_prop = camel_to_kebab_case(property);
    let apply_value = apply_css_value(value, &css_prop);
    let mut selector = format!(
        ".{hash}{}",
        NOT_NORMALIZE.repeat(get_property_depth(&css_prop))
    );
    if let Some(pseudo) = pseudo {
        selector.push_str(pseudo);
    }
    let rule = format!("{selector} {{ {css_prop}: {apply_value}; }}");
    if is_at_rule(property) {
        return format!("{property} {{ {rule} }}");
    }
    rule
}

pub fn split_atomic_and_nested(object: &Object, flat: &mut Object, non_flat: &mut Object) {
    for (property, value) in object.iter() {
        if property.starts_with(':') || property.starts_with('[') {
            non_flat.insert(property, value.clone());
        } else if is_at_rule(property) {
            let mut inner_flat = Object::new();
            let mut inner_non_flat = Object::new();
            if let Value::Obj(inner) = value {
                split_atomic_and_nested(inner, &mut inner_flat, &mut inner_non_flat);
            }
            if !inner_flat.is_empty() {
                flat.insert(property, Value::obj(inner_flat));
            }
            if !inner_non_flat.is_empty() {
                non_flat.insert(property, Value::obj(inner_non_flat));
            }
        } else {
            flat.insert(property, value.clone());
        }
    }
}

pub type AtomicMap = IndexMap<String, String, FxBuildHasher>;

fn walk_atomic_props(flat: &Object, atomic_map: &mut AtomicMap, at_rules: &mut Vec<String>) {
    let mut queue: Vec<(&str, &Value)> = Vec::new();
    for (key, style) in flat.iter() {
        if is_at_rule(key) {
            at_rules.push(key.to_string());
            match style {
                Value::Obj(inner) => walk_atomic_props(inner, atomic_map, at_rules),
                _ => walk_atomic_props(&Object::new(), atomic_map, at_rules),
            }
            at_rules.pop();
            continue;
        }
        queue.push((key, style));
    }

    for (property, value) in queue {
        let css_prop = camel_to_kebab_case(property);
        let normalized = apply_css_value(value, &css_prop);
        let mut source = Object::new();
        source.insert(property, Value::Str(normalized));
        for rule in at_rules.iter().rev() {
            let mut wrapped = Object::new();
            wrapped.insert(rule.clone(), Value::obj(source));
            source = wrapped;
        }
        let atomic_hash = hash_object(&source);
        if atomic_map.contains_key(&atomic_hash) {
            continue;
        }
        let mut sheet = transpile_atomic(property, value, &atomic_hash, None);
        for rule in at_rules.iter().rev() {
            sheet = format!("{rule} {{ {sheet} }}");
        }
        sheet.push('\n');
        atomic_map.insert(atomic_hash, sheet);
    }
}

pub fn process_atomic_props(
    flat: &Object,
    atomic_map: &mut AtomicMap,
    parent_at_rule: Option<&str>,
) {
    let mut at_rules: Vec<String> = parent_at_rule
        .map(|rule| vec![rule.to_string()])
        .unwrap_or_default();
    walk_atomic_props(flat, atomic_map, &mut at_rules);
}

fn create_keyframes(property: &str, content: &Value) -> String {
    let mut rules = format!("{property} {{\n");
    if let Value::Obj(frames) = content {
        for (key, frame) in frames.iter() {
            rules.push_str(&format!("  {key} {{\n"));
            for (prop, value) in js_for_in(frame) {
                let css_prop = camel_to_kebab_case(&prop);
                if value.is_primitive_text() {
                    let apply_value = apply_css_value(&value, &css_prop);
                    rules.push_str(&format!("    {css_prop}: {apply_value};\n"));
                }
            }
            rules.push_str("  }\n");
        }
    }
    rules.push_str("}\n");
    rules
}

fn js_for_in(value: &Value) -> Vec<(String, Value)> {
    match value {
        Value::Obj(object) => object
            .iter()
            .map(|(key, value)| (key.to_string(), value.clone()))
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

fn at_rule_converter(class_name: &str, properties: &Value, indent: &str) -> String {
    let mut nested_rules = String::new();
    let mut regular_rules = String::new();
    let mut inner_at_rules = String::new();

    for (property, value) in js_for_in(properties) {
        if is_at_rule(&property) {
            let inner_indent = format!("{indent}  ");
            let inner_body = at_rule_converter(class_name, &value, &inner_indent);
            inner_at_rules.push_str(&format!("{indent}{property} {{\n{inner_body}{indent}}}\n"));
            continue;
        }
        if property.starts_with(':') || property.starts_with('[') {
            let kebab_property = camel_to_kebab_case(&property);
            let mut pseudo_rule = String::new();
            if let Value::Obj(inner) = &value {
                for (pseudo_prop, pseudo_value) in inner.iter() {
                    let css_prop = camel_to_kebab_case(pseudo_prop);
                    let apply_value = apply_css_value(pseudo_value, &css_prop);
                    pseudo_rule.push_str(&format!("{indent}  {css_prop}: {apply_value};\n"));
                }
            }
            nested_rules.push_str(&format!(
                "{indent}{class_name}{NOT_NORMALIZE}{kebab_property} {{\n{pseudo_rule}{indent}}}\n"
            ));
        } else {
            let css_prop = camel_to_kebab_case(&property);
            let apply_value = apply_css_value(&value, &css_prop);
            regular_rules.push_str(&format!("{indent}  {css_prop}: {apply_value};\n"));
        }
    }

    let base_rule = if regular_rules.is_empty() {
        String::new()
    } else {
        format!("{indent}{class_name} {{\n{regular_rules}{indent}}}\n")
    };
    format!("{base_rule}{nested_rules}{inner_at_rules}")
}

type SelectorMap = IndexMap<String, String, FxBuildHasher>;

fn string_converter(
    class_name: &str,
    properties: &Value,
    indent_level: usize,
    media_queries: &mut Vec<String>,
) -> SelectorMap {
    let mut class_selector: SelectorMap = SelectorMap::default();
    let inner_indent = " ".repeat(indent_level + 1);
    let mut css_rule = String::new();

    for (property, value) in js_for_in(properties) {
        if value.is_primitive_text() {
            let css_prop = camel_to_kebab_case(&property);
            let apply_value = apply_css_value(&value, &css_prop);
            css_rule.push_str(&format!("  {css_prop}: {apply_value};\n"));
        } else if !property.starts_with('@') {
            let kebab = camel_to_kebab_case(&property);
            let is_pseudo = property.starts_with(':') || property.starts_with('[');
            let selector = if is_pseudo {
                format!("{class_name}{NOT_NORMALIZE}{kebab}")
            } else {
                format!("{class_name}{kebab}")
            };
            let styles = string_converter(&selector, &value, indent_level, media_queries);
            for (key, rule) in styles {
                class_selector.insert(key, rule);
            }
        } else if is_at_rule(&property) {
            let body = at_rule_converter(class_name, &value, &inner_indent);
            media_queries.push(format!("{property} {{\n{body}}}\n"));
        }
    }

    class_selector.insert(class_name.to_string(), css_rule);
    class_selector
}

pub fn transpile_global(object: &Object) -> String {
    let mut style_sheet = String::new();
    let mut media_queries: Vec<String> = Vec::new();

    for (property, value) in object.iter() {
        if property.starts_with("@keyframes") {
            style_sheet.push_str(&create_keyframes(property, value));
        }
        let selectors = string_converter(property, value, 1, &mut media_queries);
        for (selector, rule) in selectors {
            if !selector.starts_with("@keyframes") && !rule.is_empty() {
                style_sheet.push_str(&format!("{selector} {{\n{rule}}}\n"));
            }
        }
    }

    for css in media_queries {
        style_sheet.push_str(&css);
    }
    style_sheet
}
