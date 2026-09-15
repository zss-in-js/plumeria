---
'@plumeria/compiler': patch
'@plumeria/utils': patch
---

- Restore `classStyle` compilation at component call sites so generated classes reach components such as Next.js `Link` and Fumadocs code blocks
