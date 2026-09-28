#[derive(Clone, Copy, PartialEq)]
enum Kind {
    Media,
    Container,
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
enum Axis {
    Width,
    Height,
    InlineSize,
    BlockSize,
}

#[derive(Clone, Debug)]
struct Bounds {
    lower: f64,
    upper: f64,
    unit: String,
}

struct Range {
    kind: Kind,
    name: Option<String>,
    axes: Vec<(Axis, Bounds)>,
}

const SUPPORTED_UNITS: &[&str] = &[
    "", "px", "cm", "mm", "in", "pt", "pc", "q", "em", "rem", "ex", "ch", "cap", "ic", "lh", "rlh",
    "vw", "vh", "vi", "vb", "vmin", "vmax", "svw", "svh", "lvw", "lvh", "dvw", "dvh", "cqw", "cqh",
    "cqi", "cqb", "cqmin", "cqmax",
];

struct Reader {
    chars: Vec<char>,
    position: usize,
}

fn is_identifier_start(c: char) -> bool {
    let lower = c.to_lowercase().next().unwrap_or(c);
    lower.is_ascii_lowercase() || c == '_'
}

fn is_identifier_character(c: char) -> bool {
    is_identifier_start(c) || c.is_ascii_digit() || c == '-'
}

impl Reader {
    fn new(input: &str) -> Self {
        Reader {
            chars: input.chars().collect(),
            position: 0,
        }
    }

    fn done(&self) -> bool {
        self.position == self.chars.len()
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.position).copied()
    }

    fn take(&mut self, text: &str) -> bool {
        let wanted: Vec<char> = text.chars().collect();
        let end = self.position + wanted.len();
        if end > self.chars.len() {
            return false;
        }
        let actual: String = self.chars[self.position..end].iter().collect();
        if actual.to_lowercase() != text.to_lowercase() {
            return false;
        }
        self.position = end;
        true
    }

    fn skip_whitespace(&mut self) -> bool {
        let start = self.position;
        while self.peek().is_some_and(|c| c.is_whitespace()) {
            self.position += 1;
        }
        self.position > start
    }

    fn take_identifier(&mut self) -> Option<String> {
        let start = self.position;
        let first = self.peek()?;
        if !is_identifier_start(first) {
            return None;
        }
        self.position += 1;
        while self.peek().is_some_and(is_identifier_character) {
            self.position += 1;
        }
        Some(
            self.chars[start..self.position]
                .iter()
                .collect::<String>()
                .to_lowercase(),
        )
    }

    fn take_number(&mut self) -> Option<f64> {
        let start = self.position;
        if matches!(self.peek(), Some('+') | Some('-')) {
            self.position += 1;
        }
        let mut digits = 0;
        while self.peek().is_some_and(|c| c.is_ascii_digit()) {
            self.position += 1;
            digits += 1;
        }
        if self.peek() == Some('.') {
            self.position += 1;
            while self.peek().is_some_and(|c| c.is_ascii_digit()) {
                self.position += 1;
                digits += 1;
            }
        }
        if digits == 0 {
            self.position = start;
            return None;
        }
        let text: String = self.chars[start..self.position].iter().collect();
        crate::js::number::parse_js_number(&text)
    }
}

fn axis_of(value: Option<String>) -> Option<Axis> {
    match value.as_deref() {
        Some("width") => Some(Axis::Width),
        Some("height") => Some(Axis::Height),
        Some("inline-size") => Some(Axis::InlineSize),
        Some("block-size") => Some(Axis::BlockSize),
        _ => None,
    }
}

fn take_value(reader: &mut Reader) -> Option<(f64, String)> {
    let value = reader.take_number()?;
    let unit = reader.take_identifier().unwrap_or_default();
    if !SUPPORTED_UNITS.contains(&unit.as_str()) {
        return None;
    }
    Some((value, unit))
}

fn parse_colon_range(reader: &mut Reader) -> Option<(Axis, Bounds)> {
    let start = reader.position;
    let is_min = if reader.take("min") {
        true
    } else if reader.take("max") {
        false
    } else {
        reader.position = start;
        return None;
    };
    if !reader.take("-") {
        return None;
    }
    let axis = axis_of(reader.take_identifier())?;
    reader.skip_whitespace();
    if !reader.take(":") {
        return None;
    }
    reader.skip_whitespace();
    let (value, unit) = take_value(reader)?;
    Some((
        axis,
        if is_min {
            Bounds {
                lower: value,
                upper: f64::INFINITY,
                unit,
            }
        } else {
            Bounds {
                lower: f64::NEG_INFINITY,
                upper: value,
                unit,
            }
        },
    ))
}

