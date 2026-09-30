pub type Specificity = [i64; 3];

const LEGACY_PSEUDO_ELEMENTS: &[&str] = &["before", "after", "first-line", "first-letter"];
const MAX_OF_ARGUMENTS: &[&str] = &["is", "not", "has"];
const NTH_WITH_OF: &[&str] = &["nth-child", "nth-last-child"];
const ARGUMENT_ADDS_TO_HOST: &[&str] = &["host", "host-context"];
const ARGUMENT_ADDS_TO_ELEMENT: &[&str] = &["slotted", "cue", "cue-region"];

fn is_name_char(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_' || c == '-'
}

fn at(chars: &[char], index: usize) -> Option<char> {
    chars.get(index).copied()
}

fn escape_end(chars: &[char], start: usize) -> usize {
    let mut end = start + 1;
    while end < chars.len() && end - start <= 6 && chars[end].is_ascii_hexdigit() {
        end += 1;
    }
    if end == start + 1 {
        return (start + 2).min(chars.len());
    }
    if end < chars.len() && chars[end].is_ascii_whitespace() {
        end += 1;
    }
    end
}

fn skip_name(chars: &[char], from: usize) -> usize {
    let mut index = from;
    while index < chars.len() {
        if chars[index] == '\\' {
            index = escape_end(chars, index);
            continue;
        }
        if !is_name_char(chars[index]) {
            break;
        }
        index += 1;
    }
    index
}

fn skip_string(chars: &[char], quote: char, from: usize) -> usize {
    let mut index = from;
    while index < chars.len() && chars[index] != quote {
        if chars[index] == '\\' {
            index += 1;
        }
        index += 1;
    }
    (index + 1).min(chars.len())
}

fn find_close(chars: &[char], open: usize) -> usize {
    let mut depth = 0i64;
    let mut index = open;
    while index < chars.len() {
        let c = chars[index];
        if c == '\\' {
            index += 2;
            continue;
        }
        if c == '"' || c == '\'' {
            index = skip_string(chars, c, index + 1);
            continue;
        }
        if c == '(' {
            depth += 1;
        } else if c == ')' {
            depth -= 1;
            if depth == 0 {
                return index;
            }
        }
        index += 1;
    }
    chars.len()
}

fn skip_bracket(chars: &[char], open: usize) -> usize {
    let mut index = open + 1;
    while index < chars.len() {
        let c = chars[index];
        if c == '\\' {
            index += 2;
            continue;
        }
        if c == '"' || c == '\'' {
            index = skip_string(chars, c, index + 1);
            continue;
        }
        if c == ']' {
            return index + 1;
        }
        index += 1;
    }
    chars.len()
}

fn split_top_level(list: &[char]) -> Vec<Vec<char>> {
    let mut parts = Vec::new();
    let mut depth = 0i64;
    let mut start = 0;
    let mut index = 0;
    while index < list.len() {
        let c = list[index];
        if c == '\\' {
            index += 2;
            continue;
        }
        if c == '"' || c == '\'' {
            index = skip_string(list, c, index + 1);
            continue;
        }
        if c == '(' || c == '[' {
            depth += 1;
        } else if c == ')' || c == ']' {
            depth -= 1;
        } else if c == ',' && depth == 0 {
            parts.push(list[start..index].to_vec());
            start = index + 1;
        }
        index += 1;
    }
    parts.push(list[start.min(list.len())..].to_vec());
    parts
}

fn compare(a: &Specificity, b: &Specificity) -> i64 {
    let first = a[0] - b[0];
    if first != 0 {
        return first;
    }
    let second = a[1] - b[1];
    if second != 0 {
        return second;
    }
    a[2] - b[2]
}

fn highest(list: &[char]) -> Specificity {
    split_top_level(list)
        .into_iter()
        .fold([0, 0, 0], |best, part| {
            let current = specificity_of(&part);
            if compare(&current, &best) > 0 {
                current
            } else {
                best
            }
        })
}

fn slice(chars: &[char], start: usize, end: usize) -> Vec<char> {
    let start = start.min(chars.len());
    let end = end.min(chars.len()).max(start);
    chars[start..end].to_vec()
}

fn lower_name(chars: &[char], start: usize, end: usize) -> String {
    slice(chars, start, end)
        .into_iter()
        .collect::<String>()
        .to_lowercase()
}

