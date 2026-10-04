use std::borrow::Cow;

pub type Specificity = [i64; 3];

const LEGACY_PSEUDO_ELEMENTS: &[&str] = &["before", "after", "first-line", "first-letter"];
const UTF8_LEN: [usize; 16] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4];

#[derive(Clone, Copy, PartialEq)]
enum Kind {
    Sum,
    Highest,
    BeforeOf,
    Ignored,
}

#[derive(Clone, Copy)]
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

fn skip_comment(bytes: &[u8], from: usize) -> usize {
    bytes[from + 2..]
        .windows(2)
        .position(|pair| pair == b"*/")
        .map_or(bytes.len(), |end| from + end + 4)
}

const IDENT_BYTE: u8 = 1;
const IDENT_START: u8 = 2;
static IDENT_CLASS: [u8; 256] = {
    let mut table = [0u8; 256];
    let mut c = 0;
    while c < 256 {
        let b = c as u8;
        if b.is_ascii_alphabetic() || b == b'_' || b >= 0x80 {
            table[c] = IDENT_BYTE | IDENT_START;
        } else if b.is_ascii_digit() || b == b'-' {
            table[c] = IDENT_BYTE;
        }
        c += 1;
    }
    table
};

fn is_ident_byte(c: u8) -> bool {
    IDENT_CLASS[c as usize] & IDENT_BYTE != 0
}

fn is_ident_start(c: u8) -> bool {
    IDENT_CLASS[c as usize] & IDENT_START != 0
}

fn valid_escape(bytes: &[u8], index: usize) -> bool {
    bytes.get(index) == Some(&b'\\') && !matches!(bytes.get(index + 1), Some(b'\n' | b'\r' | 0x0c))
}

fn starts_ident(bytes: &[u8], index: usize) -> bool {
    match bytes.get(index) {
        Some(b'-') => {
            bytes
                .get(index + 1)
                .is_some_and(|&c| is_ident_start(c) || c == b'-')
                || valid_escape(bytes, index + 1)
        }
        Some(b'\\') => valid_escape(bytes, index),
        Some(&c) => is_ident_start(c),
        None => false,
    }
}

fn skip_ident(bytes: &[u8], from: usize) -> (usize, bool) {
    let mut index = from;
    let mut escaped = false;
    loop {
        while bytes.get(index).is_some_and(|&c| is_ident_byte(c)) {
            index += 1;
        }
        if !valid_escape(bytes, index) {
            return (index, escaped);
        }
        index = escape_end(bytes, index);
        escaped = true;
    }
}

fn pseudo_at(
    bytes: &[u8],
    start: usize,
    end: usize,
    escaped: bool,
    double_colon: bool,
    buf: &mut [u8; 24],
) -> (Specificity, Kind) {
    let name = if escaped {
        keyword(bytes, start, end, buf)
    } else {
        &bytes[start..end]
    };
    let is = |word: &[u8]| name.eq_ignore_ascii_case(word);
    let first = name.first().map_or(0, |c| c | 0x20);
    if double_colon {
        let argument = matches!((name.len(), first), (7, b's') | (3, b'c') | (10, b'c'))
            && (is(b"slotted") || is(b"cue") || is(b"cue-region"));
        return (
            [0, 0, 1],
            if argument {
                Kind::Highest
            } else {
                Kind::Ignored
            },
        );
    }
    match (name.len(), first) {
        (6, b'b') if is(b"before") => ([0, 0, 1], Kind::Ignored),
        (5, b'a') if is(b"after") => ([0, 0, 1], Kind::Ignored),
        (10, b'f') if is(b"first-line") => ([0, 0, 1], Kind::Ignored),
        (12, b'f') if is(b"first-letter") => ([0, 0, 1], Kind::Ignored),
        (5, b'w') if is(b"where") => ([0, 0, 0], Kind::Ignored),
        (2, b'i') if is(b"is") => ([0, 0, 0], Kind::Highest),
        (3, b'n') if is(b"not") => ([0, 0, 0], Kind::Highest),
        (3, b'h') if is(b"has") => ([0, 0, 0], Kind::Highest),
        (4, b'h') if is(b"host") => ([0, 1, 0], Kind::Highest),
        (12, b'h') if is(b"host-context") => ([0, 1, 0], Kind::Highest),
        (9, b'n') if is(b"nth-child") => ([0, 1, 0], Kind::BeforeOf),
        (14, b'n') if is(b"nth-last-child") => ([0, 1, 0], Kind::BeforeOf),
        _ => ([0, 1, 0], Kind::Ignored),
    }
}

