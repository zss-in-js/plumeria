---
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: carry a preserved inline style object one property at a time, so a trailing comma or a line comment no longer breaks the merged style attribute.
