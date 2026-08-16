---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Feat: two states that can hold at once, such as `:hover` and `:focus`, now settle their intersection by composition order. The atom from the style written further right in `classStyle` receives one more `:not(#\#)` and becomes a class of its own, so reversing the array reverses the winner and the module the bundler reached first no longer decides. Only a pair that is otherwise indistinguishable is weighted; a differing at-rule, shorthand depth or selector specificity is left alone, and an explicit compound such as `:hover:focus` stays above the weighting.
