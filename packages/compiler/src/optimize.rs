use indexmap::IndexMap;
use rustc_hash::FxBuildHasher;

use crate::engine::conditional::implies_condition;
use crate::engine::is_at_rule;

#[derive(Debug, Clone)]
enum Node {
    Rule {
        selector: String,
        children: Vec<Node>,
    },
    AtRule {
        name: String,
        params: String,
        children: Option<Vec<Node>>,
    },
    Decl(String),
    Comment(String),
}

struct Parser<'s> {
    chars: Vec<char>,
    index: usize,
    _source: &'s str,
}

impl<'s> Parser<'s> {
    fn new(source: &'s str) -> Self {
        Parser {
            chars: source.chars().collect(),
            index: 0,
            _source: source,
        }
    }

    fn prelude(text: &str) -> Option<(String, String)> {
        let text = text.trim();
        let rest = text.strip_prefix('@')?;
        let end = rest
            .find(|c: char| !(c.is_alphanumeric() || c == '-' || c == '_'))
            .unwrap_or(rest.len());
        Some((rest[..end].to_string(), rest[end..].trim().to_string()))
    }

    fn parse_block(&mut self, top: bool) -> Vec<Node> {
        let mut nodes = Vec::new();
        let mut buffer = String::new();
        let mut parens = 0i32;
        while self.index < self.chars.len() {
            let c = self.chars[self.index];
            if c == '/' && self.chars.get(self.index + 1) == Some(&'*') {
                let start = self.index;
                self.index += 2;
                while self.index < self.chars.len()
                    && !(self.chars[self.index] == '*'
                        && self.chars.get(self.index + 1) == Some(&'/'))
                {
                    self.index += 1;
                }
                self.index = (self.index + 2).min(self.chars.len());
                let comment: String = self.chars[start..self.index].iter().collect();
                if buffer.trim().is_empty() {
                    nodes.push(Node::Comment(comment));
                } else {
                    buffer.push_str(&comment);
                }
                continue;
            }
            if c == '"' || c == '\'' {
                buffer.push(c);
                self.index += 1;
                while self.index < self.chars.len() {
                    let d = self.chars[self.index];
                    buffer.push(d);
                    self.index += 1;
                    if d == '\\' {
                        if let Some(next) = self.chars.get(self.index) {
                            buffer.push(*next);
                            self.index += 1;
                        }
                        continue;
                    }
                    if d == c {
                        break;
                    }
                }
                continue;
            }
            if c == '\\' {
                buffer.push(c);
                if let Some(next) = self.chars.get(self.index + 1) {
                    buffer.push(*next);
                }
                self.index += 2;
                continue;
            }
            if c == '(' {
                parens += 1;
            } else if c == ')' {
                parens -= 1;
            }
            if parens > 0 {
                buffer.push(c);
                self.index += 1;
                continue;
            }
            match c {
                '{' => {
                    self.index += 1;
                    let children = self.parse_block(false);
                    let text = std::mem::take(&mut buffer);
                    match Self::prelude(&text) {
                        Some((name, params)) => nodes.push(Node::AtRule {
                            name,
                            params,
                            children: Some(children),
                        }),
                        None => nodes.push(Node::Rule {
                            selector: text.trim().to_string(),
                            children,
                        }),
                    }
                }
                ';' => {
                    self.index += 1;
                    let text = std::mem::take(&mut buffer);
                    push_statement(&mut nodes, &text);
                }
                '}' => {
                    self.index += 1;
                    let text = std::mem::take(&mut buffer);
                    push_statement(&mut nodes, &text);
                    if !top {
                        return nodes;
                    }
                }
                _ => {
                    buffer.push(c);
                    self.index += 1;
                }
            }
        }
        push_statement(&mut nodes, &buffer);
        nodes
    }
}

fn push_statement(nodes: &mut Vec<Node>, text: &str) {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return;
    }
    match Parser::prelude(trimmed) {
        Some((name, params)) => nodes.push(Node::AtRule {
            name,
            params,
            children: None,
        }),
        None => nodes.push(Node::Decl(trimmed.to_string())),
    }
}

fn condition_of(name: &str, params: &str) -> String {
    format!("@{name} {params}")
}

fn sort_by_implication(nodes: Vec<Node>) -> Vec<Node> {
    let conditions: Vec<String> = nodes
        .iter()
        .map(|node| match node {
            Node::AtRule { name, params, .. } => condition_of(name, params),
            _ => String::new(),
        })
        .collect();
    let blocked_by: Vec<Vec<usize>> = (0..nodes.len())
        .map(|i| {
            (0..nodes.len())
                .filter(|j| i != *j && implies_condition(&conditions[i], &conditions[*j]))
                .collect()
        })
        .collect();
    let mut emitted = vec![false; nodes.len()];
    let mut order: Vec<usize> = Vec::new();
    while order.len() < nodes.len() {
        let next = (0..nodes.len())
            .find(|i| !emitted[*i] && blocked_by[*i].iter().all(|other| emitted[*other]));
        match next {
            Some(index) => {
                emitted[index] = true;
                order.push(index);
            }
            None => return nodes,
        }
    }
    let mut slots: Vec<Option<Node>> = nodes.into_iter().map(Some).collect();
    order
        .into_iter()
        .map(|index| slots[index].take().unwrap())
        .collect()
}

