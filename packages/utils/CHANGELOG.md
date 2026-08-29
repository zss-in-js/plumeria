# @plumeria/utils

## 18.3.7

### Patch Changes

- b867ab2: Fix: a theme variable written with a fallback, or nested inside another variable's fallback, was not recognised as used, so its declaration never reached the sheet and the value fell back for want of anything to read. The name is now read up to where the fallback begins, rather than up to a closing parenthesis that may belong to an inner `var()`.

## 18.3.6

### Patch Changes

- 5c48f91: - Fix: a `css.keyframes` or `css.viewTransition` binding read inside a template literal or a concatenation lost the `kf-` / `vt-` prefix its own name carries, so the value named a rule that was never emitted and an `animation` shorthand built that way animated nothing. The binding now reads the same wherever it is read.
  - Fix: a reference sitting in the middle of a value, as an `animation` shorthand holds one, is now found when collecting the rules a sheet needs, instead of only when it is the whole value.

## 18.3.5

### Patch Changes

- eb4fb7e: - Fix: a `css.createTheme` selector written as anything other than a string literal — a template literal, or a name the file declares — was read as an empty selector, which dropped the theme's whole rule and left the styles pointing at custom properties nothing declared. The selector is now resolved the same way a style value is, so a name or a `createStatic` entry works, and two themes that differ only by selector stay apart.
  - Fix: a selector that still cannot be read at build time is now reported where it is written, instead of compiling to no CSS at all.

## 18.3.4

### Patch Changes

- 91c1796: - Fix: editing only the selector passed to `css.createTheme` left the rule under the old selector setting the same custom properties, because their names were hashed from the value alone and never from the selector. The selector is now part of the hash, so the rule left behind declares variables of its own and stops competing with the new one.
  - Fix: `@plumeria/utils` hashes a `createTheme` declaration the same way in the scan pass as in the transform, which had left the selector out of the scan pass alone.

## 18.3.3

### Patch Changes

- 79812c2: Bump version to 18.3.3

## 18.3.2

### Patch Changes

- a524e7a: Bump version to 18.3.2

## 18.3.1

### Patch Changes

- 64c033e: - Update: README.md

## 18.3.0

### Minor Changes

- 8449a58: Bump version to 18.3.0

## 18.2.34

### Patch Changes

- f3794bd: Bump version to 18.2.34

## 18.2.33

### Patch Changes

- 903ea85: Bump version to 18.2.33

## 18.2.32

### Patch Changes

- 72b0f67: Bump version to 18.2.32

## 18.2.31

### Patch Changes

- bffb1cd: Bump version to 18.2.31

## 18.2.30

### Patch Changes

- f4ba436: Bump version to 18.2.30

## 18.2.29

### Patch Changes

- e87798c: Bump version to 18.2.29

## 18.2.28

### Patch Changes

- 8a62e49: Bump version to 18.2.28

## 18.2.27

### Patch Changes

- e184f05: Bump version to 18.2.27

## 18.2.26

### Patch Changes

- 9f53ed0: - Fix: two components declared in one file that receive a style through the same prop name shared one lookup table, so the second rendered with the first one's keys and reached the element with no class at all. Each component now reads the table it owns, in the bundler plugins and in the generated stylesheet alike.
  - Fix: a style function's parameter default was read as neither a default nor a name, so `(c = 'red') => ({ color: c })` produced an empty class even when an argument was passed. A default now compiles to the CSS variable's fallback, so `box()` and `box('blue')` share one class and only the second writes an inline style.
  - Fix: a style function that takes no parameter resolved to nothing when it was called, so `() => ({ color: 'red' })` left the styling prop off the element entirely. It now compiles to the class its static equivalent would.
  - Fix: a style key that is only digits was dropped without a word. `css.create({ 1: { color: 'red' } })` is now reported, the way `@plumeria/no-invalid-selector` already reported it; a quoted `'1'` and a name carrying digits are unaffected.
  - Fix: a style key holding a quote or a backslash was written into the run-time lookup table unescaped, which made the compiled module invalid JavaScript.
  - Fix: `css.use()` with no arguments, and `css.use()` on a style that cannot be resolved, survived into the output after the `@plumeria/core` import had already been removed, leaving a module that throws on load. The first compiles to an empty class and the second is reported.
  - Fix: `css.keyframes()` with no argument aborted the transform with an internal error instead of being skipped, the way `create()` and `viewTransition()` already are.
  - Update: the style prop table is read by the owning component's key rather than scanned, so a project with many components generates its stylesheet faster — 44ms against 83ms on a 400-component benchmark.

