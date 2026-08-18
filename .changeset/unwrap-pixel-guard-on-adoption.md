---
'@plumeria/codemod': patch
---

- Fix: `migrate --from css-modules` drops the pixel guard the export put around a function style argument, so `styles.box(width)` comes back as it was written rather than carrying a `typeof` test the custom property no longer needs. Left in, it was wrapped in another guard the next time the project was exported and the file stopped compiling, so a project with a function style in it could be adopted back but never exported again.
- The round trip closes: a project exports, adopts back, and exports again, with each direction reaching a fixed point on its second pass.
