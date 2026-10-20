---
'@plumeria/eslint-plugin': minor
'@plumeria/unplugin': minor
'@plumeria/next-plugin': minor
---

- Update: `sort-properties` reads a computed key from `css.createStatic`, such as `[media.desktop]`, as the at-rule it holds and sorts it with the other at-rules, after the pseudo-classes, so it no longer conflicts with `no-order-dependent-overlap`; `plumeria-lint --fix` moves the keys already written