## 18.2.25

### Patch Changes

- 0b45a2d: Update dependencies

## 18.2.24

### Patch Changes

- e8067fc: Bump version to 18.2.24

## 18.2.23

### Patch Changes

- 14ac9f0: Bump version to 18.2.23

## 18.2.22

### Patch Changes

- 1da7747: Bump version to 18.2.22

## 18.2.21

### Patch Changes

- ad35eaa: Bump version to 18.2.21

## 18.2.20

### Patch Changes

- a1c9e4b: Bump version to 18.2.20

## 18.2.19

### Patch Changes

- 69b7897: Bump version to 18.2.19

## 18.2.18

### Patch Changes

- e2018e9: Bump version to 18.2.18

## 18.2.17

### Patch Changes

- e8950f2: Bump version to 18.2.17

## 18.2.16

### Patch Changes

- 172eeaa: Bump version to 18.2.16

## 18.2.15

### Patch Changes

- 050be48: - Feat: two states that can hold at once, such as `:hover` and `:focus`, now settle their intersection by composition order. The atom from the style written further right in `classStyle` receives one more `:not(#\#)` and becomes a class of its own, so reversing the array reverses the winner and the module the bundler reached first no longer decides. Only a pair that is otherwise indistinguishable is weighted; a differing at-rule, shorthand depth or selector specificity is left alone, and an explicit compound such as `:hover:focus` stays above the weighting.

## 18.2.14

### Patch Changes

- 6ee1a20: Bump version to 18.2.14

## 18.2.13

### Patch Changes

- 13d5fd7: - Fix: a function key on a style imported from another file is compiled instead of silently dropped, in the transform and in the generated CSS alike.
  - Fix: an imported style resolves the constants, `createStatic` and `createTheme` values of the file that declares it; both function keys and static keys lost those declarations before.

- d2f5a82: - Fix: a function key on a style imported from another file is compiled instead of silently dropped, in the transform and in the generated CSS alike.
  - Fix: an imported style resolves the constants, `createStatic` and `createTheme` values of the file that declares it; both function keys and static keys lost those declarations before.

## 18.2.12

### Patch Changes

- 7c32413: Bump version to 18.2.12

## 18.2.11

### Patch Changes

- 65e086a: - Fix: `@plumeria/utils` places a conditional at-rule after every condition that contains it while optimizing, so the narrower condition wins everywhere both apply.
  - Fix: `zss-engine@2.5.0` reads a condition as the interval it matches, so implication is recognized across `min-`/`max-` prefixes, comparison and two-sided forms, and `and` chains, on `width`, `height`, `inline-size` and `block-size`, for `@container` alongside `@media`.

  Note: two conditions that overlap without either containing the other, such as `600px`–`900px` against `700px`–`1000px`, are still decided by source order.

## 18.2.10

### Patch Changes

- 05ec58a: Bump version to 18.2.10

## 18.2.9

### Patch Changes

- cacc782: - Fix: `@plumeria/compiler` sorts the file list it globs, so the stylesheet is emitted in the same order on every machine. The scan pass is sorted as well.
  - Feat: `@plumeria/eslint-plugin` adds `no-physical-properties` and `no-logical-properties`, which keep a project on one spelling of the properties that carry both a logical and a physical name. `{ sizes }`, `false` by default, extends them to `width`, `height`, their `min`/`max` forms, `overflow-x` and `overflow-y`. Neither is part of `recommended`.

## 18.2.8

### Patch Changes

