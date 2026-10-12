---
'@plumeria/core': minor
'@plumeria/eslint-plugin': minor
'@plumeria/next-plugin': minor
'@plumeria/unplugin': minor
---

- Feat: `no-order-dependent-overlap` reports two media or container queries that cross without either containing the other, such as `600px` to `900px` against `700px` to `1000px`, when both set the same property
- Feat: `no-order-dependent-overlap` resolves keys from `createStatic`, including breakpoints imported from another module
- Feat: `no-mutable-binding` reports a `let` or `var` binding used in `css.create`, `createStatic`, `createTheme`, `keyframes` or `viewTransition`, since the build reads only the value it starts with
- Update: README.md
- Fix: Place attribute selectors before pseudo-classes in compound keys recommended by `no-order-dependent-overlap` so they pass `validate-pseudos`.
