---
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Read a misordered property's reported position from the index `sort-properties` already builds. The rule mapped every property to its sorted position to decide what was out of order, then scanned the sorted list again once per report
- Collect a file's extracted stylesheets in a set. Every sheet was matched against the growing array, and the on-demand pass rebuilt its own lookup from that array on each call; both now write through one insertion-ordered set, and `extractOndemandStyles` takes the collector rather than the array