- 3f0f14b: - Feat: `@plumeria/eslint-plugin` adds `no-order-dependent-overlap`, which reports two properties written in one style that overlap while neither one outranks the other: one property under its logical and its physical name, or two shorthands that cross, such as `borderTop` beside `borderBlockWidth`. Suggestions only, no autofix. `warn` in `recommended`.
  - Fix: `zss-engine@2.4.3` registers `corner-shape` and the eight corner longhands it sets, which carried no depth at all, and exports the shorthand graph the rule ranks pairs from.

  Note: an alias pair carries a suggestion for each side and the rule has no autofix. Removing one half of a crossing pair would drop the values the other half never set, and the two spellings of an alias pair are the same property only in a horizontal writing mode, so neither edit is safe to apply in bulk.

  Note: the corner longhands now receive one `:not(#\#)` where they received none. Class names are unaffected.

## 18.2.7

### Patch Changes

- ddc0c29: - Fix: `@plumeria/core` exposes `overflowInline` instead of `overflowBlockX` — the logical counterpart of `overflow-x` is `overflow-inline`, and CSS has no `overflow-block-x`.
  - Fix: `zss-engine@2.4.2` aligns the shorthand graph with the logical property groups: the physical edges now sit below the axis shorthand that sets them across `margin`, `padding`, `inset`, `scroll-margin`, `scroll-padding` and the `border` axes, `overflow` and `overscroll-behavior` gain their missing logical longhands, and `containIntrinsicSize`, `positionTry`, `marker`, `cue`, `pause` and `rest` are registered as shorthands.

  Note: these depths decide how many `:not(#\#)` selectors an atomic class receives, so the generated stylesheet changes for the properties listed above. Class names are unaffected.

## 18.2.6

### Patch Changes

- 055e0a1: Fix: `@plumeria/utils` gives a nested selector inside a conditional rule both the nested and the condition depth, so `@media { ':hover': ... }` outranks a bare `':hover'` regardless of stylesheet order. Custom properties stay exempt and receive no depth.

  Fix: `@plumeria/utils` moves conditional at-rules (`@media`, `@container`, `@supports`, `@layer`, `@scope`) after base rules while optimizing, so a conditional declaration wins over a base declaration of equal specificity. `@keyframes` is left where it is.

## 18.2.5

### Patch Changes

- fa97e3e: Fix: `@plumeria/utils` preserves shorthand and longhand declarations as independent atoms, and merges identical selectors and at-rules without reordering them during optimization.

  Fix: `@plumeria/turbopack-loader` optimizes its accumulated development virtual stylesheet, so duplicate selectors and at-rules are merged consistently.

  Fix: `zss-engine@2.4.1` removes the override-longhand behavior: a longhand written above a shorthand is no longer crushed by it, and declarations merge the same way regardless of order. No effect under the ESLint `recommended` rules.

  Fix: logical longhand properties receive specificity from their depth in the shorthand graph — `padding-block-start` gets two `:not(#\#)` selectors in base styles and three inside conditional rules.

  Update: base and conditional priority is controlled by specificity instead of moving media queries to the end of the stylesheet, so development and production behave the same.

## 18.2.4

### Patch Changes

- a259fce: Bump version to 18.2.4

## 18.2.3

### Patch Changes

- 7641416: Bump version to 18.2.3

## 18.2.2

### Patch Changes

- a2db725: Bump version to 18.2.2

## 18.2.1

### Patch Changes

- 9e8f603: Bump version to 18.2.1

## 18.2.0

### Minor Changes

- 9becf0a: Feat: accept functional pseudo-classes in `css.marker` / `css.extended`
  The generated marker variable now carries a hash, so its name changes

## 18.1.9

### Patch Changes

- 73fc784: Bump version to 18.1.9

## 18.1.8

### Patch Changes

- fa39906: Update dependencies (postcss 8.5.25, GHSA-r28c-9q8g-f849)

## 18.1.7

### Patch Changes

- f233fe1: Bump version to 18.1.7

## 18.1.6

### Patch Changes

- 5d03b90: Bump version to 18.1.6

## 18.1.5

### Patch Changes

- 9f7072b: Bump version to 18.1.5

## 18.1.4

### Patch Changes

- 4464af6: Bump version to 18.1.4

## 18.1.3