fn merge_container(nodes: Vec<Node>) -> Vec<Node> {
    let mut kept: Vec<Option<Node>> = Vec::with_capacity(nodes.len());
    let mut rules: IndexMap<String, usize, FxBuildHasher> = IndexMap::default();
    let mut at_rules: IndexMap<String, usize, FxBuildHasher> = IndexMap::default();
    for node in nodes {
        match node {
            Node::Rule { selector, children } => {
                if let Some(index) = rules.get(&selector) {
                    if let Some(Node::Rule {
                        children: previous, ..
                    }) = kept[*index].as_mut()
                    {
                        previous.extend(children);
                    }
                    continue;
                }
                rules.insert(selector.clone(), kept.len());
                kept.push(Some(Node::Rule { selector, children }));
            }
            Node::AtRule {
                name,
                params,
                children: Some(children),
            } => {
                let key = format!("{name}\0{params}");
                if let Some(index) = at_rules.get(&key) {
                    if let Some(Node::AtRule {
                        children: Some(previous),
                        ..
                    }) = kept[*index].as_mut()
                    {
                        previous.extend(children);
                    }
                    continue;
                }
                at_rules.insert(key, kept.len());
                kept.push(Some(Node::AtRule {
                    name,
                    params,
                    children: Some(children),
                }));
            }
            other => kept.push(Some(other)),
        }
    }
    let targets: Vec<usize> = rules.values().chain(at_rules.values()).copied().collect();
    for index in targets {
        if let Some(node) = kept[index].take() {
            kept[index] = Some(match node {
                Node::Rule { selector, children } => Node::Rule {
                    selector,
                    children: merge_container(children),
                },
                Node::AtRule {
                    name,
                    params,
                    children: Some(children),
                } => Node::AtRule {
                    name,
                    params,
                    children: Some(merge_container(children)),
                },
                other => other,
            });
        }
    }
    let mut front: Vec<Node> = Vec::new();
    let mut conditionals: Vec<Node> = Vec::new();
    for node in kept.into_iter().flatten() {
        let is_conditional =
            matches!(&node, Node::AtRule { name, .. } if is_at_rule(&format!("@{name}")));
        if is_conditional {
            conditionals.push(node);
        } else {
            front.push(node);
        }
    }
    front.extend(sort_by_implication(conditionals));
    front
}

fn serialize(nodes: &[Node], indent: usize, out: &mut String) {
    let pad = "  ".repeat(indent);
    for node in nodes {
        match node {
            Node::Rule { selector, children } => {
                out.push_str(&format!("{pad}{selector} {{\n"));
                serialize(children, indent + 1, out);
                out.push_str(&format!("{pad}}}\n"));
            }
            Node::AtRule {
                name,
                params,
                children: Some(children),
            } => {
                if params.is_empty() {
                    out.push_str(&format!("{pad}@{name} {{\n"));
                } else {
                    out.push_str(&format!("{pad}@{name} {params} {{\n"));
                }
                serialize(children, indent + 1, out);
                out.push_str(&format!("{pad}}}\n"));
            }
            Node::AtRule {
                name,
                params,
                children: None,
            } => {
                if params.is_empty() {
                    out.push_str(&format!("{pad}@{name};\n"));
                } else {
                    out.push_str(&format!("{pad}@{name} {params};\n"));
                }
            }
            Node::Decl(text) => out.push_str(&format!("{pad}{text};\n")),
            Node::Comment(text) => out.push_str(&format!("{pad}{text}\n")),
        }
    }
}

pub fn merge_rules(css: &str) -> String {
    let nodes = Parser::new(css).parse_block(true);
    let merged = merge_container(nodes);
    let mut out = String::with_capacity(css.len());
    serialize(&merged, 0, &mut out);
    out
}

pub fn optimize(css: &str, minify: bool) -> Result<String, String> {
    use lightningcss::printer::PrinterOptions;
    use lightningcss::stylesheet::{MinifyOptions, ParserOptions, StyleSheet};
    use lightningcss::targets::{Browsers, Targets};

    let merged = merge_rules(css);
    let targets = Targets::from(Browsers {
        safari: Some(16 << 16),
        edge: Some(110 << 16),
        firefox: Some(110 << 16),
        chrome: Some(110 << 16),
        ..Browsers::default()
    });
    let mut sheet = StyleSheet::parse(
        &merged,
        ParserOptions {
            filename: "global.css".to_string(),
            ..ParserOptions::default()
        },
    )
    .map_err(|error| error.to_string())?;
    sheet
        .minify(MinifyOptions {
            targets,
            ..MinifyOptions::default()
        })
        .map_err(|error| error.to_string())?;
    sheet
        .to_css(PrinterOptions {
            minify,
            targets,
            ..PrinterOptions::default()
        })
        .map(|out| out.code)
        .map_err(|error| error.to_string())
}
