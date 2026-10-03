pub type Specificity = [i64; 3];

const LEGACY_PSEUDO_ELEMENTS: &[&str] = &["before", "after", "first-line", "first-letter"];
const MAX_OF_ARGUMENTS: &[&str] = &["is", "not", "has"];
const NTH_WITH_OF: &[&str] = &["nth-child", "nth-last-child"];
const ARGUMENT_ADDS_TO_HOST: &[&str] = &["host", "host-context"];
const ARGUMENT_ADDS_TO_ELEMENT: &[&str] = &["slotted", "cue", "cue-region"];
const UTF8_LEN: [usize; 16] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4];

#[derive(Clone, Copy, PartialEq)]
enum Kind {
    Sum,
    Highest,
    BeforeOf,
    Ignored,
}

struct Frame {
    kind: Kind,
    sum: Specificity,
    best: Specificity,
}

fn frame(kind: Kind) -> Frame {
    Frame {
        kind,
        sum: [0; 3],
        best: [0; 3],
    }
}

fn add(total: &mut Specificity, value: Specificity) {
    total[0] += value[0];
    total[1] += value[1];
    total[2] += value[2];
}

fn higher(a: Specificity, b: Specificity) -> Specificity {
    if (b[0], b[1], b[2]) > (a[0], a[1], a[2]) {
        b
    } else {
        a
    }
}

fn is_one_of(name: &[u8], list: &[&str]) -> bool {
    list.iter()
        .any(|item| name.eq_ignore_ascii_case(item.as_bytes()))
}

fn is_name_byte(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_' || c == b'-'
}

fn lower_name(bytes: &[u8], start: usize, end: usize) -> String {
    String::from_utf8_lossy(&bytes[start..end.max(start)]).to_lowercase()
}

fn escape_end(bytes: &[u8], start: usize) -> usize {
    let mut end = start + 1;
    while end < bytes.len() && end - start <= 6 && bytes[end].is_ascii_hexdigit() {
        end += 1;
    }
    if end == start + 1 {
        let width = bytes.get(end).map_or(1, |c| UTF8_LEN[(c >> 4) as usize]);
        return (end + width).min(bytes.len());
    }
    if end < bytes.len() && bytes[end].is_ascii_whitespace() {
        end += 1;
    }
    end
}

fn skip_name(bytes: &[u8], from: usize) -> usize {
    let mut index = from;
    while index < bytes.len() {
        if bytes[index] == b'\\' {
            index = escape_end(bytes, index);
            continue;
        }
        if !is_name_byte(bytes[index]) {
            break;
        }
        index += 1;
    }
    index
}

fn skip_string(bytes: &[u8], quote: u8, from: usize) -> usize {
    let mut index = from;
    while index < bytes.len() && bytes[index] != quote {
        if bytes[index] == b'\\' {
            index += 1;
        }
        index += 1;
    }
    (index + 1).min(bytes.len())
}

fn find_close(bytes: &[u8], open: usize) -> usize {
    let mut depth = 0i64;
    let mut index = open;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'\\' {
            index += 2;
            continue;
        }
        if c == b'"' || c == b'\'' {
            index = skip_string(bytes, c, index + 1);
            continue;
        }
        if c == b'(' {
            depth += 1;
        } else if c == b')' {
            depth -= 1;
            if depth == 0 {
                return index;
            }
        }
        index += 1;
    }
    bytes.len()
}

fn skip_bracket(bytes: &[u8], open: usize) -> usize {
    let mut index = open + 1;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'\\' {
            index += 2;
            continue;
        }
        if c == b'"' || c == b'\'' {
            index = skip_string(bytes, c, index + 1);
            continue;
        }
        if c == b']' {
            return index + 1;
        }
        index += 1;
    }
    bytes.len()
}

