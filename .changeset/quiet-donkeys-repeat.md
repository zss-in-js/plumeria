---
'@plumeria/turbopack-loader': patch
'@plumeria/compiler': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

Fix: register prop styles for member expression JSX tags, `<svg.Logo classStyle={...} />` failed to compile
Fix: resolve a component tag through the export graph so any chain depth lands on the module its leaf is declared in
Fix: track namespace imports so `<Icons.Logo />` resolves through `import * as Icons`
Perf: resolve the component key once per JSX element instead of once per attribute
