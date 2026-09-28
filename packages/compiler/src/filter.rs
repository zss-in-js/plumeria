const CORE: &str = "@plumeria/core";

fn is_identifier_start(c: u8) -> bool {
    c.is_ascii_alphabetic() || c == b'_' || c == b'$'
}

fn is_name_char(c: u8) -> bool {
    is_identifier_start(c) || c.is_ascii_digit() || c == b'.' || c == b'-'
}

fn is_space(c: u8) -> bool {
    c == b' ' || (9..=13).contains(&c)
}

const EXPRESSION_BEFORE: &[u8] = b"(,=:[!&|?{};+-*%<>~^";

const EXPRESSION_WORDS: &[&str] = &[
    "return", "yield", "default", "else", "case", "await", "do", "typeof", "void", "in", "of",
    "new", "delete", "throw",
];

fn find(source: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    if from > source.len() {
        return None;
    }
    source[from..]
        .windows(needle.len())
        .position(|window| window == needle)
        .map(|index| index + from)
}

fn at(source: &[u8], index: usize) -> u8 {
    source.get(index).copied().unwrap_or(0)
}

fn skip_trivia(source: &[u8], start: usize) -> usize {
    let mut i = start;
    while i < source.len() {
        let c = source[i];
        if is_space(c) {
            i += 1;
        } else if c == b'/' && at(source, i + 1) == b'*' {
            match find(source, b"*/", i + 2) {
                Some(end) => i = end + 2,
                None => return source.len(),
            }
        } else if c == b'/' && at(source, i + 1) == b'/' {
            match find(source, b"\n", i + 2) {
                Some(end) => i = end + 1,
                None => return source.len(),
            }
        } else {
            break;
        }
    }
    i
}

fn attribute_at(source: &[u8], index: usize, name: &[u8]) -> bool {
    if index > 0 && is_name_char(source[index - 1]) {
        return false;
    }
    let mut i = skip_trivia(source, index + name.len());
    if at(source, i) != b'=' {
        return false;
    }
    i = skip_trivia(source, i + 1);
    at(source, i) == b'{'
}

fn has_attribute_candidate(source: &[u8], name: &[u8]) -> bool {
    let mut from = 0;
    while let Some(index) = find(source, name, from) {
        if attribute_at(source, index, name) {
            return true;
        }
        from = index + 1;
    }
    false
}

fn word_before(source: &[u8], end: usize) -> &[u8] {
    let mut start = end;
    while start > 0 && is_name_char(source[start - 1]) {
        start -= 1;
    }
    &source[start..end]
}

fn closing_quote(source: &[u8], start: usize, quote: u8, multiline: bool) -> Option<usize> {
    let mut i = start + 1;
    while i < source.len() {
        let c = source[i];
        if c == b'\\' {
            i += 2;
            continue;
        }
        if c == quote {
            return Some(i);
        }
        if c == b'\n' && !multiline {
            return None;
        }
        i += 1;
    }
    None
}

#[derive(Clone, Copy, PartialEq)]
enum Mode {
    Code,
    Tag,
    Children,
}

#[derive(Clone, Copy, PartialEq)]
enum Frame {
    Element,
    Attribute,
    Child,
    Template,
    Brace,
}