### Patch Changes

- 0325770: Update dependencies

## 18.1.2

### Patch Changes

- b8ee5f7: Bump version to 18.1.2

## 18.1.1

### Patch Changes

- 4c16d5b: Bump version to 18.1.1

## 18.1.0

### Minor Changes

- 29a90d8: Bump version to 18.1.0

## 18.0.1

### Patch Changes

- 5c34fd1: Fix: register prop styles for member expression JSX tags, `<svg.Logo classStyle={...} />` failed to compile
  Fix: resolve a component tag through the export graph so any chain depth lands on the module its leaf is declared in
  Fix: track namespace imports so `<Icons.Logo />` resolves through `import * as Icons`
  Perf: resolve the component key once per JSX element instead of once per attribute

## 18.0.0

### Major Changes

- 7664aa1: Bump version to 18.0.0
  - feat: add @plumeria/codemod for renaming the styling prop across a codebase
  - fix: read styleProp in no-inline-object, it matched styleName only
  - fix: name the configured prop in the css.use() dynamic style error
  - break: rename the default styling prop from styleName to classStyle
  - break: rename the @plumeria/core/style-name subpath to @plumeria/core/class-style
  - break: rename the styleName prop on @plumeria/headlessui components to classStyle
  - break: rename the no-inline-object messageId to noInlineObjectInStyleProp

## 17.0.1

### Patch Changes

- 6db8b00: Fix: add contain autocomplete keywords size inline-size layout style paint in csstypes.d.ts
  Fix: fix contain include multiple keywords and single keyword in validate-values.ts

## 17.0.0

### Major Changes

- d844142: Bump version to 17.0.0
  - feat: generate the production stylesheet from the loader, PostCSS is no longer required
  - feat: add styleProp, include and exclude options to the loader
  - feat: add styleProp option to unplugin and to the lint rules
  - feat: rename lint rule style-name-requires-import to props-require-import
  - fix: stop collecting prop styles from host elements
  - perf: apply Turbopack rule conditions on Next.js 16 and above
  - perf: skip discarded conversions in the first scanning pass
  - break: @plumeria/core no longer declares a styling prop, reference @plumeria/core/style-name
  - break: rename the StyleName type to Style
  - break: remove @plumeria/postcss-plugin

## 16.5.0

### Minor Changes

- e0efd1c: fix: identifier replacement now skips non-reference positions
  feat: bracket conditional expressions with dynamic and literal keys
  fix: splitCssRules standalone comment handling
  refactor: remove dead code across compiler, turbopack-loader, and unplugin

## 16.4.2

### Patch Changes

- a994769: Fix: fix error occurring with dynamic props

## 16.4.1

### Patch Changes

- ac13d67: Fix: parser.ts remove dead code and utils/optimizer.ts add orderMediaLast and isMediaRule

## 16.4.0

### Minor Changes

- 9b6ad43: Bump version to 16.4.0 (update inspector)

## 16.3.0

### Minor Changes

- d04bc8a: Bump version to 16.3.0 (core fixed)

## 16.2.12

### Patch Changes

- 8eb82a7: Feat: export getRootIdentifier

## 16.2.11

### Patch Changes

- 2f08d34: Fix: extend overrideLonghand scope to pseudo-selectors

## 16.2.10

### Patch Changes

- 8a93dce: Fix: incremental generation HMR and initial startup in dev mode

## 16.2.9

### Patch Changes

- e71ab6f: Bump version to 16.2.9 (Update core README.md)

## 16.2.8

### Patch Changes

- 0906bc9: Update @rust-gear/glob to v1.1.0

## 16.2.7

### Patch Changes

- 542859d: Perf: update dependencies code

## 16.2.6

### Patch Changes

- 0b56e62: Fix: change index to key hash(classString) in parser.ts

## 16.2.5

### Patch Changes

- 5a9f52e: bump version to 16.2.5

## 16.2.4

### Patch Changes

- 6172179: Bump version to 16.2.4

## 16.2.3

### Patch Changes

- 9a85e20: Fix dependencies graph and re export

## 16.2.2

### Patch Changes

