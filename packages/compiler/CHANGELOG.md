# @plumeria/compiler

## 0.21.4

### Patch Changes

- 4f62e15: chore: version bump only

## 0.21.3

### Patch Changes

- 642bb90: chore: version bump only

## 0.21.2

### Patch Changes

- 2a29782: chore: version bump only

## 0.21.1

### Patch Changes

- c42f4d2: chore: version bump only

## 0.21.0

### Minor Changes

- 27aada1: fix: the rules for conditional expressions were improved in the previous version 0.20.2, so they will be unified in 0.21.0

## 0.20.4

### Patch Changes

- eb1ed30: chore: version bump only

## 0.20.3

### Patch Changes

- b7d1745: chore: version bump only

## 0.20.2

### Patch Changes

- b3127eb: fix: when using conditional styles, the base style's properties are now compiled without determining the property winner

## 0.20.1

### Patch Changes

- 9b3e149: feat: node start-up changed to rscute/register and add enableCompileCache

## 0.20.0

### Minor Changes

- f1e481b: feat: version bump only

## 0.19.4

### Patch Changes

- 890aaba: feat: version bump only

## 0.19.3

### Patch Changes

- b6e33cf: feat: version bump only

## 0.19.2

### Patch Changes

- 6ab60c8: chore: version bump only

## 0.19.1

### Patch Changes

- f5eb6c7: feat: version bump only

## 0.19.0

### Minor Changes

- cebdf21: feat: updated compiler to recognize css.viewTransition

## 0.18.4

### Patch Changes

- ade4bc0: fix: support for specifying pnpm monorepo version

## 0.18.3

### Patch Changes

- 2972a8e: feat: version bump only

## 0.18.2

### Patch Changes

- 7e50c6c: refactor: removed the ability to directly handle css.global

## 0.18.1

### Patch Changes

- a64f808: fix: workspace to correspond

## 0.18.0

### Minor Changes

- c4e611e: feat: improved so that each api can be written in a file and compiled

## 0.17.1

### Patch Changes

- c674990: fix: support pnpm monorepo

## 0.17.0

### Minor Changes

- 302a649: feat: Compatible with Astro
- e77b35a: feat: rollback to 0.15.7

### Patch Changes

- d92cee8: feat: version bump only

## 0.16.2

### Patch Changes

- b533471: feat: version bump only

## 0.16.1

### Patch Changes

- 6eef17b: feat: version bump only

## 0.16.0

### Minor Changes

- 2525858: feat: Compatible with Astro

## 0.15.7

### Patch Changes

- 82a7b0f: feat: version bump only

## 0.15.6

### Patch Changes

- 820285f: feat: version bump only

## 0.15.5

### Patch Changes

- d86a7c0: feat: version bump only

## 0.15.4

### Patch Changes

- 488a916: feat: version bump only

## 0.15.3

### Patch Changes

- 878c4e0: feat: version bump only

## 0.15.2

### Patch Changes

- cdc620e: fix: version bump only

## 0.15.1

### Patch Changes

- edea0d1: fix(release): version bump only

## 0.15.0

### Minor Changes

- 1d65473: feat: support static string literal variables

## 0.14.9

### Patch Changes

- e8ade69: fix: vulnerability fixes

## 0.14.8

### Patch Changes

- cfd67b3: fix(compiler/extract.ts): Fixed to pick up Vue attributes

## 0.14.7

### Patch Changes

- d51fb5b: feat(compiler/extract.ts): Skip processing of strings and HTML tags

Fixed an issue where unnecessary ts files were generated in vue and svelte.

## 0.14.6

### Patch Changes

- 1b6b4eb: feat: dependencies update

## 0.14.1

### Patch Changes

- 7b74c68: fix: fix and improved props extraction

## 0.14.0

### Minor Changes

- bded796: feat: Props are now compiled, so only the CSS you use is generated.

## 0.13.0

### Minor Changes

- d7dcf5d: feat(core, compiler): atomicize create function

Change:

- Added post-processing in postcss rule to merge media selectors.

Impact:

- This helps to keep CSS bundle sizes small.

## 0.12.0

### Minor Changes

- b273ff1: feat: Returns the className directly with the dollar sign

## 0.11.0

### Minor Changes

- 7edce11: feat: API specification change: and compiler updated

## 0.10.0

### Minor Changes

- fdf46bd: feat(Along with the core): Semi-circular reference errors have been improved and are now stable.

