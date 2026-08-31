---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

Fix: `compileCSS` read each globbed file at the path the glob returned, which is relative to `cwd`. Passing a `cwd` other than the process directory threw `ENOENT`. The path is now resolved against `cwd` before it is read.

Perf: a value that holds none of `kf-`, `vt-` or `cr-` skips the reference marker scan, which the on-demand walk had been running over every string it visits. Every match begins with one of the three, so the set of references found is unchanged.