fn take_operator(reader: &mut Reader) -> Option<String> {
    let first = reader.peek()?;
    if first != '<' && first != '>' {
        return None;
    }
    reader.position += 1;
    if reader.peek() == Some('=') {
        reader.position += 1;
        return Some(format!("{first}="));
    }
    Some(first.to_string())
}

fn parse_comparison_range(reader: &mut Reader) -> Option<(Axis, Bounds)> {
    let axis = axis_of(reader.take_identifier())?;
    reader.skip_whitespace();
    let operator = take_operator(reader)?;
    reader.skip_whitespace();
    let (value, unit) = take_value(reader)?;
    Some((
        axis,
        if operator.starts_with('>') {
            Bounds {
                lower: value,
                upper: f64::INFINITY,
                unit,
            }
        } else {
            Bounds {
                lower: f64::NEG_INFINITY,
                upper: value,
                unit,
            }
        },
    ))
}

fn parse_between_range(reader: &mut Reader) -> Option<(Axis, Bounds)> {
    let (low, low_unit) = take_value(reader)?;
    reader.skip_whitespace();
    let lower = take_operator(reader)?;
    if !lower.starts_with('<') {
        return None;
    }
    reader.skip_whitespace();
    let axis = axis_of(reader.take_identifier())?;
    reader.skip_whitespace();
    let upper = take_operator(reader)?;
    if !upper.starts_with('<') {
        return None;
    }
    reader.skip_whitespace();
    let (high, high_unit) = take_value(reader)?;
    if low_unit != high_unit {
        return None;
    }
    Some((
        axis,
        Bounds {
            lower: low,
            upper: high,
            unit: low_unit,
        },
    ))
}

fn parse_term(reader: &mut Reader) -> Option<(Axis, Bounds)> {
    if !reader.take("(") {
        return None;
    }
    reader.skip_whitespace();
    let start = reader.position;
    let mut parsed = parse_colon_range(reader);
    if parsed.is_none() {
        reader.position = start;
        parsed = parse_comparison_range(reader);
    }
    if parsed.is_none() {
        reader.position = start;
        parsed = parse_between_range(reader);
    }
    let parsed = parsed?;
    reader.skip_whitespace();
    if reader.take(")") { Some(parsed) } else { None }
}

fn merge_bounds(axes: &mut Vec<(Axis, Bounds)>, axis: Axis, next: Bounds) -> bool {
    if let Some((_, previous)) = axes.iter_mut().find(|(a, _)| *a == axis) {
        if previous.unit != next.unit {
            return false;
        }
        *previous = Bounds {
            lower: previous.lower.max(next.lower),
            upper: previous.upper.min(next.upper),
            unit: next.unit,
        };
        return true;
    }
    axes.push((axis, next));
    true
}

fn parse_range(condition: &str) -> Option<Range> {
    let mut reader = Reader::new(condition.trim());
    let kind = if reader.take("@media") {
        Kind::Media
    } else if reader.take("@container") {
        Kind::Container
    } else {
        return None;
    };
    if !reader.skip_whitespace() {
        return None;
    }
    let mut name = None;
    if reader.peek() != Some('(') {
        let identifier = reader.take_identifier()?;
        if identifier == "not" || identifier == "only" {
            return None;
        }
        if !reader.skip_whitespace() {
            return None;
        }
        if kind == Kind::Media && (!reader.take("and") || !reader.skip_whitespace()) {
            return None;
        }
        name = Some(identifier);
    }
    let mut axes = Vec::new();
    loop {
        let (axis, bounds) = parse_term(&mut reader)?;
        if !merge_bounds(&mut axes, axis, bounds) {
            return None;
        }
        let separator = reader.skip_whitespace();
        if reader.done() {
            break;
        }
        if !separator || !reader.take("and") || !reader.skip_whitespace() {
            return None;
        }
    }
    Some(Range { kind, name, axes })
}

pub fn implies_condition(narrow: &str, broad: &str) -> bool {
    let (Some(tight), Some(wide)) = (parse_range(narrow), parse_range(broad)) else {
        return false;
    };
    if tight.kind != wide.kind || tight.name != wide.name {
        return false;
    }
    let mut strict = tight.axes.len() > wide.axes.len();
    for (axis, wide_bounds) in &wide.axes {
        let Some((_, tight_bounds)) = tight.axes.iter().find(|(a, _)| a == axis) else {
            return false;
        };
        if tight_bounds.unit != wide_bounds.unit {
            return false;
        }
        if tight_bounds.lower < wide_bounds.lower || tight_bounds.upper > wide_bounds.upper {
            return false;
        }
        if tight_bounds.lower > wide_bounds.lower || tight_bounds.upper < wide_bounds.upper {
            strict = true;
        }
    }
    strict
}
