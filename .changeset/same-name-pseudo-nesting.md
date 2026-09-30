---
'@plumeria/compiler': minor
'@plumeria/eslint-plugin': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- Reject a functional pseudo-class nested inside one of the same name at any depth, such as `:where(:where(.a), .b)`, and stop the build with a message naming the function and the key
- `no-invalid-selector` reports same-name nesting and flattens it with a fix when the nested call is a whole argument; `:not()` and other shapes are reported without a fix
- Find a style prop attribute that follows a JSX closing tag on the same line after `${`, a spread, or a division
- Count a CSS hex escape such as `\31 ` as part of the name when ordering rules by specificity, instead of as an extra element
