---
'@plumeria/compiler': patch
'@plumeria/inspector': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Depend on the internal packages by exact version rather than by caret range. `@plumeria/utils` carries the scan tables between the plugins and is not a stable surface; a caret range let an installed plugin float onto a later `utils` whose tables no longer had the shape that plugin reads
- `@plumeria/unplugin` below 18.5.3 reads `variantsHashTable` off the scan result, and 18.5.3 dropped that table. Any of those versions installed today resolves `@plumeria/utils` to 18.5.4 and throws on a table that is no longer there
