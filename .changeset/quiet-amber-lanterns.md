---
'@plumeria/core': minor
'@plumeria/compiler': minor
'@plumeria/utils': minor
'@plumeria/eslint-plugin': minor
'@plumeria/swc-jest': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
---

- Feat: `css.varType` defines a typed custom property and returns its name, and emits its `@property` only when the name is used in a key or value
- Feat: `css.varType` reports an `@property` the browser cannot parse, such as a quote in `syntax` or an `initialValue` of another type, at its definition instead of breaking the whole stylesheet
- Feat: `validate-values` checks a `css.varType` `initialValue` against its `syntax`, and reports font-relative units, container units and `var()`, which the browser drops
- Feat: `no-mutable-binding`, `no-destructure` and `no-inner-call` cover `css.varType`
