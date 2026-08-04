---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

Fix: name the css variable of a dynamic function key after the declaration it resolves to, so two keys that share a parameter name no longer overwrite each other on one element
Fix: set the variable for a parameter that only appears under a nested selector or an at-rule
Fix: resolve a dynamic function key written inside a condition, instead of dropping the branch it belongs to
Fix: read the named parameters of a destructured signature, and fold such an argument into the rule only when its value is written out in full
Fix: report a dynamic function key that cannot reach the element, instead of emitting a call that throws at runtime
