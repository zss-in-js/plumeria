---
'@plumeria/compiler': patch
'@plumeria/core': patch
'@plumeria/eslint-plugin': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/utils': patch
'@plumeria/vite-plugin': patch
'@plumeria/webpack-plugin': patch
---

Improve package.json metadata across all packages

- Add homepage field pointing plumeria.dev
- Add sideEffects: false for better tree-shaking
- Update descriptions and repository information