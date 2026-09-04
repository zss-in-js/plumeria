---
'@plumeria/compiler': minor
'@plumeria/eslint-plugin': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- Add `withoutLogicalProperties` and `withoutPhysicalProperties` to the compiler, unplugin and turbopack-loader options. Either one rejects one spelling of a property that carries both a logical and a physical name, so the pair specificity cannot rank never reaches the stylesheet. Both take `{ sizes: true }` to extend the check from the edges to the twelve axis pairs, enabling both is a configuration error, and neither rewrites anything.
- Fix: `no-unknown-css-properties` reported the `ms`-prefixed properties such as `msOverflowStyle` as unknown. It now shares the case conversion the compiler uses, and reports the obsolete `Khtml`- and `O`-prefixed forms instead.
