---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

Fix: tell two bracket groups apart when one condition folds both into a lookup, a key both objects carry no longer answers with the later group's style
Fix: number a bracket dimension's keys in a compound lookup, a key holding the `__` the compound key is joined with no longer blurs where one dimension ends
