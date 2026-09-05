---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: skip false, null and undefined style entries while preserving adjacent styles and existing class names.
- Fix: resolve renamed destructured style props by their original prop names.
