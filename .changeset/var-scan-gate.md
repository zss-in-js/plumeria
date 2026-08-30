---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

Perf: a value that holds no `var(` skips the custom property scan, which the on-demand walk had been running over every string it visits. The gate is implied by the pattern it guards, so the set of variables found is unchanged.
