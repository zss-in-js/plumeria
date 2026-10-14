---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: `next dev` keeps one more previous generation of rules, so a rule is not dropped when edits arrive before every module has updated
- Fix: `compileCSS` no longer fails when a file is deleted while the project is being compiled, such as during a branch switch