- 8c10355: Bump version to 16.2.2

## 16.2.1

### Patch Changes

- c7a3a47: Bump version to 16.2.1 (plumerialint can now be executed in parallel)

## 16.2.0

### Minor Changes

- 1e54d3b: Bump version 16.2.0 (add validate-pseudos eslint rule)

## 16.1.1

### Patch Changes

- 7d73f9c: Bump version to 16.1.1 (inspector OIDC)

## 16.1.0

### Minor Changes

- 901ebf0: Bump version to 16.1.0 (add inspector)

## 16.0.0

### Major Changes

- 08c5be7: Feat dynamic props parsing and add helper types for component props

## 15.1.3

### Patch Changes

- f175e10: Bump version to 15.1.3

## 15.1.2

### Patch Changes

- 0e54f0e: Update dependencies

## 15.1.1

### Patch Changes

- 87c6f77: Refactor 2 pass comment in parser.ts with tested as parser.test.ts

## 15.1.0

### Minor Changes

- 2a406a5: Added operators for modulo, exponentiation, and bitwise operations, and modified the code to skip operators such as typeof

## 15.0.0

### Major Changes

- a235bdc: Bump version to 15.0.0

## 14.2.1

### Patch Changes

- 565fb17: Bump version to 14.2.1

## 14.2.0

### Minor Changes

- 3c790f4: Bump version to 14.2.0

## 14.1.2

### Patch Changes

- c0ea263: Fix variants.ts dead code

## 14.1.1

### Patch Changes

- 6fa1869: Bump version to 14.1.1

## 14.1.0

### Minor Changes

- 717cf1c: Support basic arithmetic operations

## 14.0.0

### Major Changes

- 9103875: Bump version to 14.0.0

## 13.2.3

### Patch Changes

- f8bd7a0: Bump version to 13.2.3

## 13.2.2

### Patch Changes

- 7e40f03: Update dependencies in v13.2.2

## 13.2.1

### Patch Changes

- f34661f: Bump version to 13.2.1

## 13.2.0

### Minor Changes

- 51c0d47: Bump version to 13.2.0

## 13.1.5

### Patch Changes

- 4401cb4: Bump version to 13.1.5

## 13.1.4

### Patch Changes

- a1caf4a: Bump version to 13.1.4

## 13.1.3

### Patch Changes

- 3f7305f: Update dependencies

## 13.1.2

### Patch Changes

- da6941d: Bump version to 13.1.2

## 13.1.1

### Patch Changes

- 2f463a7: Bump version to 13.1.1

## 13.1.0

### Minor Changes

- 77d7a5e: Bump version to 13.1.0

## 13.0.2

### Patch Changes

- 37f0541: Bump version to 13.0.2

## 13.0.1

### Patch Changes

- 3afcccd: Fix atomize createTheme

## 13.0.0

### Major Changes

- 08751c3: Support new createTheme

## 12.0.8

### Patch Changes

- 51606d5: Fix lightningcss target browser and fix resolver.ts

## 12.0.7

### Patch Changes

- b34c654: Update dependencies

## 12.0.6

### Patch Changes

- d435d9d: Optimize scanAll in parser.ts

## 12.0.5

### Patch Changes

- 4187423: Bump version to 12.0.5

## 12.0.4

### Patch Changes

- 4623785: Bump version to 12.0.4

## 12.0.3

### Patch Changes

- 8eef799: Bump version to 12.0.3

## 12.0.2

### Patch Changes

- 9a3cd2f: Remove dev cache time

## 12.0.1

### Patch Changes

- c8c9f74: Bump version to 12.0.1

## 12.0.0

### Major Changes

- 3aba19c: Update dependencies

## 11.2.1

### Patch Changes

- 0e9ecfd: Bump version to 11.2.1

## 11.2.0

### Minor Changes

- 99f5e6f: Bump version to 11.2.0

## 11.1.3

### Patch Changes

- a486adb: Prevent theme conflicts and stabilize HMR

## 11.1.2

### Patch Changes

- dfcda01: Support shorthand syntax for key functions

## 11.1.1

### Patch Changes

