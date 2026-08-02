---
'@plumeria/unplugin': patch
---

Fix: keep the virtual css id relative so a bundler cannot print the author's directories into the stylesheet it ships
Fix: strip the annotation naming the virtual css from the emitted stylesheet on esbuild and Bun
