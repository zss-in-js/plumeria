use crate::js::number::number_to_string;
use crate::js::{Object, Value, cmp_utf16};

pub fn normalize_object(object: &Object) -> String {
    let mut out = String::new();
    push_object(&mut out, object);
    out
}

fn push_normalized(out: &mut String, value: &Value) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Str(text) => out.push_str(text),
        Value::Num(number) => out.push_str(&number_to_string(*number)),
        Value::Bool(flag) => out.push_str(if *flag { "true" } else { "false" }),
        Value::Obj(object) => push_object(out, object),
    }
}

fn push_object(out: &mut String, object: &Object) {
    let mut keys: Vec<&str> = object.keys();
    keys.sort_by(|a, b| cmp_utf16(a, b));
    out.push('{');
    for (index, key) in keys.iter().enumerate() {
        if index > 0 {
            out.push(',');
        }
        out.push('"');
        out.push_str(key);
        out.push_str("\":");
        if let Some(value) = object.get(key) {
            push_normalized(out, value);
        }
    }
    out.push('}');
}

const C1: u64 = 0x87c3_7b91_1142_53d5;
const C2: u64 = 0x4cf5_ad43_2745_937f;

fn fmix64(mut k: u64) -> u64 {
    k ^= k >> 33;
    k = k.wrapping_mul(0xff51_afd7_ed55_8ccd);
    k ^= k >> 33;
    k = k.wrapping_mul(0xc4ce_b9fe_1a85_ec53);
    k ^= k >> 33;
    k
}

fn murmurhash3_x64_128(key: &[u8], seed: u64) -> u64 {
    let mut h1 = seed;
    let mut h2 = seed;
    let len = key.len();
    let nblocks = len / 16;

    for block in 0..nblocks {
        let offset = block * 16;
        let mut k1 = u64::from_le_bytes(key[offset..offset + 8].try_into().unwrap());
        let mut k2 = u64::from_le_bytes(key[offset + 8..offset + 16].try_into().unwrap());

        k1 = k1.wrapping_mul(C1);
        k1 = k1.rotate_left(31);
        k1 = k1.wrapping_mul(C2);
        h1 ^= k1;

        h1 = h1.rotate_left(27);
        h1 = h1.wrapping_add(h2);
        h1 = h1.wrapping_mul(5).wrapping_add(0x52dc_e729);

        k2 = k2.wrapping_mul(C2);
        k2 = k2.rotate_left(33);
        k2 = k2.wrapping_mul(C1);
        h2 ^= k2;

        h2 = h2.rotate_left(31);
        h2 = h2.wrapping_add(h1);
        h2 = h2.wrapping_mul(5).wrapping_add(0x3849_5ab5);
    }

    let tail = &key[nblocks * 16..];
    let rest = len & 15;
    let mut k1: u64 = 0;
    let mut k2: u64 = 0;

    if rest > 8 {
        for index in (8..rest).rev() {
            k2 ^= (tail[index] as u64) << ((index - 8) * 8);
        }
        k2 = k2.wrapping_mul(C2);
        k2 = k2.rotate_left(33);
        k2 = k2.wrapping_mul(C1);
        h2 ^= k2;
    }
    if rest > 0 {
        for index in (0..rest.min(8)).rev() {
            k1 ^= (tail[index] as u64) << (index * 8);
        }
        k1 = k1.wrapping_mul(C1);
        k1 = k1.rotate_left(31);
        k1 = k1.wrapping_mul(C2);
        h1 ^= k1;
    }

    h1 ^= len as u64;
    h2 ^= len as u64;

    h1 = h1.wrapping_add(h2);
    h2 = h2.wrapping_add(h1);

    h1 = fmix64(h1);
    h2 = fmix64(h2);

    h1 = h1.wrapping_add(h2);
    h2 = h2.wrapping_add(h1);

    h1 ^ h2
}

fn to_base36(mut value: u64) -> String {
    if value == 0 {
        return "0".to_string();
    }
    let mut digits = Vec::new();
    while value > 0 {
        let digit = (value % 36) as u8;
        digits.push(if digit < 10 {
            b'0' + digit
        } else {
            b'a' + digit - 10
        });
        value /= 36;
    }
    digits.reverse();
    String::from_utf8(digits).unwrap_or_default()
}

pub fn hash_normalized(normalized: &str, seed: u64, length: usize) -> String {
    let hashed = to_base36(murmurhash3_x64_128(normalized.as_bytes(), seed));
    let keep = length.saturating_sub(1);
    let tail = if hashed.len() > keep {
        &hashed[hashed.len() - keep..]
    } else {
        &hashed[..]
    };
    format!("x{tail}")
}

pub fn hash_object(object: &Object) -> String {
    hash_normalized(&normalize_object(object), 1, 8)
}

pub fn hash_str(text: &str) -> String {
    hash_normalized(text, 1, 8)
}