fn escape_value(bytes: &[u8], start: usize, end: usize) -> u32 {
    let (digits, value) = bytes[start + 1..end]
        .iter()
        .take_while(|c| c.is_ascii_hexdigit())
        .fold((0, 0u32), |(digits, value), &c| {
            (
                digits + 1,
                value * 16 + (c as char).to_digit(16).unwrap_or(0),
            )
        });
    if digits == 0 {
        return std::str::from_utf8(&bytes[start + 1..end])
            .ok()
            .and_then(|rest| rest.chars().next())
            .map_or(0xFFFD, u32::from);
    }
    if value == 0 || char::from_u32(value).is_none() {
        0xFFFD
    } else {
        value
    }
}

fn keyword<'a>(bytes: &[u8], start: usize, end: usize, buf: &'a mut [u8; 24]) -> &'a [u8] {
    let mut len = 0;
    let mut index = start;
    while index < end {
        let code = if bytes[index] == b'\\' {
            let next = escape_end(bytes, index);
            let code = escape_value(bytes, index, next);
            index = next;
            code
        } else {
            index += 1;
            u32::from(bytes[index - 1])
        };
        if code >= 0x80 || len == buf.len() {
            return &[];
        }
        buf[len] = (code as u8).to_ascii_lowercase();
        len += 1;
    }
    &buf[..len]
}

