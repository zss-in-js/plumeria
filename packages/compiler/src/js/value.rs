use std::sync::Arc;

use indexmap::IndexMap;
use rustc_hash::FxBuildHasher;

use super::number::number_to_string;

#[derive(Clone, Debug, PartialEq)]
pub enum Value {
    Str(String),
    Num(f64),
    Bool(bool),
    Null,
    Obj(Arc<Object>),
}

impl Value {
    pub fn str(value: impl Into<String>) -> Self {
        Value::Str(value.into())
    }

    pub fn obj(object: Object) -> Self {
        Value::Obj(Arc::new(object))
    }

    pub fn as_obj(&self) -> Option<&Object> {
        match self {
            Value::Obj(object) => Some(object),
            _ => None,
        }
    }

    pub fn is_obj(&self) -> bool {
        matches!(self, Value::Obj(_))
    }

    pub fn is_primitive_text(&self) -> bool {
        matches!(self, Value::Str(_) | Value::Num(_))
    }

    pub fn truthy(&self) -> bool {
        match self {
            Value::Str(value) => !value.is_empty(),
            Value::Num(value) => *value != 0.0 && !value.is_nan(),
            Value::Bool(value) => *value,
            Value::Null => false,
            Value::Obj(_) => true,
        }
    }

    pub fn type_of(&self) -> &'static str {
        match self {
            Value::Str(_) => "string",
            Value::Num(_) => "number",
            Value::Bool(_) => "boolean",
            Value::Null | Value::Obj(_) => "object",
        }
    }

    pub fn to_js_string(&self) -> String {
        match self {
            Value::Str(value) => value.clone(),
            Value::Num(value) => number_to_string(*value),
            Value::Bool(value) => value.to_string(),
            Value::Null => "null".to_string(),
            Value::Obj(_) => "[object Object]".to_string(),
        }
    }
}

pub fn is_array_index(key: &str) -> bool {
    let bytes = key.as_bytes();
    if bytes.is_empty() || bytes.len() > 10 {
        return false;
    }
    if bytes.len() > 1 && bytes[0] == b'0' {
        return false;
    }
    if !bytes.iter().all(u8::is_ascii_digit) {
        return false;
    }
    key.parse::<u64>().is_ok_and(|index| index < 4_294_967_295)
}

#[derive(Clone, Debug, Default)]
pub struct Object {
    entries: IndexMap<String, Value, FxBuildHasher>,
    indexed: usize,
}

impl PartialEq for Object {
    fn eq(&self, other: &Self) -> bool {
        self.len() == other.len()
            && self
                .iter()
                .zip(other.iter())
                .all(|((a, x), (b, y))| a == b && x == y)
    }
}

impl Object {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn get(&self, key: &str) -> Option<&Value> {
        self.entries.get(key)
    }

    pub fn get_mut(&mut self, key: &str) -> Option<&mut Value> {
        self.entries.get_mut(key)
    }

    pub fn contains_key(&self, key: &str) -> bool {
        self.entries.contains_key(key)
    }

    pub fn insert(&mut self, key: impl Into<String>, value: Value) {
        let key = key.into();
        if let Some(slot) = self.entries.get_mut(&key) {
            *slot = value;
            return;
        }
        if is_array_index(&key) {
            self.indexed += 1;
        }
        self.entries.insert(key, value);
    }

    pub fn remove(&mut self, key: &str) -> Option<Value> {
        let removed = self.entries.shift_remove(key);
        if removed.is_some() && is_array_index(key) {
            self.indexed -= 1;
        }
        removed
    }

    pub fn assign(&mut self, other: &Object) {
        for (key, value) in other.iter() {
            self.insert(key, value.clone());
        }
    }

    pub fn keys(&self) -> Vec<&str> {
        self.iter().map(|(key, _)| key).collect()
    }

    pub fn iter(&self) -> ObjectIter<'_> {
        if self.indexed == 0 {
            return ObjectIter::Plain(self.entries.iter());
        }
        let mut order: Vec<usize> = Vec::with_capacity(self.entries.len());
        let mut indexes: Vec<(u64, usize)> = Vec::with_capacity(self.indexed);
        for (position, key) in self.entries.keys().enumerate() {
            if is_array_index(key) {
                indexes.push((key.parse().unwrap_or(0), position));
            }
        }
        indexes.sort_unstable();
        order.extend(indexes.into_iter().map(|(_, position)| position));
        for (position, key) in self.entries.keys().enumerate() {
            if !is_array_index(key) {
                order.push(position);
            }
        }
        ObjectIter::Ordered {
            object: self,
            order,
            next: 0,
        }
    }

    pub fn values(&self) -> impl Iterator<Item = &Value> {
        self.iter().map(|(_, value)| value)
    }
}

pub enum ObjectIter<'a> {
    Plain(indexmap::map::Iter<'a, String, Value>),
    Ordered {
        object: &'a Object,
        order: Vec<usize>,
        next: usize,
    },
}

impl<'a> Iterator for ObjectIter<'a> {
    type Item = (&'a str, &'a Value);

    fn next(&mut self) -> Option<Self::Item> {
        match self {
            ObjectIter::Plain(iter) => iter.next().map(|(key, value)| (key.as_str(), value)),
            ObjectIter::Ordered {
                object,
                order,
                next,
            } => {
                let position = *order.get(*next)?;
                *next += 1;
                object
                    .entries
                    .get_index(position)
                    .map(|(key, value)| (key.as_str(), value))
            }
        }
    }
}

impl FromIterator<(String, Value)> for Object {
    fn from_iter<T: IntoIterator<Item = (String, Value)>>(iter: T) -> Self {
        let mut object = Object::new();
        for (key, value) in iter {
            object.insert(key, value);
        }
        object
    }
}

pub fn deep_merge(target: &Object, source: &Object) -> Object {
    let mut result = target.clone();
    for (key, value) in source.iter() {
        if let Value::Obj(inner) = value
            && let Some(Value::Obj(existing)) = result.get(key)
        {
            let merged = deep_merge(existing, inner);
            result.insert(key, Value::obj(merged));
            continue;
        }
        result.insert(key, value.clone());
    }
    result
}

pub fn entries_object(value: &Value) -> Object {
    match value {
        Value::Obj(object) => (**object).clone(),
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
        _ => Object::new(),
    }
}
