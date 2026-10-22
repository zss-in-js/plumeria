---
'@plumeria/unplugin': patch
'@plumeria/swc-jest': patch
---

- Fix: the transform scans the project from the bundler root (Jest `rootDir` in swc-jest) instead of the process working directory, so a build started from a monorepo root no longer rescans every workspace on each file
