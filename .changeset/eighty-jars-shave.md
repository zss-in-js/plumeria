---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

Fix: Reject a style prop that is never applied, and resolve one applied under a condition

A component may receive a style through a prop and apply it to an element it
renders, on its own or merged under a base style. A style prop that is never
applied now fails the build instead of silently dropping the style, which is
what passing it on to another component did.

`classStyle={[styles.base, cond && styleArray]}` and
`classStyle={cond ? styleArray : styles.base}` now compile as well. The styles
a prop's call sites pass are carried through the condition, and a closed gate
leaves the surrounding styles in place.
