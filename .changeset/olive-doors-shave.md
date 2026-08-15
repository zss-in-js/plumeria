---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: a function key on a style imported from another file is compiled instead of silently dropped, in the transform and in the generated CSS alike.

- Fix: an imported style resolves the constants, `createStatic` and `createTheme` values of the file that declares it; both function keys and static keys lost those declarations before.
