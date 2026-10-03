---
'@plumeria/compiler': minor
'@plumeria/eslint-plugin': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- Compute specificity in one pass, and stop counting comments in selector keys
- Read `OF` in `:nth-child()` in any case
- Allow `:not()` inside `:not()`, and stop the build on a key nested deeper than 16 levels or holding a stray quote
- `no-invalid-selector` reports a key nested deeper than 16 levels or holding a stray quote
