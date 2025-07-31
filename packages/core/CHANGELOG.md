# @plumeria/core

## 0.14.10

### Patch Changes

- 22cf86e: fix: types rollback changed from brand type to normal object type, compatible with inline style.

## 0.14.9

### Patch Changes

- 07eff3d: fix: Fixed to inject each style individually

## 0.14.8

### Patch Changes

- 5a2b9e0: feat: Upgrade to match the compiler

## 0.14.7

### Patch Changes

- ddff105: fix: dependencies update
- 567a381: fix(core/processors/css.ts): buildCreate to buildProps

## 0.14.6

### Patch Changes

- 1b6b4eb: feat: dependencies update

large fixes: comprehensively updated the list of integers that are not converted to px.  
This version 0.14.6 is considered LTS.

## 0.14.5

### Patch Changes

- 0aa07e8: refactor: fix atom duplication without post-processing

#### dev mode injection bug

Fixed an issue where media queries would not go below when the same atom was used above and below.

## 0.14.4

### Patch Changes

- 9debd82: fix: mini fix console --view unnecesary line and rx argment now takes className

## 0.14.3

### Patch Changes

- ddb2346: fix: dependencies update

## 0.14.2

### Patch Changes

- 41fe37c: feat: readme update

## 0.14.1

### Patch Changes

- 586de84: fix: generate atoms in media

## 0.14.0

### Minor Changes

- bded796: feat: Props are now compiled, so only the CSS you use is generated.

## 0.13.8

### Patch Changes

- cc91683: feat: README.md update

## 0.13.7

### Patch Changes

- 6fb1843: fix(deps): add px exception list: dependencies update.

These are lists that contain numbers as type number but are not converted to pixels.

```ts
const exception = [
  'animation-iteration-count',
  'column-count',
  'columns',
  'fill-opacity',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flood-opacity',
  'font-size-adjust',
  'font-weight',
  'grid-column',
  'grid-column-end',
  'grid-column-start',
  'grid-row',
  'grid-row-end',
  'grid-row-start',
  'initial-letter',
  'line-height',
  'opacity',
  'order',
  'orphans',
  'scale',
  'shape-image-threshold',
  'stop-opacity',
  'stroke-opacity',
  'tab-size',
  'widows',
  'z-index',
  'zoom',
];
```

## 0.13.6

### Patch Changes

- 2fdfae5: fix: Fixed an issue in 0.13.4 and below where flat atom classes in media queries would conflict with regular atom classes.

This was resolved by hashing media as an object.

```ts
const hashInput = parentAtRule
  ? { [parentAtRule]: singlePropObj }
  : singlePropObj;
const atomicHash = genBase36Hash(hashInput, 1, 8);
```

## 0.13.5

### Patch Changes

- 5182354: fix: Fixed a bug where global atoms were generated even when there were only media atoms

## 0.13.4

### Patch Changes

- 1d079e6: fix(core/create.ts): Improved output without post-processing

## 0.13.3

### Patch Changes

- 310e0ff: fix: console output remove unnecessary lines

## 0.13.2

### Patch Changes

- b937df7: fix: Fixed a small console output bug and fixed atomic hash to 8 characters.

## 0.13.1

### Patch Changes

- ee2911e: feat(core): add AtomicClass property and value for hover completion

## 0.13.0

### Minor Changes

- d7dcf5d: feat(core, compiler): atomicize create function

Background:
The main create function had a large impact on CSS size.
This was atomized to make it easier to scale.

Change:

- Fixed create() into distinct atomicize styles:

Impact:

- Atomization of the main create function minimizes linear growth of CSS bundles

When using a class name in has is where, you can use it dynamically by cutting the variable as follows.

```ts
// Object that summarizes color styles
const colorStyles = css.create({
  primaryText: {
    color: 'pink',
    [css.media.maxWidth(765)]: {
      color: 'skyblue',
    },
  },
});

// Use has() to change the font size of elements that have primaryText
const layoutStyles = css.create({
  highlightedSection: {
    [ps.fn.has(colorStyles.$primaryText)]: {
      fontSize: 24,
    },
  },
});
```

