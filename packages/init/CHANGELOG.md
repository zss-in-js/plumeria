# @plumeria/init

## 19.11.0

### Minor Changes

- 21c541a: - Rename the CLI from `plumerialint` to `plumeria-lint`; `plumerialint` prints that it has been renamed and exits with code 1
  - `@plumeria/init` writes `plumeria-lint` into the build script and renames an existing `plumerialint`
  - The build lint keeps a compile cache in `node_modules/.cache/plumeria-lint`, so oxlint and the rules load faster from the second build

## 19.10.4

### Patch Changes

- 2079db2: Bump version to 19.10.4

## 19.10.3

### Patch Changes

- 0a9c2d8: Bump version to 19.10.3

## 19.10.2

### Patch Changes

- 50858a7: - The build lint reads the styling prop from `styleProp`, so `no-mixed-styling-props`, `no-inline-object`, `no-style-prop-relay`, `no-unresolved-composition` and `custom-props-require-import` check the prop the compiler transforms instead of `classStyle`
  - `plumerialint` takes the styling prop with `--style-prop`, or reads `settings.plumeria.styleProp` from the ESLint config when ESLint is installed
  - `@plumeria/init` writes `--style-prop` into the build script it guards with `plumerialint` when the styling prop is renamed
  - `@plumeria/init` writes a renamed styling prop into the ESLint config as `settings.plumeria.styleProp`, so the editor checks the same prop the compiler transforms
  - `@plumeria/eslint-plugin/guard` exports `lintOverrides` in place of `spellingRules`

## 19.10.1

### Patch Changes

- 107a11a: Bump version to 19.10.1

## 19.10.0

### Minor Changes

- db560c7: - `@plumeria/next-plugin` and `@plumeria/unplugin` run `@plumeria/eslint-plugin` through oxlint alongside a production build and stop it on any error or warning, so no build script is needed
  - `@plumeria/unplugin` lints on Vite, webpack, Rspack, Rollup, Rolldown and Farm
  - `withoutLogicalProperties` and `withoutPhysicalProperties` turn on the matching lint rule in that lint
  - Add the `lint` option to `@plumeria/next-plugin` and `@plumeria/unplugin` to build without the lint
  - `expand-border-shorthands` joins the recommended rules as a warning
  - `plumerialint` runs the oxlint that `@plumeria/eslint-plugin` depends on, so oxlint needs no separate install
  - The lint runs the Plumeria rules only, not oxlint's own default rules, and passes when there is no file to lint
  - `@plumeria/eslint-plugin` depends on oxlint 1.87.0
  - `@plumeria/init` prefixes the build script with `plumerialint --` only on esbuild and Bun, and no longer installs oxlint or asks about border shorthands

## 19.9.1

### Patch Changes

- f51e812: Bump version to 19.9.1

## 19.9.0

### Minor Changes

- 353ffb0: Bump version to 19.9.0

## 19.8.2

### Patch Changes

- def91c1: - Remove the `funding` field from package.json
  - Move the test-only devDependencies of `@plumeria/compiler` to the workspace root
  - Update the `next` devDependency of `@plumeria/next-plugin` to 16.3.8

## 19.8.1

### Patch Changes

- 2dbd3fc: Bump version to 19.8.1

## 19.8.0

### Minor Changes

- 2cdf7b8: Bump version to 19.8.0

## 19.7.0

### Minor Changes

- 6f4fa61: Bump version to 19.7.0

## 19.6.2

### Patch Changes

- 82de66e: - Ask "Which spelling should lint enforce?" and rename the `both` answer to `none`
  - Remove the `--both` flag
  - Add `no-style-prop-relay`, enabled as an error in `recommended` and plumerialint, which reports a style prop that a component only passes on
  - Report function keys passed to `css.use()` in `no-unresolved-composition`

## 19.6.1

### Patch Changes

- aed69d7: Bump version to 19.6.1

## 19.6.0

### Minor Changes

- 32a9dba: Bump version to 19.6.0

## 19.5.2

### Patch Changes

- 674b065: Bump version to 19.5.2

## 19.5.1

### Patch Changes

- 037b7d9: Bump version to 19.5.1

## 19.5.0

### Minor Changes

- 0f3ea0f: Bump version to 19.5.0

## 19.4.0

### Minor Changes

- f97cb91: Bump version to 19.4.0