fn writes_attribute(source: &[u8], name: &[u8]) -> bool {
    let first = name[0];
    let mut stack: Vec<Frame> = Vec::new();
    let mut mode = Mode::Code;
    let mut previous: u8 = 0;
    let mut previous_end: usize = 0;

    let template_end = |stack: &mut Vec<Frame>, from: usize| -> Option<usize> {
        let mut i = from;
        while i < source.len() {
            let c = source[i];
            if c == b'\\' {
                i += 2;
                continue;
            }
            if c == b'`' {
                return Some(i);
            }
            if c == b'$' && at(source, i + 1) == b'{' {
                stack.push(Frame::Template);
                return Some(i + 1);
            }
            i += 1;
        }
        None
    };

    let mut i = 0;
    while i < source.len() {
        let c = source[i];
        if c == first && source[i..].starts_with(name) && attribute_at(source, i, name) {
            return true;
        }

        if mode == Mode::Tag {
            if c == b'/' && at(source, i + 1) == b'*' {
                match find(source, b"*/", i + 2) {
                    Some(end) => i = end + 1,
                    None => return true,
                }
            } else if c == b'/' && at(source, i + 1) == b'/' {
                match find(source, b"\n", i + 2) {
                    Some(end) => i = end,
                    None => return true,
                }
            } else if c == b'/' && at(source, i + 1) == b'>' {
                i += 1;
                mode = if stack.last() == Some(&Frame::Element) {
                    Mode::Children
                } else {
                    Mode::Code
                };
                previous = b')';
            } else if c == b'>' {
                stack.push(Frame::Element);
                mode = Mode::Children;
            } else if c == b'{' {
                stack.push(Frame::Attribute);
                mode = Mode::Code;
                previous = b'{';
            } else if c == b'"' || c == b'\'' {
                match closing_quote(source, i, c, true) {
                    Some(end) => i = end,
                    None => return true,
                }
            }
            i += 1;
            continue;
        }

        if mode == Mode::Children {
            if c == b'{' {
                stack.push(Frame::Child);
                mode = Mode::Code;
                previous = b'{';
            } else if c == b'<' {
                if at(source, i + 1) == b'/' {
                    match find(source, b">", i) {
                        Some(end) => i = end,
                        None => return true,
                    }
                    stack.pop();
                    mode = if stack.last() == Some(&Frame::Element) {
                        Mode::Children
                    } else {
                        Mode::Code
                    };
                    previous = b')';
                } else {
                    mode = Mode::Tag;
                }
            }
            i += 1;
            continue;
        }

        if is_space(c) {
            i += 1;
            continue;
        }

        if c == b'/' && at(source, i + 1) == b'/' {
            match find(source, b"\n", i) {
                Some(end) => i = end,
                None => return false,
            }
            i += 1;
            continue;
        }
        if c == b'/' && at(source, i + 1) == b'*' {
            match find(source, b"*/", i + 2) {
                Some(end) => i = end + 1,
                None => return true,
            }
            i += 1;
            continue;
        }
        if c == b'\'' || c == b'"' {
            match closing_quote(source, i, c, false) {
                Some(end) => i = end,
                None => return true,
            }
            previous = c;
            i += 1;
            continue;
        }
        if c == b'`' {
            match template_end(&mut stack, i + 1) {
                Some(end) => i = end,
                None => return true,
            }
            previous = b'`';
            i += 1;
            continue;
        }
        if c == b'{' {
            stack.push(Frame::Brace);
            previous = c;
            i += 1;
            continue;
        }
        if c == b'}' {
            let kind = stack.pop();
            match kind {
                Some(Frame::Template) => {
                    match template_end(&mut stack, i + 1) {
                        Some(end) => i = end,
                        None => return true,
                    }
                    previous = b'`';
                    i += 1;
                    continue;
                }
                Some(Frame::Attribute) => {
                    mode = Mode::Tag;
                    i += 1;
                    continue;
                }
                Some(Frame::Child) => {
                    mode = Mode::Children;
                    i += 1;
                    continue;
                }
                Some(Frame::Brace) => {
                    previous = c;
                    i += 1;
                    continue;
                }
                _ => return true,
            }
        }

        let after_update = (previous == b'+' || previous == b'-')
            && previous_end >= 2
            && at(source, previous_end - 2) == previous;
        let expression_start = previous == 0
            || (EXPRESSION_BEFORE.contains(&previous) && !after_update)
            || (is_name_char(previous)
                && std::str::from_utf8(word_before(source, previous_end))
                    .is_ok_and(|word| EXPRESSION_WORDS.contains(&word)));

        if c == b'/' && expression_start {
            let mut end = i + 1;
            let mut in_class = false;
            while end < source.len() {
                let d = source[end];
                if d == b'\\' {
                    end += 2;
                    continue;
                }
                if d == b'\n' {
                    break;
                }
                if d == b'[' {
                    in_class = true;
                } else if d == b']' {
                    in_class = false;
                } else if d == b'/' && !in_class {
                    break;
                }
                end += 1;
            }
            if at(source, end) == b'/' {
                i = end + 1;
                previous = b')';
                continue;
            }
        }

        if c == b'<' && expression_start {
            let next = at(source, i + 1);
            if is_identifier_start(next) || next == b'>' {
                mode = Mode::Tag;
                i += 1;
                continue;
            }
        }

        previous = c;
        previous_end = i + 1;
        i += 1;
    }
    false
}

pub fn uses_style_prop(source: &str, style_prop: &str, file_path: &str) -> bool {
    if file_path.ends_with(".ts") || file_path.ends_with(".mts") {
        return false;
    }
    if style_prop.is_empty() || !has_attribute_candidate(source.as_bytes(), style_prop.as_bytes()) {
        return false;
    }
    writes_attribute(source.as_bytes(), style_prop.as_bytes())
}

pub fn needs_compile(source: &str, style_prop: &str, file_path: &str) -> bool {
    source.contains(CORE) || uses_style_prop(source, style_prop, file_path)
}
