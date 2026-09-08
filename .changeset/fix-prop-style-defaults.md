---
'@plumeria/compiler': patch
'@plumeria/utils': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: read a renamed style prop only from a renaming pattern, so a plain default value no longer stands in for the prop name.
- Fix: report a style prop default that is not a defined style, instead of dropping it or emitting a rule nothing can set.
- Fix: resolve a constant that names another constant, so its value reaches the style.
