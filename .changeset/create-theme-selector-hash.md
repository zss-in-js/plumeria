---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: editing only the selector passed to `css.createTheme` left the rule under the old selector setting the same custom properties, because their names were hashed from the value alone and never from the selector. The selector is now part of the hash, so the rule left behind declares variables of its own and stops competing with the new one.
- Fix: `@plumeria/utils` hashes a `createTheme` declaration the same way in the scan pass as in the transform, which had left the selector out of the scan pass alone.
