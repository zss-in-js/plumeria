---
'@plumeria/turbopack-loader': minor
'@plumeria/compiler': minor
'@plumeria/unplugin': minor
---

Feat: accept a non-literal bracket key inside a condition, `enabled ? styles[variant] : styles.disabled` no longer fails to compile
Feat: fold an argument's mutually exclusive branches into one lookup, so nesting no longer doubles the generated table per level
Fix: emit CSS for a bracket group reached through a condition, `enabled && styles[variant]` produced no rules at all
