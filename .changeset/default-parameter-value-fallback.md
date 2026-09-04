---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: a style function parameter with a default overwrote the whole declaration value with its variable, so ``background: `linear-gradient(${c}, #000)` `` compiled to `background: var(--hash-c, teal)` and the text around the variable was dropped. The fallback is now written into the variable reference.
- Fix: the default only reached the first declaration the parameter landed in, so `(c = 'red') => ({ color: c, borderColor: c })` left `border-color` without a fallback. Every declaration now gets one, with the unit decided per declaration.
