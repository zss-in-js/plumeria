---
'@plumeria/eslint-plugin': minor
'@plumeria/init': minor
'@plumeria/next-plugin': minor
'@plumeria/unplugin': minor
---

- `@plumeria/next-plugin` and `@plumeria/unplugin` run `@plumeria/eslint-plugin` through oxlint alongside a production build and stop it on any error or warning, so no build script is needed
- `@plumeria/unplugin` lints on Vite, webpack, Rspack, Rollup, Rolldown and Farm
- `withoutLogicalProperties` and `withoutPhysicalProperties` turn on the matching lint rule in that lint
- Add the `lint` option to `@plumeria/next-plugin` and `@plumeria/unplugin` to build without the lint
- `expand-border-shorthands` joins the recommended rules as a warning
- `plumerialint` runs the oxlint that `@plumeria/eslint-plugin` depends on, so oxlint needs no separate install
- The lint runs the Plumeria rules only, not oxlint's own default rules, and passes when there is no file to lint
- `@plumeria/eslint-plugin` depends on oxlint 1.87.0
- `@plumeria/init` prefixes the build script with `plumerialint --` only on esbuild and Bun, and no longer installs oxlint or asks about border shorthands
