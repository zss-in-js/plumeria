---
'@plumeria/next-plugin': patch
---

- Fix: `next dev` no longer fails with Module not found after Plumeria is upgraded or downgraded while `.next` is kept, because the Turbopack loaders receive the installed loader version and discard transforms cached by another version
