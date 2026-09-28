use crate::engine::{camel_to_kebab_case, hash_object, is_at_rule};
use crate::js::{Object, Value};

pub fn theme_hash_of(selector: &str, rule: &Object) -> String {
    let mut source = Object::new();
    source.insert("_themeSelector", Value::str(selector));
    source.assign(rule);
    hash_object(&source)
}

pub fn theme_var_hash(theme_hash: &str, key: &str, value: &Value) -> String {
    let mut source = Object::new();
    source.insert("_theme", Value::str(theme_hash));
    source.insert(key, value.clone());
    hash_object(&source)
}

pub fn theme_var_name(theme_hash: &str, key: &str, value: &Value) -> String {
    format!(
        "--{}-{}",
        theme_var_hash(theme_hash, key, value),
        camel_to_kebab_case(key)
    )
}

pub fn theme_var_reference(theme_hash: &str, key: &str, value: &Value) -> String {
    format!("var({})", theme_var_name(theme_hash, key, value))
}

pub fn theme_atomic_map(theme_hash: &str, rule: &Object) -> Object {
    let mut map = Object::new();
    for (key, value) in rule.iter() {
        map.insert(key, Value::Str(theme_var_reference(theme_hash, key, value)));
    }
    map
}

fn member(value: &Value, name: &str) -> Option<Value> {
    match value {
        Value::Obj(object) => object.get(name).cloned(),
        _ => None,
    }
}

pub fn create_theme(selector: &str, rule: &Object, theme_hash: &str) -> Object {
    let mut root_target = Object::new();
    let mut theme_target = Object::new();
    for (key, value) in rule.iter() {
        let name = theme_var_name(theme_hash, key, value);
        match member(value, "default") {
            Some(default) => root_target.insert(name.clone(), default),
            None => {
                root_target.remove(&name);
            }
        }
        match member(value, "theme") {
            Some(theme) => theme_target.insert(name, theme),
            None => {
                theme_target.remove(&name);
            }
        }
    }

    let mut result = Object::new();
    if is_at_rule(selector) {
        let mut root = root_target;
        root.insert(selector, Value::obj(theme_target));
        result.insert(":where(:root)", Value::obj(root));
        return result;
    }

    let formatted = if selector.starts_with('@')
        || selector.starts_with('.')
        || selector.starts_with('#')
        || selector.starts_with(':')
        || selector.starts_with('[')
    {
        selector.to_string()
    } else {
        format!(".{selector}")
    };
    result.insert(":where(:root)", Value::obj(root_target));
    result.insert(formatted, Value::obj(theme_target));
    result
}

pub fn create_view_transition(rule: &Object, hash: &str) -> Object {
    let mut result = Object::new();
    for (key, pseudo) in [
        ("group", "::view-transition-group"),
        ("imagePair", "::view-transition-image-pair"),
        ("old", "::view-transition-old"),
        ("new", "::view-transition-new"),
    ] {
        if let Some(value) = rule.get(key) {
            result.insert(format!("{pseudo}(vt-{hash})"), value.clone());
        }
    }
    result
}
