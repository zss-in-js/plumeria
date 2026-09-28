pub fn number_to_string(value: f64) -> String {
    if value.is_nan() {
        return "NaN".to_string();
    }
    if value.is_infinite() {
        return if value > 0.0 { "Infinity" } else { "-Infinity" }.to_string();
    }
    if value == 0.0 {
        return "0".to_string();
    }
    let mut buffer = ryu_js::Buffer::new();
    buffer.format_finite(value).to_string()
}

pub fn to_int32(value: f64) -> i32 {
    if !value.is_finite() || value == 0.0 {
        return 0;
    }
    let truncated = value.trunc();
    let modulo = truncated.rem_euclid(4_294_967_296.0);
    if modulo >= 2_147_483_648.0 {
        (modulo - 4_294_967_296.0) as i32
    } else {
        modulo as i32
    }
}

pub fn to_uint32(value: f64) -> u32 {
    if !value.is_finite() || value == 0.0 {
        return 0;
    }
    value.trunc().rem_euclid(4_294_967_296.0) as u32
}

pub fn parse_js_number(text: &str) -> Option<f64> {
    let trimmed = text.trim_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
    if trimmed.is_empty() {
        return Some(0.0);
    }
    let lower = trimmed.to_ascii_lowercase();
    for (prefix, radix) in [("0x", 16), ("0o", 8), ("0b", 2)] {
        if let Some(digits) = lower.strip_prefix(prefix) {
            if digits.is_empty() || !digits.chars().all(|c| c.is_digit(radix)) {
                return None;
            }
            let mut result = 0.0f64;
            for c in digits.chars() {
                result = result * radix as f64 + c.to_digit(radix)? as f64;
            }
            return Some(result);
        }
    }
    let unsigned = trimmed.strip_prefix(['+', '-']).unwrap_or(trimmed);
    if unsigned == "Infinity" {
        return Some(if trimmed.starts_with('-') {
            f64::NEG_INFINITY
        } else {
            f64::INFINITY
        });
    }
    let valid = {
        let bytes = unsigned.as_bytes();
        let mut index = 0;
        let mut digits = 0;
        while index < bytes.len() && bytes[index].is_ascii_digit() {
            index += 1;
            digits += 1;
        }
        if index < bytes.len() && bytes[index] == b'.' {
            index += 1;
            while index < bytes.len() && bytes[index].is_ascii_digit() {
                index += 1;
                digits += 1;
            }
        }
        if digits > 0 && index < bytes.len() && (bytes[index] == b'e' || bytes[index] == b'E') {
            index += 1;
            if index < bytes.len() && (bytes[index] == b'+' || bytes[index] == b'-') {
                index += 1;
            }
            let start = index;
            while index < bytes.len() && bytes[index].is_ascii_digit() {
                index += 1;
            }
            if start == index {
                return None;
            }
        }
        digits > 0 && index == bytes.len()
    };
    if !valid {
        return None;
    }
    trimmed.parse::<f64>().ok()
}
