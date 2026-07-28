---
'@plumeria/compiler': major
'@plumeria/core': major
'@plumeria/eslint-plugin': major
'@plumeria/headlessui': major
'@plumeria/inspector': major
'@plumeria/next-plugin': major
'@plumeria/turbopack-loader': major
'@plumeria/unplugin': major
'@plumeria/utils': major
---

Bump version to 17.0.0

- feat: generate the production stylesheet from the loader, PostCSS is no longer required
- feat: add styleProp, include and exclude options to the loader
- feat: add styleProp option to unplugin and to the lint rules
- feat: rename lint rule style-name-requires-import to props-require-import
- fix: stop collecting prop styles from host elements
- perf: apply Turbopack rule conditions on Next.js 16 and above
- perf: skip discarded conversions in the first scanning pass
- break: @plumeria/core no longer declares a styling prop, reference @plumeria/core/style-name
- break: rename the StyleName type to Style
- break: remove @plumeria/postcss-plugin
