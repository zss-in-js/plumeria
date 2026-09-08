---
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: align style transformation, scope checks, preserved JSX references, and compilation errors with the Turbopack loader.
- Refactor: remove the legacy css.variants tables, which the bracket notation on css.create replaces.
- Fix: stop applying legacy css.variants checks in no-inline-object, no-combinator, no-inner-call, and no-destructure while preserving current API diagnostics.