## 0.12.1

### Patch Changes

- 4b8c0ef: feat: readme update

## 0.12.0

### Minor Changes

- b273ff1: feat: Returns the className directly with the dollar sign

## 0.11.5

### Patch Changes

- f87d9a0: fix: Fixed an issue where nested selector types in ReturnType<T> were collapsed by completion.

## 0.11.4

### Patch Changes

- e8a9b4c: fix(core/src): change to named export and import

## 0.11.3

### Patch Changes

- 8773ffe: fix(core): Removed tsdown comments from npm bundle

## 0.11.2

### Patch Changes

- 4e5a7f0: refactor(core): refactored readme and source

## 0.11.1

### Patch Changes

- 72fad7e: fix(core): readme update eslint description add no-destructure rule

## 0.11.0

### Minor Changes

- 7edce11: feat: API specification change: and compiler updated

## 0.10.5

### Patch Changes

- d7bf9ff: fix(core): css.ts fix createComposite arg type

## 0.10.4

### Patch Changes

- 57cca0e: fix(cx.ts): use new Set do not output the same value

## 0.10.3

### Patch Changes

- ffcd871: fix: bugfix included license

## 0.10.1

### Patch Changes

- b60c70b: fix(core): Change color is back to a css class and readme fixed

## 0.10.0

### Minor Changes

- cda35e6: feat(core): 0.10.0: pseudo(ps) and color are now separated from their CSS classes.

## 0.9.10

### Patch Changes

- 29fb635: fix(core package.json): fix typo processors import field

## 0.9.9

### Patch Changes

- 091fac1: feat(core): new API add css.createComposite()

## 0.9.8

### Patch Changes

- d590cdd: feat(core): add defineConsts API and README update
  The create function type has been modified to add readonly.

## 0.9.7

### Patch Changes

- e7d4390: fix: core README.md update

## 0.9.6

### Patch Changes

- ac4f76c: feat: readme and package description update

## 0.9.5

### Patch Changes

- fcbe1a7: feat(dependencies): update zss-utils use tsdown

## 0.9.4

### Patch Changes

- 9116bee: fix: fix vendor prefix output

## 0.9.3

### Patch Changes

- 2ad93c8: fix: defineVars and defineTheme return type

## 0.9.2

### Patch Changes

- a31ea4d: fix: update readme and description and sourceMap false

## 0.9.1

### Patch Changes

- 6721df4: fix(Minor patch): 0.9.0 has already been released, so I uploaded a patch and released it.

## 0.9.0

### Minor Changes

- 7cfea3f: features: Minor update

  - Rename stylesheet/core.css to stylesheet.css
  - Major API changes: defineThemeVars split into defineVars and defineTheme
  - Stronger type safety for utility(media, eg.) return types
  - Added all color completions to color.\*\*\*
  - API type definitions are now public
  - Files have been combined to simplify the architecture

## 0.8.14

### Patch Changes

- 32e6073: fix(README): update colors to color

## 0.8.13

### Patch Changes

- 586ec10: feat: Returned responsibility from zss-utils.

## 0.8.12

### Patch Changes

- ad15df4: refactor(zss-utils): refactored core and zss-utils.

## 0.8.11

### Patch Changes

- 54a348f: feat: readme update and compile minify is production only

## 0.8.10

### Patch Changes

- bb6b0c0: feat: In the compiler swc settings, set react.runtime to automatic.

## 0.8.8

### Patch Changes

- a2f9318: feat(peerDependencies): Changed the compiler and went back to rscute 0.2.4 from jttx.  
  Now you can start it with node -r, so there is no need to search for the rscute path, and it is now stable.

## 0.8.6

### Patch Changes

- 7b6fa8b: feat(peerDependencies): Please use a compiler that uses stable jttx from 0.8.6 onwards.

## 0.8.5

### Patch Changes

- c58a297: feat: postcss and lightningcss are now available

## 0.8.4

### Patch Changes

- 3b2c862: feat: Postcss and lightningcss processing have been added to the compiler post-processing. The AST parser has been changed from TypeScript to SWC, making it faster.