fn find_close(bytes: &[u8], open: usize) -> usize {
    let mut depth = 0i64;
    let mut index = open;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'/' && bytes.get(index + 1) == Some(&b'*') {
            index = skip_comment(bytes, index);
            continue;
        }
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
        if c == b'/' && bytes.get(index + 1) == Some(&b'*') {
            index = skip_comment(bytes, index);
            continue;
        }
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

fn close(stack: &mut [Frame], depth: usize) {
    let top = stack[depth];
    let value = match top.kind {
        Kind::Sum => top.sum,
        Kind::Highest => higher(top.best, top.sum),
        Kind::BeforeOf | Kind::Ignored => return,
    };
    add(&mut stack[depth - 1].sum, value);
}

fn push(stack: &mut [Frame], depth: usize, kind: Kind) -> usize {
    let next = (depth + 1).min(stack.len() - 1);
    stack[next] = frame(kind);
    next
}

pub fn get_specificity(selector: &str) -> Specificity {
    let bytes = selector.as_bytes();
    let mut stack = [frame(Kind::Sum); MAX_SELECTOR_NESTING + 1];
    let mut depth = 0;
    let mut buf = [0u8; 24];
    let mut index = 0;
    while index < bytes.len() {
        let c = bytes[index];
        let kind = stack[depth].kind;
        let counting = kind == Kind::Sum || kind == Kind::Highest;
        let ident = match c {
            b'\\' | b'-' => starts_ident(bytes, index),
            _ if kind == Kind::BeforeOf => is_ident_byte(c),
            _ => is_ident_start(c),
        };
        if ident {
            let (end, escaped) = skip_ident(bytes, index);
            if bytes.get(end) == Some(&b'(') {
                depth = push(
                    &mut stack,
                    depth,
                    if counting { Kind::Sum } else { Kind::Ignored },
                );
                index = end + 1;
                continue;
            }
            if kind == Kind::BeforeOf {
                let name = if escaped {
                    keyword(bytes, index, end, &mut buf)
                } else {
                    &bytes[index..end]
                };
                if name.eq_ignore_ascii_case(b"of") {
                    stack[depth].kind = Kind::Highest;
                }
            } else if counting {
                stack[depth].sum[2] += 1;
            }
            index = end;
            continue;
        }
        match c {
            b'/' if bytes.get(index + 1) == Some(&b'*') => {
                index = skip_comment(bytes, index);
            }
            b'"' | b'\'' => index = skip_string(bytes, c, index + 1),
            b'(' => {
                depth = push(
                    &mut stack,
                    depth,
                    if counting { Kind::Sum } else { Kind::Ignored },
                );
                index += 1;
            }
            b')' => {
                if depth > 0 {
                    close(&mut stack, depth);
                    depth -= 1;
                }
                index += 1;
            }
            b'[' => {
                if counting {
                    stack[depth].sum[1] += 1;
                }
                index = skip_bracket(bytes, index);
            }
            b'#' | b'.'
                if starts_ident(bytes, index + 1)
                    || (c == b'#'
                        && (bytes.get(index + 1).is_some_and(|&n| is_ident_byte(n))
                            || valid_escape(bytes, index + 1))) =>
            {
                if counting {
                    stack[depth].sum[if c == b'#' { 0 } else { 1 }] += 1;
                }
                index = skip_ident(bytes, index + 1).0;
            }
            b',' => {
                if kind == Kind::Highest {
                    let f = &mut stack[depth];
                    f.best = higher(f.best, f.sum);
                    f.sum = [0; 3];
                }
                index += 1;
            }
            b':' => {
                let double_colon = bytes.get(index + 1) == Some(&b':');
                let start = index + 1 + usize::from(double_colon);
                if !starts_ident(bytes, start) {
                    index = start;
                    continue;
                }
                let (end, escaped) = skip_ident(bytes, start);
                let function = bytes.get(end) == Some(&b'(');
                if counting {
                    let (own, argument) =
                        pseudo_at(bytes, start, end, escaped, double_colon, &mut buf);
                    add(&mut stack[depth].sum, own);
                    if function {
                        depth = push(&mut stack, depth, argument);
                    }
                } else if function {
                    depth = push(&mut stack, depth, Kind::Ignored);
                }
                index = end + usize::from(function);
            }
            _ => index += 1,
        }
    }
    while depth > 0 {
        close(&mut stack, depth);
        depth -= 1;
    }
    stack[0].sum
}

pub fn get_pseudo_element(selector: &str) -> String {
    let bytes = selector.as_bytes();
    let mut index = 0;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'/' && bytes.get(index + 1) == Some(&b'*') {
            index = skip_comment(bytes, index);
            continue;
        }
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

pub fn strip_selector_comments(selector: &str) -> Cow<'_, str> {
    if !selector.contains("/*") {
        return Cow::Borrowed(selector);
    }
    let bytes = selector.as_bytes();
    let mut result = String::with_capacity(selector.len());
    let mut start = 0;
    let mut index = 0;
    while index < bytes.len() {
        match bytes[index] {
            b'\\' => index += 2,
            quote @ (b'"' | b'\'') => index = skip_string(bytes, quote, index + 1),
            b'/' if bytes.get(index + 1) == Some(&b'*') => {
                result.push_str(&selector[start..index]);
                result.push_str("/**/");
                index = skip_comment(bytes, index);
                start = index;
            }
            _ => index += 1,
        }
    }
    result.push_str(&selector[start..]);
    Cow::Owned(result)
}

pub const MAX_SELECTOR_NESTING: usize = 16;

#[derive(Debug, PartialEq)]
pub enum InvalidSelector {
    SameName(String),
    TooDeep,
    StrayQuote,
}

pub fn find_invalid_selector(selector: &str) -> Option<InvalidSelector> {
    let bytes = selector.as_bytes();
    let mut open: Vec<(String, usize)> = Vec::new();
    let mut depth = 0usize;
    let mut index = 0;
    while index < bytes.len() {
        let c = bytes[index];
        if c == b'/' && bytes.get(index + 1) == Some(&b'*') {
            index = skip_comment(bytes, index);
            continue;
        }
        if c == b'\\' {
            index = escape_end(bytes, index);
            continue;
        }
        if c == b'"' || c == b'\'' {
            let mut end = index + 1;
            while end < bytes.len() && bytes[end] != c {
                end += if bytes[end] == b'\\' { 2 } else { 1 };
            }
            if depth == 0 || end >= bytes.len() {
                return Some(InvalidSelector::StrayQuote);
            }
            index = end + 1;
            continue;
        }
        if c == b'[' {
            index = skip_bracket(bytes, index);
            continue;
        }
        if c == b'(' {
            depth += 1;
            if depth > MAX_SELECTOR_NESTING {
                return Some(InvalidSelector::TooDeep);
            }
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
                if name != ":not" && open.iter().any(|(ancestor, _)| *ancestor == name) {
                    return Some(InvalidSelector::SameName(name));
                }
                depth += 1;
                if depth > MAX_SELECTOR_NESTING {
                    return Some(InvalidSelector::TooDeep);
                }
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
    use super::{
        InvalidSelector, MAX_SELECTOR_NESTING, find_invalid_selector, get_pseudo_element,
        get_specificity, strip_selector_comments,
    };

    #[test]
    fn of_keyword_ignores_ascii_case() {
        assert_eq!(get_specificity(":nth-child(2 OF .item)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-last-child(odd Of #a, .b)"), [1, 1, 0]);
    }

    #[test]
    fn of_keyword_is_read_as_an_identifier() {
        assert_eq!(get_specificity(":nth-child(2 of.a)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-child(2 OF#a)"), [1, 1, 0]);
        assert_eq!(get_specificity(":nth-child(2 of:hover)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-child(2 o\\66 .a)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-child(2 \\6f f.a)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-child(2 ofx .a)"), [0, 1, 0]);
        assert_eq!(get_specificity(":nth-child(2n+1of .a)"), [0, 1, 0]);
    }

    #[test]
    fn escaped_pseudo_names_are_decoded() {
        assert_eq!(get_specificity(":nth-chil\\64 (2 of #a)"), [1, 1, 0]);
        assert_eq!(get_specificity(":\\69s(.a, #b)"), [1, 0, 0]);
        assert_eq!(get_specificity(":wh\\65re(#a).b"), [0, 1, 0]);
        assert_eq!(get_specificity(".\\"), [0, 1, 0]);
    }

    #[test]
    fn hex_escapes_end_at_their_whitespace() {
        assert_eq!(get_specificity(".\\31 0"), [0, 1, 0]);
        assert_eq!(get_specificity("#\\31 x"), [1, 0, 0]);
        assert_eq!(get_specificity("a.\\31 0:hover"), [0, 2, 1]);
    }

    #[test]
    fn same_name_pseudo_nesting_is_found_through_ancestors() {
        assert_eq!(find_invalid_selector(":is(:where(:not(:has(.a))))"), None);
        assert_eq!(find_invalid_selector(":is(.a):is(.b)"), None);
        assert_eq!(find_invalid_selector("[data-x=\":is(:is(a))\"]"), None);
        assert_eq!(
            find_invalid_selector(":where(:where(.a), .b)"),
            Some(InvalidSelector::SameName(":where".to_string()))
        );
        assert_eq!(
            find_invalid_selector(":is(:where(:is(.a)))"),
            Some(InvalidSelector::SameName(":is".to_string()))
        );
        assert_eq!(
            find_invalid_selector(":not(:not(:is(:is(.a))))"),
            Some(InvalidSelector::SameName(":is".to_string()))
        );
        assert_eq!(
            find_invalid_selector("::slotted(::slotted(span))"),
            Some(InvalidSelector::SameName("::slotted".to_string()))
        );
        assert_eq!(
            find_invalid_selector(":nth-child(2 of :is(.a)):is(.b)"),
            None
        );
    }

    #[test]
    fn nesting_deeper_than_the_limit_is_rejected() {
        let nest =
            |open: &str, levels: usize| format!("{}.a{}", open.repeat(levels), ")".repeat(levels));
        assert_eq!(find_invalid_selector(":not(.x, :not(.a))"), None);
        assert_eq!(
            find_invalid_selector(&nest(":not(", MAX_SELECTOR_NESTING)),
            None
        );
        assert_eq!(
            find_invalid_selector(&nest("(", MAX_SELECTOR_NESTING)),
            None
        );
        assert_eq!(
            find_invalid_selector(&format!(
                "[data-x=\"{}\"]",
                "(".repeat(MAX_SELECTOR_NESTING + 1)
            )),
            None
        );
        assert_eq!(
            find_invalid_selector(&nest(":not(", MAX_SELECTOR_NESTING + 1)),
            Some(InvalidSelector::TooDeep)
        );
        assert_eq!(
            find_invalid_selector(&nest("(", MAX_SELECTOR_NESTING + 1)),
            Some(InvalidSelector::TooDeep)
        );
        let names: String = (0..=MAX_SELECTOR_NESTING)
            .map(|i| format!(":x{i}("))
            .collect();
        assert_eq!(
            find_invalid_selector(&names),
            Some(InvalidSelector::TooDeep)
        );
    }

    #[test]
    fn comments_are_stripped_outside_strings() {
        assert_eq!(strip_selector_comments(":hover"), ":hover");
        assert_eq!(
            strip_selector_comments(":is(.a/* #b */, .c)"),
            ":is(.a/**/, .c)"
        );
        assert_eq!(strip_selector_comments(".a/**/.b"), ".a/**/.b");
        assert_eq!(
            strip_selector_comments("[data-x=\"/* kept */\"]/* gone */"),
            "[data-x=\"/* kept */\"]/**/"
        );
        assert_eq!(
            strip_selector_comments(".a\\/* not a comment"),
            ".a\\/* not a comment"
        );
        assert_eq!(
            strip_selector_comments(":hover/* unterminated"),
            ":hover/**/"
        );
        assert_eq!(strip_selector_comments(".\\é/*x*/:hover"), ".\\é/**/:hover");

        let levels = MAX_SELECTOR_NESTING + 1;
        let hidden = format!("{}.a{}", ":not(/*)*/".repeat(levels), ")".repeat(levels));
        let inert = format!(":not(/*{}*/.a)", "(".repeat(levels));
        assert_eq!(
            find_invalid_selector(&strip_selector_comments(&hidden)),
            Some(InvalidSelector::TooDeep)
        );
        assert_eq!(
            find_invalid_selector(&strip_selector_comments(&inert)),
            None
        );
        assert_eq!(
            get_specificity(&strip_selector_comments(":hover/* #a .b */")),
            [0, 1, 0]
        );
        assert_eq!(
            get_pseudo_element(&strip_selector_comments(".a/*::before*/")),
            ""
        );
    }

    #[test]
    fn comments_preserve_boundaries_and_are_ignored_by_readers() {
        for selector in ["[data-x=foo/**/i]", ":nth-child(2n/**/of .a)", ".a/**/.b"] {
            assert_eq!(strip_selector_comments(selector), selector);
        }
        assert_eq!(get_specificity(":hover/* #a .b */"), [0, 1, 0]);
        assert_eq!(get_specificity(":nth-child(2n/**/of .a)"), [0, 2, 0]);
        assert_eq!(get_specificity(":nth-child(2n of/**/.a)"), [0, 2, 0]);
        assert_eq!(get_specificity(":is([x/* ] */], #a)"), [1, 0, 0]);
        assert_eq!(get_pseudo_element(":is(.a/* ) */)::before"), "::before");
        assert_eq!(get_pseudo_element(".a/*::before*/"), "");
        let hidden = format!(
            "{}.a{}",
            ":not(/*)*/".repeat(MAX_SELECTOR_NESTING + 1),
            ")".repeat(MAX_SELECTOR_NESTING + 1)
        );
        assert_eq!(
            find_invalid_selector(&hidden),
            Some(InvalidSelector::TooDeep)
        );
        assert_eq!(find_invalid_selector(":is(/* :is( */.a)"), None);
    }

    #[test]
    fn stray_and_unclosed_quotes_are_rejected() {
        for selector in [
            ":lang(\"en\")",
            ":is([data-x=\"a\"], .b)",
            "[data-x='y']:hover",
            ":lang(\"a\\\"b\")",
        ] {
            assert_eq!(find_invalid_selector(selector), None, "{selector}");
        }
        for selector in [
            ":hover\":is(:is(:is(:is(.x",
            ":hover':is(.x)",
            "[data-a]\"x\"",
            ":lang(\"en)",
            ":lang(\"en\\\")",
        ] {
            assert_eq!(
                find_invalid_selector(selector),
                Some(InvalidSelector::StrayQuote),
                "{selector}"
            );
        }
    }
}
