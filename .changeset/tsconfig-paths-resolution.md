---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Resolve a `paths` alias from the `tsconfig.json` as it is actually written. A config carrying comments or a trailing comma, one saved with a byte order mark, one inheriting `paths` through `extends`, and the scaffolded pair that keeps its real config under `references` were each read as strict JSON from the root file alone, so the alias resolved to nothing without a word: a `keyframes` or a `create` imported under one was left out of the sheet and the element lost the class, while the build still passed. An inherited substitution is anchored to the config that declares it, the way `tsc` anchors it. `baseUrl` stays unread — it is deprecated in TypeScript 6 and stops functioning in 7
- Match the longest alias prefix rather than the first one written. Where `@/*` and `@/lib/*` are both declared, `@/lib/button` was taken under `@/*`, so a file that happened to sit at that path was compiled in place of the real one
