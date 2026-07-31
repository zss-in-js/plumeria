---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

Fix: merge the sources of a styling prop in the order they are written, an unconditional style placed after a condition no longer loses to it
Fix: a condition placed after a bracket group is no longer overridden by that group
