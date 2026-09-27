---
'@plumeria/eslint-plugin': minor
'@plumeria/utils': minor
---

- `no-invalid-selector`, `validate-pseudos` and `validate-at-rules` resolve a computed key by following it back to where it is declared instead of asking the TypeScript type checker, so they check the same keys under ESLint and `plumerialint` and no longer need `projectService`. A key resolves when it is a `const` string, a member of a `const` object or a `css.createStatic` object, or an import of one of these; `as const`, `satisfies` and type annotations make no difference
- `validate-pseudos` and `validate-at-rules` report as warnings, like `validate-values`. `plumerialint` still stops the build on them
- `@typescript-eslint/utils` is no longer a dependency of `@plumeria/eslint-plugin`
- `@plumeria/utils` adds `resolveExportValue`, which reads the value an export holds, following re-exports, imports and `createStatic` objects
