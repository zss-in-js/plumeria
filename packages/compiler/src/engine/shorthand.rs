use std::collections::VecDeque;
use std::sync::{Mutex, OnceLock};

use rustc_hash::{FxHashMap, FxHashSet};

use super::data::DIRECT_LONGHANDS;

pub fn direct_longhands(shorthand: &str) -> &'static [&'static str] {
    static TABLE: OnceLock<FxHashMap<&'static str, &'static [&'static str]>> = OnceLock::new();
    TABLE
        .get_or_init(|| DIRECT_LONGHANDS.iter().copied().collect())
        .get(shorthand)
        .copied()
        .unwrap_or(&[])
}

fn direct_shorthands(longhand: &str) -> &'static [&'static str] {
    static TABLE: OnceLock<FxHashMap<&'static str, Vec<&'static str>>> = OnceLock::new();
    TABLE
        .get_or_init(|| {
            let mut table: FxHashMap<&'static str, Vec<&'static str>> = FxHashMap::default();
            for (shorthand, longhands) in DIRECT_LONGHANDS {
                for longhand in *longhands {
                    table.entry(*longhand).or_default().push(*shorthand);
                }
            }
            table
        })
        .get(longhand)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

pub fn get_property_depth(property: &str) -> usize {
    static CACHE: OnceLock<Mutex<FxHashMap<String, usize>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| Mutex::new(FxHashMap::default()));
    let mut memo = cache.lock().unwrap();
    depth_of(property, &mut memo)
}

fn depth_of(property: &str, memo: &mut FxHashMap<String, usize>) -> usize {
    if let Some(depth) = memo.get(property) {
        return *depth;
    }
    memo.insert(property.to_string(), 0);
    let mut depth = 0;
    for shorthand in direct_shorthands(property) {
        depth = depth.max(depth_of(shorthand, memo) + 1);
    }
    memo.insert(property.to_string(), depth);
    depth
}

pub fn covers(shorthand: &str, longhand: &str) -> bool {
    let mut seen: FxHashSet<&str> = FxHashSet::default();
    let mut queue: VecDeque<&str> = direct_longhands(shorthand).iter().copied().collect();
    while let Some(current) = queue.pop_front() {
        if current == longhand {
            return true;
        }
        if !seen.insert(current) {
            continue;
        }
        queue.extend(direct_longhands(current).iter().copied());
    }
    false
}
