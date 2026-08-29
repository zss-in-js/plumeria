---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: a `css.createTheme` selector written as anything other than a string literal — a template literal, or a name the file declares — was read as an empty selector, which dropped the theme's whole rule and left the styles pointing at custom properties nothing declared. The selector is now resolved the same way a style value is, so a name or a `createStatic` entry works, and two themes that differ only by selector stay apart.
- Fix: a selector that still cannot be read at build time is now reported where it is written, instead of compiling to no CSS at all.
