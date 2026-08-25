---
'@plumeria/headlessui': patch
'@plumeria/inspector': patch
---

- Fix: resolve `@plumeria/headlessui` under Node's ESM loader by emitting relative exports with file extensions, and drop the redundant `classStyle` declarations on the six `Arrow` components. `@plumeria/inspector` no longer depends on `@plumeria/headlessui`, which it never imported.