- 9999562: Bump version to 11.1.1

## 11.1.0

### Minor Changes

- f58f70a: Bump version to 11.1.0

## 11.0.2

### Patch Changes

- 6f8c7da: Bump version to 11.0.2

## 11.0.1

### Patch Changes

- 8426076: Bump version to 11.0.1

## 11.0.0

### Major Changes

- 132dca2: Add unplugin

## 10.5.3

### Patch Changes

- 3284759: Bump version to 10.5.3

## 10.5.2

### Patch Changes

- 4e3de0d: Bump version to 10.5.2

## 10.5.1

### Patch Changes

- 55676de: Bump version to 10.5.1

## 10.5.0

### Minor Changes

- 0b0c8a2: Refactor and update test covered

## 10.4.3

### Patch Changes

- 81ce26f: Bump version to 10.4.3

## 10.4.2

### Patch Changes

- 8504232: Bump version to 10.4.2

## 10.4.1

### Patch Changes

- 4a005a8: Bump version to 10.4.1

## 10.4.0

### Minor Changes

- a8b1341: Bump version to 10.4.0

## 10.3.3

### Patch Changes

- afaabb2: Bump version to 10.3.3

## 10.3.2

### Patch Changes

- fc6207f: Bump version to 10.3.2

## 10.3.1

### Patch Changes

- b29e9ce: Bump version to 10.3.1

## 10.3.0

### Minor Changes

- d32898a: Bump version to 10.3.0

## 10.2.3

### Patch Changes

- 897f3db: Update dependencies

## 10.2.2

### Patch Changes

- c70029e: Update dependencies

## 10.2.1

### Patch Changes

- 298f7c3: Bump version to 10.2.1

## 10.2.0

### Minor Changes

- 15a14a3: Bump version to 10.2.0

## 10.1.3

### Patch Changes

- 8575eb7: Bump version to 10.1.3

## 10.1.2

### Patch Changes

- 714e373: Bump version to 10.1.2

## 10.1.1

### Patch Changes

- bbea0c5: Bump version to 10.1.1

## 10.1.0

### Minor Changes

- 779a5e5: Bump version to 10.1.0

## 10.0.8

### Patch Changes

- 935daf3: Implementation on-demand structure

## 10.0.7

### Patch Changes

- 704bb2f: Refactor types definition

## 10.0.6

### Patch Changes

- 4184dc6: Update dependencies

## 10.0.5

### Patch Changes

- daa3cb7: feat: bump version 10.0.5

## 10.0.4

### Patch Changes

- c5c044b: Update dependencies

## 10.0.3

### Patch Changes

- 4eaf65a: chore: core package.json keywords revival

## 10.0.2

### Patch Changes

- 182bf79: chore: remove syntax error throw

## 10.0.1

### Patch Changes

- 672f7ec: fix: parser.ts error handling

## 10.0.0

### Major Changes

- e061d02: feat: bump major v10

## 9.1.2

### Patch Changes

- ca447f0: Update dependencies (zss-engine, @rust-gear/glob)

## 9.1.1

### Patch Changes

- 078f8ed: chore: bump version to 9.1.1

## 9.1.0

### Minor Changes

- 8ae0f82: chore: bump version to 9.1.0

## 9.0.4

### Patch Changes

- 97f8d00: chore: bump version to 9.0.4

## 9.0.3

### Patch Changes

- 5d754b3: chore: bump version to 9.0.3

## 9.0.2

### Patch Changes

- f0a390e: chore: bump version to 9.0.2

## 9.0.1

### Patch Changes

- 91d80e1: chore: bump version to 9.0.1

## 9.0.0

### Major Changes

- cc0312e: feat: css.props to css.use (breaking change)

## 8.0.3

### Patch Changes

- a436d6d: perf: migrate file scanning from fs.globSync to @rust-gear/glob and implement short-duration caching for scanAll

## 8.0.2

### Patch Changes

- 0379e3d: chore bump version 8.0.2

## 8.0.1

### Patch Changes

- bd72f31: chore: bump version to 8.0.1

## 8.0.0

### Major Changes

- 82b9bbc: chore: bump version to 8.0.0

