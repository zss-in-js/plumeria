use std::sync::OnceLock;

use rustc_hash::FxHashMap;

use super::data::HEX_TO_COLOR_NAME;
use crate::js::Value;
use crate::js::number::number_to_string;

pub const EXCEPTION: &[&str] = &[
    "animation-iteration-count",
    "animation-duration",
    "animation-delay",
    "aspect-ratio",
    "border-image-slice",
    "column-count",
    "columns",
    "fill-opacity",
    "flex",
    "flex-grow",
    "flex-shrink",
    "flood-opacity",
    "font-size-adjust",
    "font-weight",
    "grid-area",
    "grid-column",
    "grid-column-end",
    "grid-column-start",
    "grid-row",
    "grid-row-end",
    "grid-row-start",
    "hyphenate-limit-chars",
    "initial-letter",
    "line-height",
    "mask-border-slice",
    "math-depth",
    "opacity",
    "order",
    "orphans",
    "scale",
    "shape-image-threshold",
    "stop-opacity",
    "stroke-miterlimit",
    "stroke-opacity",
    "tab-size",
    "transition-duration",
    "transition-delay",
    "widows",
    "z-index",
    "zoom",
];

pub fn exception_camel_case() -> &'static [String] {
    static CAMEL: OnceLock<Vec<String>> = OnceLock::new();
    CAMEL.get_or_init(|| EXCEPTION.iter().map(|prop| hyphen_to_upper(prop)).collect())
}

fn hyphen_to_upper(property: &str) -> String {
    let chars: Vec<char> = property.chars().collect();
    let mut out = String::with_capacity(property.len());
    let mut index = 0;
    while index < chars.len() {
        if chars[index] == '-' && index + 1 < chars.len() && chars[index + 1].is_ascii_lowercase() {
            out.push(chars[index + 1].to_ascii_uppercase());
            index += 2;
        } else {
            out.push(chars[index]);
            index += 1;
        }
    }
    out
}

fn hex_table() -> &'static FxHashMap<&'static str, &'static str> {
    static TABLE: OnceLock<FxHashMap<&'static str, &'static str>> = OnceLock::new();
    TABLE.get_or_init(|| HEX_TO_COLOR_NAME.iter().copied().collect())
}

fn is_word_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_'
}

fn convert_hex_to_color_name(value: &str) -> String {
    if value.contains('"') || value.contains('\'') || value.to_ascii_lowercase().contains("url(") {
        return value.to_string();
    }
    if !value.contains('#') {
        return value.to_string();
    }
    let bytes = value.as_bytes();
    let mut out = String::with_capacity(value.len());
    let mut index = 0;
    let mut copied = 0;
    while index < bytes.len() {
        if bytes[index] == b'#' {
            let mut run = 0;
            while index + 1 + run < bytes.len() && bytes[index + 1 + run].is_ascii_hexdigit() {
                run += 1;
            }
            let after = index + 1 + run;
            let boundary = after >= bytes.len() || !is_word_byte(bytes[after]);
            if (3..=6).contains(&run) && boundary {
                let matched = &value[index..after];
                out.push_str(&value[copied..index]);
                let lower = matched.to_ascii_lowercase();
                match hex_table().get(lower.as_str()) {
                    Some(name) => out.push_str(name),
                    None => out.push_str(matched),
                }
                index = after;
                copied = after;
                continue;
            }
        }
        index += 1;
    }
    out.push_str(&value[copied..]);
    out
}

pub fn is_exception(css_prop: &str) -> bool {
    EXCEPTION.contains(&css_prop)
}

pub fn apply_css_value(value: &Value, css_prop: &str) -> String {
    match value {
        Value::Num(number) => {
            if is_exception(css_prop) || css_prop.starts_with("--") {
                number_to_string(*number)
            } else {
                format!("{}px", number_to_string(*number))
            }
        }
        Value::Str(text) => convert_hex_to_color_name(text),
        other => convert_hex_to_color_name(&other.to_js_string()),
    }
}

pub fn camel_to_kebab_case(property: &str) -> String {
    if property.starts_with("--") {
        return property.to_string();
    }
    let prefixed;
    let property = if property.starts_with("ms")
        || property.starts_with("Moz")
        || property.starts_with("Webkit")
    {
        prefixed = format!("-{property}");
        prefixed.as_str()
    } else {
        property
    };
    let chars: Vec<char> = property.chars().collect();
    let mut first: Vec<char> = Vec::with_capacity(chars.len() + 4);
    let mut index = 0;
    while index < chars.len() {
        let c = chars[index];
        if index + 1 < chars.len()
            && (c.is_ascii_lowercase() || c.is_ascii_digit())
            && chars[index + 1].is_ascii_uppercase()
        {
            first.push(c);
            first.push('-');
            first.push(chars[index + 1]);
            index += 2;
        } else {
            first.push(c);
            index += 1;
        }
    }
    let mut second: Vec<char> = Vec::with_capacity(first.len() + 4);
    let mut index = 0;
    while index < first.len() {
        if first[index].is_ascii_uppercase() {
            let mut end = index;
            while end < first.len() && first[end].is_ascii_uppercase() {
                end += 1;
            }
            let run = end - index;
            if run >= 2 && end < first.len() && first[end].is_ascii_lowercase() {
                second.extend_from_slice(&first[index..end - 1]);
                second.push('-');
                second.push(first[end - 1]);
                second.push(first[end]);
                index = end + 1;
                continue;
            }
            second.extend_from_slice(&first[index..end]);
            index = end;
            continue;
        }
        second.push(first[index]);
        index += 1;
    }
    second.into_iter().collect::<String>().to_lowercase()
}

pub fn kebab_to_camel_case(property: &str) -> String {
    if property.starts_with("--") {
        return property.to_string();
    }
    let camel = hyphen_to_upper(property);
    let bytes = camel.as_bytes();
    if bytes.len() >= 3 && bytes[0] == b'M' && bytes[1] == b's' && bytes[2].is_ascii_uppercase() {
        return format!("ms{}", &camel[2..]);
    }
    camel
}

pub fn is_at_rule(prop: &str) -> bool {
    prop.starts_with("@media")
        || prop.starts_with("@container")
        || prop.starts_with("@supports")
        || prop.starts_with("@layer")
        || prop.starts_with("@scope")
}
