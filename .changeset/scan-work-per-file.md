---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Read a file's exports once per scan rather than twice. Each parsed file had its imports and exports walked before the scan and again at the end of the first pass, which also resolved every import specifier a second time. A rescan that reparses 201 files drops about 3%, and 400 needless file system lookups go with it
- Order the entries a component's prop collects by code unit rather than by locale. Comparing two paths with `localeCompare` builds the collator the first time it runs, which cost about 7 ms inside the first scan of every process; a build that scans from several workers paid it once per worker. Paths are internal keys, and they now sort the way the scanned file list already does
