---
'@plumeria/eslint-plugin': patch
'@plumeria/next-plugin': patch
'@plumeria/unplugin': patch
---

- The build lint and `plumerialint` run oxlint at the lowest CPU priority, so the build keeps the CPU when both compete for it
- The build lint and `plumerialint` run oxlint on 2 threads, and `plumerialint` keeps a `--threads` you pass
