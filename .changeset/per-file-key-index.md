---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Remove a changed file's entries from the aggregated tables by name. Every invalidated file searched all of those tables for the keys it had written, so a rescan cost the number of changed files times the size of the project: editing a module that 200 others import spent more than half of the rescan inside that search. The keys a file writes are now recorded as it writes them, including the ones it published before it threw, and a rescan of the same edit takes about half as long
