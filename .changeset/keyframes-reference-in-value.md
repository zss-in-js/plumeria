---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: a `css.keyframes` or `css.viewTransition` binding read inside a template literal or a concatenation lost the `kf-` / `vt-` prefix its own name carries, so the value named a rule that was never emitted and an `animation` shorthand built that way animated nothing. The binding now reads the same wherever it is read.
- Fix: a reference sitting in the middle of a value, as an `animation` shorthand holds one, is now found when collecting the rules a sheet needs, instead of only when it is the whole value.
