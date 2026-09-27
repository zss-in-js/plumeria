---
'@plumeria/compiler': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Name the expression behind a build-time resolution error and say how to fix it. Unknown style members, unresolvable identifiers and member expressions, template values, unary operands, unsupported binary operators and unsupported expression types now show the code that failed and what the build can read instead, and the `createTheme` selector error matches the wording the compiler already used
- Add the file name to the dynamic style errors for a missing object argument and an unset parameter without a default
- Show the source of a style value that cannot be resolved at build time, such as `t.missing` or `a ? 1 : 2`, instead of its syntax node type
- Start every build error with `[plumeria]`. The turbopack-loader and unplugin transforms printed `Plumeria:` while the compiler printed `[plumeria]`, so the same error read differently in development and production builds