## 0.8.3

### Patch Changes

- 32568e0: fix(core): fix readme and update compiler perDependencies

## 0.8.2

### Patch Changes

- fix: mini fix readme.md update

## 0.8.1

### Patch Changes

- fix: mini fix readme.md update

## 0.8.0

### Minor Changes

- refactor: Dependencies have been packaged into zss-utils.
  In 0.8.0 the API was made public (zss-utils), which includes the backend
  as zss-engine and is a bridge library that provides the API.

## 0.7.20

### Patch Changes

- 448074b: feat(docs): readme.md updated

## 0.7.19

### Patch Changes

- 6749af3: Fixed: prevent errors from occurring with image extensions, css extensions, etc.

## 0.7.11

### Patch Changes

- 3b9ce1a: fix: fix vite production environment

## 0.7.10

### Patch Changes

- d57e057: feat: replaced @plumeria/collection with style-preset

## 0.7.9

### Patch Changes

- e7be3d3: feat: @plumeria/core LTS. To the rust base swc compiler

## 0.7.8

### Patch Changes

- 9f4d373: feat: Distribution dist/esm|cjs types
- Updated dependencies [9f4d373]
  - @plumeria/collection@0.5.2

## 0.7.7

### Patch Changes

- a4f3c50: feat: compiler: faster log timing core: dependencies and fix

## 0.7.6

### Patch Changes

- Updated dependencies [3be50fe]
  - @plumeria/collection@0.5.1

## 0.7.5

### Patch Changes

- Updated dependencies [8f12aff]
  - @plumeria/collection@0.5.0

## 0.7.4

### Patch Changes

- ceac330: feat: readme add lint key rule and add package.json author.

## 0.7.3

### Patch Changes

- 4d397b6: feat: readme update

## 0.7.2

### Patch Changes

- 8f69b3a: feat: update zss-engine@0.2.15

## 0.7.1

### Patch Changes

- 9190340: feat: anchor the dependencies

## 0.7.0

### Minor Changes

- 99edcc7: feat: rx for react dynamic state

## 0.6.9

### Patch Changes

- 6c91a26: feat: security update
- Updated dependencies [6c91a26]
  - @plumeria/collection@0.4.1

## 0.6.8

### Patch Changes

