---
'@plumeria/compiler': minor
'@plumeria/core': minor
'@plumeria/eslint-plugin': minor
'@plumeria/next-plugin': minor
'@plumeria/swc-jest': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- `no-unknown-css-properties` checks names against MDN data instead of `known-css-properties`, and reports names MDN does not document, such as the speech properties
- The CSS types are generated from MDN data, so newer properties such as `cornerShape` complete and keywords follow each property's syntax
- The CSS types keep the obsolete properties browsers still apply, such as `gridGap` and `fontStretch`, and drop names no browser runs, such as `voiceFamily`
- `MsOverflowStyle` in the CSS types is now `msOverflowStyle`
- A number for `lineClamp`, `WebkitLineClamp`, `readingOrder` and the other unitless properties is written without `px`
- `plumeria-lint` keeps a compile cache, so it starts faster from the second run