## 7.6.1

### Patch Changes

- 48d0e8d: chore: bupm version to 7.6.1

## 7.6.0

### Minor Changes

- 614dd91: chore: bump version to 7.6.0

## 7.5.5

### Patch Changes

- a3e7271: chore: bump version to 7.5.5

## 7.5.4

### Patch Changes

- 9128428: chore: bump version to 7.5.4

## 7.5.3

### Patch Changes

- 788106f: chore: bump version to 7.5.3

## 7.5.2

### Patch Changes

- f38f719: refactor: improved memory and disk performance

## 7.5.1

### Patch Changes

- 11faa19: chore: bump version to 7.5.1

## 7.5.0

### Minor Changes

- 25003f3: fix: optimizer minify for production only

## 7.4.2

### Patch Changes

- 749fe8e: chore: bump version to 7.4.2

## 7.4.1

### Patch Changes

- 743e7ca: chore: bump version to 7.4.1

## 7.4.0

### Minor Changes

- 923c2aa: chore: bump version to 7.4.0

## 7.3.8

### Patch Changes

- e3933e1: chore: bump version to 7.3.8

## 7.3.7

### Patch Changes

- 3e2a4ab: chore: bump verion to 7.3.7

## 7.3.6

### Patch Changes

- 5472ffd: chore: bump version to 7.3.6

## 7.3.5

### Patch Changes

- b89a56b: chore: bump version to 7.3.5

## 7.3.4

### Patch Changes

- 0536734: chore: bump version to 7.3.4

## 7.3.3

### Patch Changes

- 73f4cba: chore: bump version to 7.3.3

## 7.3.2

### Patch Changes

- 23f8a93: chore: bump version to 7.3.2

## 7.3.1

### Patch Changes

- 8dbc46b: fix: marker selector merge use deepMerge

## 7.3.0

### Minor Changes

- cda0816: fix: createTheme style gen has been ondemand

## 7.2.4

### Patch Changes

- b5faa6e: chore: bump verion to 7.2.4

## 7.2.3

### Patch Changes

- dfd2dac: chore: bump version 7.2.3

## 7.2.2

### Patch Changes

- 868d5ab: chore: bump version 7.2.2

## 7.2.1

### Patch Changes

- 3c5776b: chore: bump version to 7.2.1

## 7.2.0

### Minor Changes

- c562899: refactor: update scanAll and variants

## 7.1.2

### Patch Changes

- 83ecc33: chore: bump version to 7.1.2

## 7.1.1

### Patch Changes

- fb385a8: chore: zss-engine v2.2.4 update

## 7.1.0

### Minor Changes

- 7e4cff1: feat: variant.ts processVariants

## 7.0.2

### Patch Changes

- b1a1ef0: chore: next security update

## 7.0.1

### Patch Changes

- 1d16d33: chore: bump version to 7.0.1

## 7.0.0

### Major Changes

- 2dc194c: feat: new api marker and extended

## 6.3.2

### Patch Changes

- 59705b6: chore: bump version to 6.3.2

## 6.3.1

### Patch Changes

- 0fdf28f: fix: Fixed issue where keyframes were not inlined in edge cases such as cross-files

## 6.3.0

### Minor Changes

- de2046a: fix: fix createTheme export HMR logic and compiling

## 6.2.1

### Patch Changes

- b14bc9d: fix: createStatic and createTheme expand even with export

## 6.2.0

### Minor Changes

- 19b0e55: feat: treat pseudos as atomic, combinators are semantic

## 6.1.2

### Patch Changes

- 7318647: chore: bump version to v6.1.2

## 6.1.1

### Patch Changes

- c8e0d8a: chore: The timing of local tables and import tables is handled in the same process with scanAll

## 6.1.0

### Minor Changes

- d52839e: feat: support namespace import

## 6.0.2

### Patch Changes

- 44f3bba: chore: bump version to 6.0.2

## 6.0.1

### Patch Changes

- 918302c: chore: fix Patch 6.0.1 conditional style merging

## 6.0.0

### Major Changes

- f1d353d: feat: added variants and create tables, the loader will completely wipe them when collected and extracted.

