---
'@plumeria/compiler': minor
'@plumeria/utils': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
---

- Fix: resolve static expressions and imported styles consistently and preserve conditional style prop arrays.
- Fix: distinguish invalid operand types from unsupported binary operators in diagnostics.
- Fix: clear stale scan contributions and diagnostics after source, dependency, or import configuration changes.
- Fix: preserve loader bindings and JSX attributes, report unsupported style expressions, and recover from failed CSS generation.
- Fix: apply the same top-level style declaration checks in unplugin and the Turbopack loader.

- Fix: avoid evaluating ordinary JSX component prop objects as CSS while retaining strict validation of styling expressions.