fn of_at(selector: &str, index: usize) -> bool {
    selector[..index]
        .chars()
        .next_back()
        .is_some_and(char::is_whitespace)
        && selector.as_bytes()[index..]
            .get(..2)
            .is_some_and(|word| word.eq_ignore_ascii_case(b"of"))
        && selector[index + 2..]
            .chars()
            .next()
            .is_some_and(char::is_whitespace)
}

fn pseudo(name: &[u8], double_colon: bool) -> (Specificity, Kind) {
    if double_colon || is_one_of(name, LEGACY_PSEUDO_ELEMENTS) {
        let kind = if is_one_of(name, ARGUMENT_ADDS_TO_ELEMENT) {
            Kind::Highest
        } else {
            Kind::Ignored
        };
        ([0, 0, 1], kind)
    } else if name.eq_ignore_ascii_case(b"where") {
        ([0, 0, 0], Kind::Ignored)
    } else if is_one_of(name, MAX_OF_ARGUMENTS) {
        ([0, 0, 0], Kind::Highest)
    } else if is_one_of(name, ARGUMENT_ADDS_TO_HOST) {
        ([0, 1, 0], Kind::Highest)
    } else if is_one_of(name, NTH_WITH_OF) {
        ([0, 1, 0], Kind::BeforeOf)
    } else {
        ([0, 1, 0], Kind::Ignored)
    }
}

fn close(stack: &mut Vec<Frame>) {
    let top = stack.pop().expect("a frame to close");
    let value = match top.kind {
        Kind::Sum => top.sum,
        Kind::Highest => higher(top.best, top.sum),
        Kind::BeforeOf | Kind::Ignored => return,
    };
    add(&mut stack.last_mut().expect("the root stays").sum, value);
}

pub fn get_specificity(selector: &str) -> Specificity {
    let bytes = selector.as_bytes();
    let mut stack = Vec::with_capacity(4);
    stack.push(frame(Kind::Sum));
    let mut index = 0;
    while index < bytes.len() {
        let c = bytes[index];
        let top = stack.len() - 1;
        let kind = stack[top].kind;
        let counting = kind == Kind::Sum || kind == Kind::Highest;
        match c {
            b'"' | b'\'' => index = skip_string(bytes, c, index + 1),
            b'\\' if !counting => index += 2,
            b')' => {
                if stack.len() > 1 {
                    close(&mut stack);
                }
                index += 1;
            }
            b'(' => {
                stack.push(frame(if counting { Kind::Sum } else { Kind::Ignored }));
                index += 1;
            }
            b'o' | b'O' if kind == Kind::BeforeOf && of_at(selector, index) => {
                stack[top].kind = Kind::Highest;
                index += 2;
            }
            _ if !counting => index += 1,
            b',' if kind == Kind::Highest => {
                let f = &mut stack[top];
                f.best = higher(f.best, f.sum);
                f.sum = [0; 3];
                index += 1;
            }
            b'#' | b'.' => {
                stack[top].sum[if c == b'#' { 0 } else { 1 }] += 1;
                index = skip_name(bytes, index + 1);
            }
            b'[' => {
                stack[top].sum[1] += 1;
                index = skip_bracket(bytes, index);
            }
            b':' => {
                let double_colon = bytes.get(index + 1) == Some(&b':');
                let start = index + if double_colon { 2 } else { 1 };
                let end = skip_name(bytes, start);
                let (own, argument) = pseudo(&bytes[start..end.max(start)], double_colon);
                add(&mut stack[top].sum, own);
                if bytes.get(end) == Some(&b'(') {
                    stack.push(frame(argument));
                    index = end + 1;
                } else {
                    index = end;
                }
            }
            _ if is_name_byte(c) || c == b'\\' => {
                stack[top].sum[2] += 1;
                index = skip_name(bytes, index);
            }
            _ => index += 1,
        }
    }
    while stack.len() > 1 {
        close(&mut stack);
    }
    stack[0].sum
}

