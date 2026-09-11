---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Refactor: share one transform between the plugin and the Turbopack loader, so a file compiles through the same implementation instead of two copies that could drift.
- Fix: hoist a function declaration nested in a block to the enclosing function scope, so a reference to it is no longer collected as a module reference.
- Refactor: drop the unreachable null paths from `resolveDynamicStyle` and the call sites that guarded them.