## 19.3.0

### Minor Changes

- aa5fc25: Bump version to 19.3.0

## 19.2.16

### Patch Changes

- 225551a: Bump version to 19.2.16

## 19.2.15

### Patch Changes

- 83fa450: Bump version to 19.2.15

## 19.2.14

### Patch Changes

- cc34f05: Bump version to 19.2.14

## 19.2.13

### Patch Changes

- da08650: Bump version to 19.2.13

## 19.2.12

### Patch Changes

- 85bb229: Bump version to 19.2.12

## 19.2.11

### Patch Changes

- cf51115: Bump version to 19.2.11

## 19.2.10

### Patch Changes

- 5f9a3b6: Bump version to 19.2.10

## 19.2.9

### Patch Changes

- 5754269: Bump version to 19.2.9

## 19.2.8

### Patch Changes

- c49a6ae: Bump version to 19.2.8

## 19.2.7

### Patch Changes

- 5015ddf: Bump version to 19.2.7

## 19.2.6

### Patch Changes

- 26ef466: Bump version to 19.2.6

## 19.2.5

### Patch Changes

- d06d7e0: Bump version to 19.2.5

## 19.2.4

### Patch Changes

- 2fcd158: Bump version to 19.2.4

## 19.2.3

### Patch Changes

- 78cdc59: Bump version to 19.2.3

## 19.2.2

### Patch Changes

- 8e49d67: Bump version to 19.2.2

## 19.2.1

### Patch Changes

- fae8ab3: Bump version to 19.2.1

## 19.2.0

### Minor Changes

- d14254c: Bump version to 19.2.0

## 19.1.10

### Patch Changes

- 83c79d5: Bump version to 19.1.10

## 19.1.9

### Patch Changes

- 5c7c7f3: Bump version to 19.1.9

## 19.1.8

### Patch Changes

- 9ad8598: Bump version to 19.1.8

## 19.1.7

### Patch Changes

- dea2ce8: Bump version to 19.1.7

## 19.1.6

### Patch Changes

- 5aec304: Bump version to 19.1.6

## 19.1.5

### Patch Changes

- 120fa3e: Bump version to 19.1.5

## 19.1.4

### Patch Changes

- 829a573: Bump version to 19.1.4

## 19.1.3

### Patch Changes

- ee9fd3d: Bump version to 19.1.3

## 19.1.2

### Patch Changes

- 4196ef2: - Feat: add `@plumeria/init`, one command that sets Plumeria up in an existing project. It is run with `npx @plumeria/init`, and installed it is `plumeria-init`, alongside `plumeria-codemod` and `plumerialint`. It detects the package manager and the bundler, installs the packages that are missing, writes `plumeria.d.ts` and the bundler config, extends the ESLint flat config, and puts `plumerialint --` in front of the `build` script.
  - Feat: ask which spelling of a two-named property the project writes and set both levels from the one answer — `withoutLogicalProperties` or `withoutPhysicalProperties` on the bundler plugin, and `no-logical-properties` or `no-physical-properties` in ESLint — so their directions cannot disagree.
  - Feat: ask whether to turn on `expand-border-shorthands`, and which JSX prop carries styles, writing a renamed prop into the plugin and into `plumeria.d.ts` at once.
  - Feat: patch an existing config rather than replace it, and extend only the `plugins` array the config object owns, so a nested one such as Vitest's `test.plugins` is never written into. Where the plugin cannot be placed safely, print the snippet and touch nothing.
  - Feat: treat a config as set up only once the plugin is called, not merely imported — a bare property read, and a call inside a comment, a string or a regex literal, all read as not set up — so an import nothing calls is completed rather than skipped, and call the binding the file already named. An import spanning several lines is read as one statement, so it is never duplicated.
  - Feat: on Next.js add `rimraf .next` before `dev` and before `build`, so a version change is not read as a compile error. A `pre` script is added only for a script the project has, and one it already wrote is left alone.
  - Feat: look for `packageManager` and the lockfile upwards from the directory init runs in, so a package inside a workspace is installed with the manager the workspace root uses.
  - Feat: mark each planned action by kind — install, write, patch, manual, skip — with `node:util`'s `styleText`, which leaves the text alone when the output is not a terminal.
  - Feat: refuse a styling prop that is not an identifier, or that React already handles, from `--style-prop` as well as from the prompt.
