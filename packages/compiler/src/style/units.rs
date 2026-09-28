use indexmap::IndexMap;
use rustc_hash::{FxBuildHasher, FxHashSet};

use crate::engine::{apply_css_value, camel_to_kebab_case, exception_camel_case};
use crate::js::{Object, Value};

const CSS_UNITS: &[&str] = &[
    "px", "cm", "mm", "q", "in", "pc", "pt", "cap", "ch", "em", "ex", "ic", "lh", "rcap", "rch",
    "rem", "rex", "ric", "rlh", "vh", "vw", "vmin", "vmax", "vb", "vi", "svw", "svh", "svmin",
    "svmax", "svb", "svi", "lvw", "lvh", "lvmin", "lvmax", "lvb", "lvi", "dvw", "dvh", "dvmin",
    "dvmax", "dvb", "dvi", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax", "deg", "grad", "rad",
    "turn", "s", "ms", "hz", "khz", "dpi", "dpcm", "dppx", "x", "fr",
];

pub fn is_unitless_prop(prop: &str) -> bool {
    exception_camel_case().iter().any(|name| name == prop) || prop.starts_with("--")
}

fn written_unit_after(rest: &str) -> String {
    let bytes = rest.as_bytes();
    if bytes.first() == Some(&b'%') {
        return "%".to_string();
    }
    if !bytes.first().is_some_and(u8::is_ascii_alphabetic) {
        return String::new();
    }
    let mut end = 1;
    while end < bytes.len() && (bytes[end].is_ascii_alphanumeric() || bytes[end] == b'-') {
        end += 1;
    }
    let token = &rest[..end];
    if CSS_UNITS.contains(&token.to_ascii_lowercase().as_str()) {
        token.to_string()
    } else {
        String::new()
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct VarUnit {
    pub unit: String,
    pub written: bool,
}

#[derive(Clone, Debug)]
pub struct VarGroup {
    pub css_var: String,
    pub prop: String,
    pub unit: String,
    pub written: bool,
}

fn unit_at(prop: &str, rest: &str) -> VarUnit {
    let written = written_unit_after(rest);
    if !written.is_empty() {
        return VarUnit {
            unit: written,
            written: true,
        };
    }
    VarUnit {
        unit: if is_unitless_prop(prop) {
            String::new()
        } else {
            "px".to_string()
        },
        written: false,
    }
}

fn unit_key(unit: &VarUnit) -> String {
    format!(
        "{}:{}",
        if unit.written { "written" } else { "default" },
        unit.unit
    )
}

fn unit_slug(unit: &VarUnit) -> String {
    if unit.unit == "%" {
        "percent".to_string()
    } else if unit.unit.is_empty() {
        "unitless".to_string()
    } else {
        unit.unit.clone()
    }
}

fn rewrite_var_occurrences(
    style: &mut Object,
    css_var: &str,
    assign: &mut dyn FnMut(&str, &VarUnit) -> String,
) {
    let reference = format!("var({css_var})");
    let keys: Vec<String> = style.keys().into_iter().map(str::to_string).collect();
    for prop in keys {
        let Some(value) = style.get_mut(&prop) else {
            continue;
        };
        match value {
            Value::Str(text) if text.contains(&reference) => {
                let mut rewritten = String::new();
                let mut rest = text.clone();
                while let Some(at) = rest.find(&reference) {
                    let after = rest[at + reference.len()..].to_string();
                    let unit = unit_at(&prop, &after);
                    let name = assign(&prop, &unit);
                    rewritten.push_str(&rest[..at]);
                    rewritten.push_str(&format!("var({name})"));
                    rest = if unit.written {
                        after[unit.unit.len()..].to_string()
                    } else {
                        after
                    };
                }
                *text = rewritten + &rest;
            }
            Value::Obj(inner) => {
                rewrite_var_occurrences(std::sync::Arc::make_mut(inner), css_var, assign)
            }
            _ => {}
        }
    }
}

pub fn split_var_by_unit(style: &mut Object, css_var: &str) -> Vec<VarGroup> {
    let mut groups: IndexMap<String, VarGroup, FxBuildHasher> = IndexMap::default();
    let mut taken: FxHashSet<String> = FxHashSet::default();
    rewrite_var_occurrences(style, css_var, &mut |prop, unit| {
        let key = unit_key(unit);
        if let Some(group) = groups.get(&key) {
            return group.css_var.clone();
        }
        let mut name = css_var.to_string();
        if !groups.is_empty() {
            let kebab = camel_to_kebab_case(prop);
            let base = format!("{css_var}-{}", kebab.trim_start_matches('-'));
            name = if taken.contains(&base) {
                format!("{base}-{}", unit_slug(unit))
            } else {
                base
            };
        }
        taken.insert(name.clone());
        groups.insert(
            key,
            VarGroup {
                css_var: name.clone(),
                prop: prop.to_string(),
                unit: unit.unit.clone(),
                written: unit.written,
            },
        );
        name
    });
    groups.into_values().collect()
}

pub fn apply_var_fallback(style: &mut Object, css_var: &str, literal: &Value, unit: &VarUnit) {
    let reference = format!("var({css_var})");
    let keys: Vec<String> = style.keys().into_iter().map(str::to_string).collect();
    for prop in keys {
        let Some(value) = style.get_mut(&prop) else {
            continue;
        };
        match value {
            Value::Str(text) if text.contains(&reference) => {
                let fallback = if unit.written {
                    format!("{}{}", literal.to_js_string(), unit.unit)
                } else {
                    apply_css_value(literal, &camel_to_kebab_case(&prop))
                };
                *text = text
                    .split(reference.as_str())
                    .collect::<Vec<_>>()
                    .join(&format!("var({css_var}, {fallback})"));
            }
            Value::Obj(inner) => {
                apply_var_fallback(std::sync::Arc::make_mut(inner), css_var, literal, unit)
            }
            _ => {}
        }
    }
}