## 0.9.6

### Patch Changes

- ae454ea: feat(compiler): Make the string beginning with "create" the compile target

## 0.9.5

### Patch Changes

- b58c9ae: fix(compiler): --paths flag to relative path return

## 0.9.4

### Patch Changes

- 084b875: features: Patch update. replace fast-glob with @rust-gear/glob
  0.9.1~0.9.3 were unpublished because the exclude node_modules was mistakenly deleted.

## 0.9.0

### Minor Changes

- 7cfea3f: features: Minor update
  - Rename stylesheet/core.css to stylesheet.css
  - Major API changes: defineThemeVars split into defineVars and defineTheme
  - Stronger type safety for utility(media, eg.) return types
  - Added all color completions to color.\*\*\*
  - API type definitions are now public
  - Files have been combined to simplify the architecture

## 0.8.12

### Patch Changes

- 4929e2a: Fixed an important bugfix. Fixed the specification that rscute is hoisted when @types/node is not >= 22.13.11, and deleted peerDeps of rscute.

## 0.8.11

### Patch Changes

- e4b1bf8: feat: readme update and compile minify is production only

## 0.8.10

### Patch Changes

- e134ee2: fix(compiler): swc react.runtime automatic

## 0.8.9

### Patch Changes

- 8e9236a: feat(compiler): Supports react-router-v7

## 0.8.8

### Patch Changes

- 6e3ff2f: fix(compiler): Fixed that the order was not correct.
  update: migrating to rscute 0.2.4.

## 0.8.6

### Patch Changes

- ebba36c: feat: The executor has been changed from **rscute** to **jttx**.
  It will be stable for a while because we changed from using the Function constructor to executing it using the Node.js internal API.

## 0.8.5

### Patch Changes

- 68c8aff feat: **Postcss** and **lightningcss** processing have been added to the compiler **post-processing**.
  It is **not enabled in 0.8.4.**

## 0.8.4

### Patch Changes

- 39008ba: feat: AST parser is **TypeScript** to **SWC** and add **postcss** and **lightningcss**

- arguments update:
  `--log` is changed to **`--view`**

- new args: **`--paths`**  
  this is outputs a list of paths to files that describe styles.

## 0.8.3

### Patch Changes

- 92c5bde: feat(compiler): update rscute version 0.1.7

## 0.7.0

### Minor Changes

- bb78745: feat: executor change to rscute

## 0.6.5

### Patch Changes

- 28eff48: fix: test fix
- 722b3cc: fix: rscute update

## 0.6.4

### Patch Changes

- 05f2693: fix: dependencies rscute update

## 0.6.3

### Patch Changes

- 9f4d373: feat: Distribution dist/esm|cjs types

## 0.6.2

### Patch Changes

- a4f3c50: feat: compiler: faster log timing core: dependencies and fix

## 0.6.1

### Patch Changes

- 6c91a26: feat: security update

## 0.6.0

### Minor Changes

- [`2444545`](https://github.com/zss-in-js/plumeria/commit/24445452ba8f54a038ccd3d08c80056cacd92d7f) Thanks [@refirst11](https://github.com/refirst11)! - feat: Now separated from core. @plumeria/compiler needs to be installed as npx css command if you use @plumeria/core.

## 0.5.1

### Patch Changes

- [`1548726`](https://github.com/zss-in-js/plumeria/commit/1548726ea81f757728d25285a07bbd59c8c8dd9f) Thanks [@refirst11](https://github.com/refirst11)! - fix: resolve pnpm path

## 0.5.0

### Minor Changes

- feat: change import path due to dual package

## 0.4.0

### Minor Changes

The experimental implementations of 0.2.0 and 0.3.0 have been reverted to 0.4.0, which was based on the stable 0.1.2 implementation.

## 0.3.0

### Minor Changes

Our experimental attempt to install the compiler separately proved unstable and we have rolled back to relying on core.

## 0.2.0

### Minor Changes

- [`77a1928`](https://github.com/zss-in-js/plumeria/commit/77a192824d7c7c011a97ae62d160eba215e0e065) Thanks [@refirst11](https://github.com/refirst11)! - feat: Moved bin responsibilities to the compiler

## 0.1.2

### Patch Changes

- b98a06f: chore: globby to fast-glob

## 0.1.1

### Patch Changes

- fafccc7: fixup pnpm compile
