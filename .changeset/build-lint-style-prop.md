---
'@plumeria/eslint-plugin': patch
'@plumeria/init': patch
'@plumeria/next-plugin': patch
'@plumeria/unplugin': patch
---

- The build lint reads the styling prop from `styleProp`, so `no-mixed-styling-props`, `no-inline-object`, `no-style-prop-relay`, `no-unresolved-composition` and `custom-props-require-import` check the prop the compiler transforms instead of `classStyle`
- `plumerialint` takes the styling prop with `--style-prop`, or reads `settings.plumeria.styleProp` from the ESLint config when ESLint is installed
- `@plumeria/init` writes `--style-prop` into the build script it guards with `plumerialint` when the styling prop is renamed
- `@plumeria/init` writes a renamed styling prop into the ESLint config as `settings.plumeria.styleProp`, so the editor checks the same prop the compiler transforms
- `@plumeria/eslint-plugin/guard` exports `lintOverrides` in place of `spellingRules`
