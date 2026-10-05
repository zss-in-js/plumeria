---
'@plumeria/codemod': patch
'@plumeria/compiler': patch
'@plumeria/core': patch
'@plumeria/eslint-plugin': patch
'@plumeria/headlessui': patch
'@plumeria/init': patch
'@plumeria/inspector': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Remove the `funding` field from package.json
- Move the test-only devDependencies of `@plumeria/compiler` to the workspace root
- Update the `next` devDependency of `@plumeria/next-plugin` to 16.3.8
