use indexmap::IndexSet;
use rustc_hash::{FxBuildHasher, FxHashSet};

use super::records::style_records;
use super::theme::{
    create_position_try, create_theme, create_var_type, create_view_transition, theme_var_name,
};
use crate::engine::transpile_global;
use crate::js::{Object, Value, entries_object};

pub trait SheetTables {
    fn keyframes_obj(&self, hash: &str) -> Option<Value>;
    fn view_transition_obj(&self, hash: &str) -> Option<Value>;
    fn position_try_obj(&self, hash: &str) -> Option<Value>;
    fn var_type_obj(&self, hash: &str) -> Option<Value>;
    fn create_obj(&self, hash: &str) -> Option<Value>;
    fn theme_names_sorted(&self) -> Vec<(String, String)>;
    fn theme_obj(&self, hash: &str) -> Option<Value>;
    fn theme_selector(&self, hash: &str) -> Option<String>;
}

fn find_markers(text: &str, mut found: impl FnMut(&str, &str)) {
    let bytes = text.as_bytes();
    let mut i = 0;
    while i + 3 < bytes.len() {
        let prefix = &bytes[i..i + 3];
        let kind = match prefix {
            b"kf-" => "kf",
            b"vt-" => "vt",
            b"pt-" => "pt",
            b"pr-" => "pr",
            b"cr-" => "cr",
            _ => {
                i += 1;
                continue;
            }
        };
        let start = i + 3;
        let mut end = start;
        while end < bytes.len() && (bytes[end].is_ascii_digit() || bytes[end].is_ascii_lowercase())
        {
            end += 1;
        }
        if end == start {
            i += 1;
            continue;
        }
        found(kind, &text[start..end]);
        i = end;
    }
}

fn find_custom_properties(text: &str, mut found: impl FnMut(&str)) {
    let mut rest = text;
    while let Some(index) = rest.find("var(") {
        let after = &rest[index + 4..];
        let trimmed = after.trim_start();
        if let Some(name_part) = trimmed.strip_prefix("--") {
            let end = name_part
                .char_indices()
                .find(|(_, c)| c.is_whitespace() || *c == ',' || *c == ')')
                .map(|(i, _)| i)
                .unwrap_or(name_part.len());
            if end > 0 {
                found(&trimmed[..end + 2]);
            }
        }
        rest = &rest[index + 4..];
    }
}

struct Walker<'t> {
    tables: &'t dyn SheetTables,
    keyframes: IndexSet<String, FxBuildHasher>,
    view_transitions: IndexSet<String, FxBuildHasher>,
    position_tries: IndexSet<String, FxBuildHasher>,
    var_types: IndexSet<String, FxBuildHasher>,
    creates: IndexSet<String, FxBuildHasher>,
    variables: FxHashSet<String>,
}

impl Walker<'_> {
    fn find_var_types(&mut self, text: &str) {
        let mut hits: Vec<String> = Vec::new();
        find_markers(text, |kind, hash| {
            if kind == "pr" {
                hits.push(hash.to_string());
            }
        });
        for hash in hits {
            if !self.var_types.contains(&hash) && self.tables.var_type_obj(&hash).is_some() {
                self.var_types.insert(hash);
            }
        }
    }

    fn walk(&mut self, object: &Object) {
        for key in object.keys() {
            if key.contains("pr-") {
                self.find_var_types(key);
            }
        }
        for value in object.values() {
            match value {
                Value::Str(text) => {
                    if text.contains("pr-") {
                        self.find_var_types(text);
                    }
                    if text.contains("kf-")
                        || text.contains("vt-")
                        || text.contains("pt-")
                        || text.contains("cr-")
                    {
                        let mut hits: Vec<(String, String)> = Vec::new();
                        find_markers(text, |kind, hash| {
                            hits.push((kind.to_string(), hash.to_string()))
                        });
                        for (kind, hash) in hits {
                            match kind.as_str() {
                                "kf" => {
                                    if !self.keyframes.contains(&hash)
                                        && let Some(found) = self.tables.keyframes_obj(&hash)
                                    {
                                        self.keyframes.insert(hash);
                                        if let Value::Obj(found) = found {
                                            self.walk(&found);
                                        }
                                    }
                                }
                                "vt" => {
                                    if !self.view_transitions.contains(&hash)
                                        && let Some(found) = self.tables.view_transition_obj(&hash)
                                    {
                                        self.view_transitions.insert(hash);
                                        if let Value::Obj(found) = found {
                                            self.walk(&found);
                                        }
                                    }
                                }
                                "pt" => {
                                    if !self.position_tries.contains(&hash)
                                        && let Some(found) = self.tables.position_try_obj(&hash)
                                    {
                                        self.position_tries.insert(hash);
                                        if let Value::Obj(found) = found {
                                            self.walk(&found);
                                        }
                                    }
                                }
                                "pr" => {}
                                _ => {
                                    if !self.creates.contains(&hash)
                                        && let Some(found) = self.tables.create_obj(&hash)
                                    {
                                        self.creates.insert(hash);
                                        if let Value::Obj(found) = found {
                                            self.walk(&found);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if text.contains("var(") {
                        find_custom_properties(text, |name| {
                            self.variables.insert(name.to_string());
                        });
                    }
                }
                Value::Obj(inner) => self.walk(inner),
                _ => {}
            }
        }
    }
}

pub fn extract_ondemand_styles(
    style: &Object,
    add_sheet: &mut dyn FnMut(String),
    tables: &dyn SheetTables,
) {
    let mut walker = Walker {
        tables,
        keyframes: IndexSet::default(),
        view_transitions: IndexSet::default(),
        position_tries: IndexSet::default(),
        var_types: IndexSet::default(),
        creates: IndexSet::default(),
        variables: FxHashSet::default(),
    };
    walker.walk(style);

    for hash in &walker.keyframes {
        if let Some(definition) = tables.keyframes_obj(hash) {
            let mut wrapper = Object::new();
            wrapper.insert(format!("@keyframes kf-{hash}"), definition);
            add_sheet(transpile_global(&wrapper));
        }
    }
    for hash in &walker.view_transitions {
        if let Some(Value::Obj(object)) = tables.view_transition_obj(hash) {
            add_sheet(transpile_global(&create_view_transition(&object, hash)));
        }
    }
    for hash in &walker.position_tries {
        if let Some(Value::Obj(object)) = tables.position_try_obj(hash) {
            add_sheet(transpile_global(&create_position_try(&object, hash)));
        }
    }
    for hash in &walker.var_types {
        if let Some(Value::Obj(object)) = tables.var_type_obj(hash) {
            add_sheet(transpile_global(&create_var_type(&object, hash)));
        }
    }
    for hash in &walker.creates {
        if let Some(Value::Obj(object)) = tables.create_obj(hash) {
            for (_, style) in object.iter() {
                for record in style_records(&entries_object(style), None) {
                    add_sheet(record.sheet);
                }
            }
        }
    }
    if !walker.variables.is_empty() {
        for (_, hash) in tables.theme_names_sorted() {
            let (Some(Value::Obj(definition)), Some(selector)) =
                (tables.theme_obj(&hash), tables.theme_selector(&hash))
            else {
                continue;
            };
            if selector.is_empty() {
                continue;
            }
            for (key, value) in definition.iter() {
                let name = theme_var_name(&hash, key, value);
                if walker.variables.contains(&name) {
                    let mut single = Object::new();
                    single.insert(key, value.clone());
                    let styles = create_theme(&selector, &single, &hash);
                    add_sheet(transpile_global(&styles));
                }
            }
        }
    }
}
