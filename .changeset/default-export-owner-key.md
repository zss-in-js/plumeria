---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: a component exported as the default of its file was keyed by `default` instead of by the name it is declared with, so a named component sharing that file and that prop name could be found in its place and its styles bound to the wrong element. A default export now resolves to the local binding it names.

- Fix: a style prop on a component the file does not declare at the top level — one wrapped in `memo`, `forwardRef` or any other call — was resolved by taking the first component in the file that takes a prop of that name, which depends on registration order and could bind another component's style or none at all. Every candidate in the file is now collected, and the key the caller passed selects among them at runtime.