## 5.0.1

### Patch Changes

- 9e60b5b: fix: fixed HMR restoring from the cache table failed.

## 5.0.0

### Major Changes

- a64bc0c: perf: The core is now ESM-only, and no longer supports cjs syntax calls.

## 4.2.1

### Patch Changes

- 27431e6: fix: parser and compiler and plugin resolving exported value

## 4.2.0

### Minor Changes

- 73a6ec7: perf: scan for incremental loading

## 4.1.3

### Patch Changes

- 2f1cbb8: chore: bump version to 4.1.3

## 4.1.2

### Patch Changes

- 2c12ea9: chore: bump version to 4.1.2

## 4.1.1

### Patch Changes

- d46b8ee: chore: bump version to v4.1.1

## 4.1.0

### Minor Changes

- df9ee80: feat: Add deepMerge function and use it in loader and plugin

## 4.0.5

### Patch Changes

- ecbeff7: chore: security dev dependencies update

## 4.0.4

### Patch Changes

- 647c06e: chore: bump version to 4.0.4

## 4.0.3

### Patch Changes

- 9aaef89: chore: bump version to 4.0.3

## 4.0.2

### Patch Changes

- 648c0fc: chore: bump version to 4.0.2 update readme

## 4.0.1

### Patch Changes

- 5a1fe9d: chore: bump version to 4.0.1 with postcss-plugin OIDC

## 4.0.0

### Major Changes

- d66d398: feat: compiler has been changed program and other plugin bugfix

## 3.1.0

### Minor Changes

- 3fb4cd5: feat: Add type t.isConditionalExpression

## 3.0.1

### Patch Changes

- 8d36854: chore: refactor bump version to v3.0.1

## 3.0.0

### Major Changes

- 2d7407d: feat: The API handling has been replaced by this and each bundler plugin.

## 2.4.2

### Patch Changes

- 5bf878d: fix: bump version to 2.4.2

## 2.4.1

### Patch Changes

- 81be627: chore: bump version v2.4.1

## 2.4.0

### Minor Changes

- e1a8a72: fix: Fixed pseudo selector edge case handling and updated hash algorithm implementation to 64-bit.

## 2.3.0

### Minor Changes

- e3f9a0b: refactor: fix removed unused assertion and parameter name

## 2.2.4

### Patch Changes

- da87281: fix: improvements pseudo handling no longer loses to flat longhand

## 2.2.3

### Patch Changes

- be8a7b8: refactor: arg name object changed to rule

## 2.2.2

### Patch Changes

- 3af2dee: refactor: variable names have been shortened

## 2.2.1

### Patch Changes

- 1061552: chore: Removed unnecessary object check in transform

## 2.2.0

### Minor Changes

- 509257d: feat: version bump only

## 2.1.2

### Patch Changes

- e4a9d77: chore: version bump only

## 2.1.1

### Patch Changes

- 6bd7444: chore: version bump only

## 2.1.0

### Minor Changes

- b12b015: chore: version bump only

## 2.0.3

### Patch Changes

- 9082944: chore(deps): bump zss-engine to 1.2.1

## 2.0.2

### Patch Changes

- fd9442f: Improve package.json metadata across all packages
  - Add homepage field pointing plumeria.dev
  - Add sideEffects: false for better tree-shaking
  - Update descriptions and repository information

## 2.0.1

### Patch Changes

- 84dd781: fix: merging properties in media(container) queries

## 2.0.0

### Major Changes

- ad4a53c: feat: Rename "defineConsts" to "createStatic" and "defineTokens" to "createTheme" and Fixed edge cases in nested pseudo-selector processing

## 1.0.4

### Patch Changes

- b6bb1ca: fix: Increase the query priority by 1

## 1.0.3

### Patch Changes

- be61359: Security patch: Updated Next.js dependency to address a recently disclosed CVE

## 1.0.2

### Patch Changes

- 862dfb6: chore: version bump

## 1.0.1

### Patch Changes

- 2f2b717: chore: version bump

## 1.0.0

### Major Changes

- b241d7d: chore: release v1.0.0
