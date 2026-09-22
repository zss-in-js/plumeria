---
'@plumeria/compiler': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Collect a module's imports from its body. Building the alias and import maps ran a full AST walk to reach declarations that can only appear at the top level; the transform now iterates the module body
- Reuse the source buffer when splicing the replacements. Writing the transformed file encoded the source into a second buffer that the parse step had already built. On a 17 KB module with 26 imports and 240 top-level declarations the two together save about 170 µs, roughly 9% of the SWC parse of the same file; modules the size of the benchmark's fixtures are unchanged
