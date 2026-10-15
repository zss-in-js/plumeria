---
'@plumeria/turbopack-loader': patch
---

- Fix: `next dev` no longer shows a frame without styles when a client component or a style module it imports is edited, because the edited module carries the stylesheet until the updated one arrives
