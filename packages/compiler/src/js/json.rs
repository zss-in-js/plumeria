use super::number::number_to_string;
use super::value::{Object, Value};

pub fn quote(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    push_quoted(&mut out, text);
    out
}

pub fn push_quoted(out: &mut String, text: &str) {
    out.push('"');
    for c in text.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0c}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

pub fn stringify(value: &Value) -> String {
    let mut out = String::new();
    push_value(&mut out, value);
    out
}

pub fn stringify_object(object: &Object) -> String {
    let mut out = String::new();
    push_object(&mut out, object);
    out
}

fn push_value(out: &mut String, value: &Value) {
    match value {
        Value::Str(text) => push_quoted(out, text),
        Value::Num(number) => {
            if number.is_finite() {
                out.push_str(&number_to_string(*number));
            } else {
                out.push_str("null");
            }
        }
        Value::Bool(flag) => out.push_str(if *flag { "true" } else { "false" }),
        Value::Null => out.push_str("null"),
        Value::Obj(object) => push_object(out, object),
    }
}

fn push_object(out: &mut String, object: &Object) {
    out.push('{');
    let mut first = true;
    for (key, value) in object.iter() {
        if !first {
            out.push(',');
        }
        first = false;
        push_quoted(out, key);
        out.push(':');
        push_value(out, value);
    }
    out.push('}');
}

pub fn stringify_str_list(items: &[&str]) -> String {
    let mut out = String::from("[");
    for (index, item) in items.iter().enumerate() {
        if index > 0 {
            out.push(',');
        }
        push_quoted(&mut out, item);
    }
    out.push(']');
    out
}
