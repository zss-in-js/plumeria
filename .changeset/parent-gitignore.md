---
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/next-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Compile a project that sits inside another Git repository whose `.gitignore` ignores it. The file walk behind `compileCSS` and the project scan applied every `.gitignore` from the repository root down, so a parent `.gitignore` such as `*` in a home directory hid every source file: development styles appeared, but the production stylesheet came out empty. When a parent `.gitignore` ignores the project directory itself, the walk now leaves out every `.gitignore` above the project and still honors the ones inside it. A repository `.gitignore` keeps applying to an app inside a monorepo. `@plumeria/utils` 19.4 and earlier behaved the same way
- `@plumeria/turbopack-loader` and `@plumeria/unplugin` run the optimizer only where its result is used, and call the synchronous compiler functions without `await`. The output does not change
