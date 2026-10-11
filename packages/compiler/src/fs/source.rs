use std::sync::{Mutex, OnceLock};
use std::time::SystemTime;

use rustc_hash::FxHashMap;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct SourceStamp {
    modified: Option<SystemTime>,
    len: u64,
    #[cfg(unix)]
    changed: (i64, i64),
}

pub fn stamp(file: &str) -> std::io::Result<SourceStamp> {
    let metadata = std::fs::metadata(file)?;
    Ok(SourceStamp {
        modified: metadata.modified().ok(),
        len: metadata.len(),
        #[cfg(unix)]
        changed: {
            use std::os::unix::fs::MetadataExt;
            (metadata.ctime(), metadata.ctime_nsec())
        },
    })
}

// Scan invalidation also visits unchanged importers. Share their text with extraction.
pub fn read(file: &str) -> std::io::Result<String> {
    type Cache = FxHashMap<String, (SourceStamp, String)>;
    static SOURCES: OnceLock<Mutex<Cache>> = OnceLock::new();
    let mut cache = SOURCES
        .get_or_init(|| Mutex::new(Cache::default()))
        .lock()
        .unwrap();
    let stamp = match stamp(file) {
        Ok(stamp) => stamp,
        Err(error) => {
            cache.remove(file);
            return Err(error);
        }
    };
    if let Some((previous, source)) = cache.get(file)
        && *previous == stamp
    {
        return Ok(source.clone());
    }
    drop(cache);
    let source = std::fs::read_to_string(file)?;
    #[cfg(test)]
    {
        *reads().lock().unwrap().entry(file.to_string()).or_default() += 1;
    }
    let mut cache = SOURCES.get().unwrap().lock().unwrap();
    if cache.len() >= 4096 {
        cache.clear();
    }
    cache.insert(file.to_string(), (stamp, source.clone()));
    Ok(source)
}

#[cfg(test)]
fn reads() -> &'static Mutex<FxHashMap<String, usize>> {
    static READS: OnceLock<Mutex<FxHashMap<String, usize>>> = OnceLock::new();
    READS.get_or_init(|| Mutex::new(FxHashMap::default()))
}

#[cfg(test)]
pub fn read_count(file: &str) -> usize {
    reads()
        .lock()
        .unwrap()
        .get(file)
        .copied()
        .unwrap_or_default()
}
