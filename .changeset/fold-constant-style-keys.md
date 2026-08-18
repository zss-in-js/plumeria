---
'@plumeria/codemod': patch
---

- Feat: a style read with a key named by a constant — `styles[size]` where `size` is a `const` holding a string, in the same file or imported from another — is resolved to the class it names instead of being reported, and a constant left naming nothing is removed with it.
- Fix: `migrate --from css-modules` writes a restored read with the name the import carries, so a composed array, a `css.use` call, and a local holding a style survive a file whose module was renamed on the way back.
