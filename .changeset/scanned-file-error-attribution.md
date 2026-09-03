---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: an error thrown while scanning the file a style is declared in was reported under the name of the file that uses the style. It is now reported under the name of the file it came from, including when the style is reached through a re-export.
