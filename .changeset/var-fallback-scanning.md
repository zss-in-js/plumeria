---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

Fix: a theme variable written with a fallback, or nested inside another variable's fallback, was not recognised as used, so its declaration never reached the sheet and the value fell back for want of anything to read. The name is now read up to where the fallback begins, rather than up to a closing parenthesis that may belong to an inner `var()`.
