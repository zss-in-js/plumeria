# @plumeria/compiler

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
