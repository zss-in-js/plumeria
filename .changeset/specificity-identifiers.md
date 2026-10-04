---
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Read selector names as CSS identifiers when computing specificity, so `of` in `:nth-child()` is read when `.`, `#` or `:` follows it directly (`2 of.a`) and when escaped (`o\66`)
- Count escaped pseudo-class names such as `:\69s()` and `:nth-chil\64()`
- Count type selectors that start with a non-ASCII character
