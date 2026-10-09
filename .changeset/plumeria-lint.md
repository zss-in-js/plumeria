---
'@plumeria/eslint-plugin': minor
'@plumeria/init': minor
'@plumeria/next-plugin': minor
'@plumeria/unplugin': minor
---

- Rename the CLI from `plumerialint` to `plumeria-lint`; `plumerialint` prints that it has been renamed and exits with code 1
- `@plumeria/init` writes `plumeria-lint` into the build script and renames an existing `plumerialint`
- The build lint keeps a compile cache in `node_modules/.cache/plumeria-lint`, so oxlint and the rules load faster from the second build