pub fn get_pseudo_element(selector: &str) -> String {
    let bytes = selector.as_bytes();
    let mut index = 0;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'[' {
            index = skip_bracket(bytes, index);
            continue;
        }
        if c != b':' {
            index += 1;
            continue;
        }
        let double_colon = bytes.get(index + 1) == Some(&b':');
        let name_start = index + if double_colon { 2 } else { 1 };
        let name_end = skip_name(bytes, name_start);
        let name = lower_name(bytes, name_start, name_end);
        index = name_end;

        let mut argument = String::new();
        if bytes.get(index) == Some(&b'(') {
            let close = find_close(bytes, index);
            argument =
                String::from_utf8_lossy(&bytes[index..(close + 1).min(bytes.len())]).into_owned();
            index = close + 1;
        }
        if double_colon || LEGACY_PSEUDO_ELEMENTS.contains(&name.as_str()) {
            return format!("::{name}{argument}");
        }
    }
    String::new()
}

pub fn find_same_name_nesting(selector: &str) -> Option<String> {
    let bytes = selector.as_bytes();
    let mut open: Vec<(String, usize)> = Vec::new();
    let mut depth = 0usize;
    let mut index = 0;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'\\' {
            index = escape_end(bytes, index);
            continue;
        }
        if c == b'"' || c == b'\'' {
            index = skip_string(bytes, c, index + 1);
            continue;
        }
        if c == b'[' {
            index = skip_bracket(bytes, index);
            continue;
        }
        if c == b'(' {
            depth += 1;
        } else if c == b')' {
            if open.last().is_some_and(|(_, level)| *level == depth) {
                open.pop();
            }
            depth = depth.saturating_sub(1);
        } else if c == b':' {
            let double_colon = bytes.get(index + 1) == Some(&b':');
            let name_start = index + if double_colon { 2 } else { 1 };
            let name_end = skip_name(bytes, name_start);
            if name_end > name_start && bytes.get(name_end) == Some(&b'(') {
                let prefix = if double_colon { "::" } else { ":" };
                let name = format!("{prefix}{}", lower_name(bytes, name_start, name_end));
                if open.iter().any(|(ancestor, _)| *ancestor == name) {
                    return Some(name);
                }
                depth += 1;
                open.push((name, depth));
                index = name_end + 1;
                continue;
            }
            index = name_end;
            continue;
        }
        index += 1;
    }
    None
}

#[cfg(test)]
mod tests {
    use super::{find_same_name_nesting, get_specificity};

    #[test]
    fn of_keyword_ignores_ascii_case() {
        assert_eq!(get_specificity(":nth-child(2 OF .item)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-last-child(odd Of #a, .b)"), [1, 1, 0]);
    }

    #[test]
    fn hex_escapes_end_at_their_whitespace() {
        assert_eq!(get_specificity(".\\31 0"), [0, 1, 0]);
        assert_eq!(get_specificity("#\\31 x"), [1, 0, 0]);
        assert_eq!(get_specificity("a.\\31 0:hover"), [0, 2, 1]);
    }

    #[test]
    fn same_name_pseudo_nesting_is_found_through_ancestors() {
        assert_eq!(find_same_name_nesting(":is(:where(:not(:has(.a))))"), None);
        assert_eq!(find_same_name_nesting(":is(.a):is(.b)"), None);
        assert_eq!(find_same_name_nesting("[data-x=\":is(:is(a))\"]"), None);
        assert_eq!(
            find_same_name_nesting(":where(:where(.a), .b)"),
            Some(":where".to_string())
        );
        assert_eq!(
            find_same_name_nesting(":is(:where(:is(.a)))"),
            Some(":is".to_string())
        );
        assert_eq!(
            find_same_name_nesting(":not(.x, :not(.a))"),
            Some(":not".to_string())
        );
        assert_eq!(
            find_same_name_nesting("::slotted(::slotted(span))"),
            Some("::slotted".to_string())
        );
        assert_eq!(
            find_same_name_nesting(":nth-child(2 of :is(.a)):is(.b)"),
            None
        );
    }
}