- [`20bb089`](https://github.com/zss-in-js/plumeria/commit/20bb0898ab15fdb8c355285e0c3e9835c37d2aa4) Thanks [@refirst11](https://github.com/refirst11)! - feat: PseudoElementType has been added to types in zss-engine@0.2.8

## 0.6.7

### Patch Changes

- [`ef0eec2`](https://github.com/zss-in-js/plumeria/commit/ef0eec2dd540bbc6451899e909f1297d9b16a43c) Thanks [@refirst11](https://github.com/refirst11)! - feat: dependencies update zss-engine@0.2.7

## 0.6.6

### Patch Changes

- Updated dependencies [[`d8cec99`](https://github.com/zss-in-js/plumeria/commit/d8cec995d5cf180e91fa823390dd3c3154aeddde)]:
  - @plumeria/collection@0.4.0

## 0.6.5

### Patch Changes

- [`083c86c`](https://github.com/zss-in-js/plumeria/commit/083c86c82602be1bcbfcf62de7bf71b81467e0ba) Thanks [@refirst11](https://github.com/refirst11)! - Separation of dist and types was complicated to manage, so we rolled it back.

- Updated dependencies [[`083c86c`](https://github.com/zss-in-js/plumeria/commit/083c86c82602be1bcbfcf62de7bf71b81467e0ba)]:
  - @plumeria/collection@0.3.1

## 0.6.4

### Patch Changes

- Updated dependencies [[`3333425`](https://github.com/zss-in-js/plumeria/commit/333342500841e5466eaeff0418801174ca9fc42a)]:
  - @plumeria/collection@0.3.0

## 0.6.3

### Patch Changes

- [`966a794`](https://github.com/zss-in-js/plumeria/commit/966a7945cc571c92179602f467ce4f9b042b3c41) Thanks [@refirst11](https://github.com/refirst11)! - feat: build imporve and add sourceMap

- Updated dependencies [[`966a794`](https://github.com/zss-in-js/plumeria/commit/966a7945cc571c92179602f467ce4f9b042b3c41)]:
  - @plumeria/collection@0.2.2

## 0.6.2

### Patch Changes

- [`d8e7fce`](https://github.com/zss-in-js/plumeria/commit/d8e7fceca6f03221c09d00bc3bf36757ae71e63e) Thanks [@refirst11](https://github.com/refirst11)! - fix: Minify has been discontinued for security reasons.

- Updated dependencies [[`d8e7fce`](https://github.com/zss-in-js/plumeria/commit/d8e7fceca6f03221c09d00bc3bf36757ae71e63e)]:
  - @plumeria/collection@0.2.1

## 0.6.1

### Patch Changes

- [`ee8d212`](https://github.com/zss-in-js/plumeria/commit/ee8d212096f17fb18070fb98f47df834fed9f1eb) Thanks [@refirst11](https://github.com/refirst11)! - feat: zss-engine to v0.2.5

## 0.6.0

### Minor Changes

- [`a80c383`](https://github.com/zss-in-js/plumeria/commit/a80c383f7510648d2f764f83d91910a7471a9071) Thanks [@refirst11](https://github.com/refirst11)! - feat: Moved bin responsibilities to the compiler and made the compiler independent of dependencies, allowing for gradual adoption.

## 0.5.1

### Patch Changes

- Updated dependencies [[`1548726`](https://github.com/zss-in-js/plumeria/commit/1548726ea81f757728d25285a07bbd59c8c8dd9f)]:
  - @plumeria/compiler@0.5.1

## 0.5.0

### Minor Changes

- feat: support dual package

### Patch Changes

- Updated dependencies []:
  - @plumeria/compiler@0.5.0
  - @plumeria/collection@0.2.0

## 0.4.0

### Minor Changes

- [`10e3f64`](https://github.com/zss-in-js/plumeria/commit/10e3f642fd0c4983256f2a1c45adbf64bd9af2dc) Thanks [@refirst11](https://github.com/refirst11)! - feat: release v0.4.0 restoring stable implementation from v0.2.5.The experimental changes in v0.3.0 are being reverted in favor of the proven stable implementation from v0.2.5, now released as v0.4.0.

## 0.3.1

### Patch Changes

- [`a0ee1fc`](https://github.com/zss-in-js/plumeria/commit/a0ee1fc48e232197003656b33090a199ed0ae4d6) Thanks [@refirst11](https://github.com/refirst11)! - fix: revert compiler has been restored to its dependencies

## 0.3.0

### Minor Changes

- [`0473b77`](https://github.com/zss-in-js/plumeria/commit/0473b77b013284b64a909d585ab5f5b3080dc97a) Thanks [@refirst11](https://github.com/refirst11)! - feat: The @plumeria/compiler has been separated from its @plumeria/core dependencies.

## 0.2.5

### Patch Changes

- a08ff12: chore(package): globby to fast-glob

## 0.2.4

### Patch Changes

- 54bc23c: Added support for AndString syntax in mediaQuery

## 0.2.3

### Patch Changes

- 26839d2: fix: removed non-null assertion in defineThemeVars
- Updated dependencies [c165e69]
  - @plumeria/collection@0.1.2

## 0.2.2

### Patch Changes

- 5a1fc0a: fix: move path inside the function. A bug in vite has been fixed.

## 0.2.1

### Patch Changes

- 88ecf6c: update: zss-engine 0.2.2

## 0.2.0

### Minor Changes

- da443f6: feat: ServerCSS move to @plumeria/next

## 0.1.3

### Patch Changes

- e34ce8c: fix: missing not include styles folder

## 0.1.2

### Patch Changes

- 0c739b4: fix: number definition

## 0.1.1

### Patch Changes

- fafccc7: fixup pnpm bin
- Updated dependencies [fafccc7]
  - @plumeria/compiler@0.1.1