fn index_of_of_keyword(inner: &[char]) -> Option<(usize, usize)> {
    let mut index = 0;
    while index < inner.len() {
        if inner[index].is_whitespace() {
            let mut end = index;
            while end < inner.len() && inner[end].is_whitespace() {
                end += 1;
            }
            if end + 1 < inner.len() && inner[end] == 'o' && inner[end + 1] == 'f' {
                let after = end + 2;
                let mut tail = after;
                while tail < inner.len() && inner[tail].is_whitespace() {
                    tail += 1;
                }
                if tail > after {
                    return Some((index, tail));
                }
            }
            index = end.max(index + 1);
            continue;
        }
        index += 1;
    }
    None
}

fn specificity_of(chars: &[char]) -> Specificity {
    let mut total: Specificity = [0, 0, 0];
    let mut index = 0;
    let add = |total: &mut Specificity, value: Specificity| {
        total[0] += value[0];
        total[1] += value[1];
        total[2] += value[2];
    };

    while index < chars.len() {
        let c = chars[index];
        if c == '#' {
            index = skip_name(chars, index + 1);
            total[0] += 1;
            continue;
        }
        if c == '.' {
            index = skip_name(chars, index + 1);
            total[1] += 1;
            continue;
        }
        if c == '[' {
            index = skip_bracket(chars, index);
            total[1] += 1;
            continue;
        }
        if c == ':' {
            let double_colon = at(chars, index + 1) == Some(':');
            let name_start = index + if double_colon { 2 } else { 1 };
            let name_end = skip_name(chars, name_start);
            let name = lower_name(chars, name_start, name_end);
            index = name_end;

            let mut inner: Vec<char> = Vec::new();
            if at(chars, index) == Some('(') {
                let close = find_close(chars, index);
                inner = slice(chars, index + 1, close);
                index = close + 1;
            }

            if double_colon || LEGACY_PSEUDO_ELEMENTS.contains(&name.as_str()) {
                total[2] += 1;
                if ARGUMENT_ADDS_TO_ELEMENT.contains(&name.as_str()) {
                    add(&mut total, highest(&inner));
                }
                continue;
            }
            if name == "where" {
                continue;
            }
            if MAX_OF_ARGUMENTS.contains(&name.as_str()) {
                add(&mut total, highest(&inner));
                continue;
            }
            total[1] += 1;
            if ARGUMENT_ADDS_TO_HOST.contains(&name.as_str()) {
                add(&mut total, highest(&inner));
                continue;
            }
            if NTH_WITH_OF.contains(&name.as_str())
                && let Some((_, end)) = index_of_of_keyword(&inner)
            {
                add(&mut total, highest(&inner[end..]));
            }
            continue;
        }
        if is_name_char(c) || c == '\\' {
            index = skip_name(chars, index);
            total[2] += 1;
            continue;
        }
        index += 1;
    }
    total
}

pub fn get_specificity(selector: &str) -> Specificity {
    let chars: Vec<char> = selector.chars().collect();
    specificity_of(&chars)
}

pub fn get_pseudo_element(selector: &str) -> String {
    let chars: Vec<char> = selector.chars().collect();
    let mut index = 0;
    while index < chars.len() {
        let c = chars[index];
        if c == '[' {
            index = skip_bracket(&chars, index);
            continue;
        }
        if c != ':' {
            index += 1;
            continue;
        }
        let double_colon = at(&chars, index + 1) == Some(':');
        let name_start = index + if double_colon { 2 } else { 1 };
        let name_end = skip_name(&chars, name_start);
        let name = lower_name(&chars, name_start, name_end);
        index = name_end;

        let mut argument = String::new();
        if at(&chars, index) == Some('(') {
            let close = find_close(&chars, index);
            argument = slice(&chars, index, close + 1).into_iter().collect();
            index = close + 1;
        }
        if double_colon || LEGACY_PSEUDO_ELEMENTS.contains(&name.as_str()) {
            return format!("::{name}{argument}");
        }
    }
    String::new()
}

#[cfg(test)]
mod tests {
    use super::get_specificity;

    #[test]
    fn hex_escapes_end_at_their_whitespace() {
        assert_eq!(get_specificity(".\\31 0"), [0, 1, 0]);
        assert_eq!(get_specificity("#\\31 x"), [1, 0, 0]);
        assert_eq!(get_specificity("a.\\31 0:hover"), [0, 2, 1]);
    }
}
