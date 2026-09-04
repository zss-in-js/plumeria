---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: a style function parameter used in declarations with different unit rules shared one variable, so `(n: number) => ({ padding: n, zIndex: n })` set it to `4px` and left `z-index` invalid. Such a parameter now gets one variable per unit rule, and a parameter whose declarations agree keeps the single variable it had.
