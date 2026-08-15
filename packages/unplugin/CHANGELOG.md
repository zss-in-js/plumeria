# @plumeria/unplugin

## 18.2.13

### Patch Changes

- 13d5fd7: - Fix: a function key on a style imported from another file is compiled instead of silently dropped, in the transform and in the generated CSS alike.
  - Fix: an imported style resolves the constants, `createStatic` and `createTheme` values of the file that declares it; both function keys and static keys lost those declarations before.

- d2f5a82: - Fix: a function key on a style imported from another file is compiled instead of silently dropped, in the transform and in the generated CSS alike.
  - Fix: an imported style resolves the constants, `createStatic` and `createTheme` values of the file that declares it; both function keys and static keys lost those declarations before.

- Updated dependencies [13d5fd7]
- Updated dependencies [d2f5a82]
  - @plumeria/utils@18.2.13

## 18.2.12

### Patch Changes

- 7c32413: Bump version to 18.2.12
- Updated dependencies [7c32413]
  - @plumeria/utils@18.2.12

## 18.2.11

### Patch Changes

- 79cf605: Bump version to 18.2.11
- Updated dependencies [65e086a]
  - @plumeria/utils@18.2.11

## 18.2.10

### Patch Changes

- 05ec58a: Bump version to 18.2.10
- Updated dependencies [05ec58a]
  - @plumeria/utils@18.2.10

## 18.2.9

### Patch Changes

- cacc782: Bump version to 18.2.9
- Updated dependencies [cacc782]
  - @plumeria/utils@18.2.9

## 18.2.8

### Patch Changes

- 3f0f14b: Bump version to 18.2.8
- Updated dependencies [3f0f14b]
  - @plumeria/utils@18.2.8

## 18.2.7

### Patch Changes

- ddc0c29: Bump version to 18.2.7
- Updated dependencies [ddc0c29]
  - @plumeria/utils@18.2.7

## 18.2.6

### Patch Changes

- 055e0a1: Bump version to 18.2.6
- Updated dependencies [055e0a1]
  - @plumeria/utils@18.2.6

## 18.2.5

### Patch Changes

- fa97e3e: Bump version to 18.2.5
- Updated dependencies [fa97e3e]
  - @plumeria/utils@18.2.5

## 18.2.4

### Patch Changes

- a259fce: Fix: drop the asterisk wildcard from style prop attribution. A prop now counts as applied only inside the component that received it, so a component that merely forwards a same-named prop fails the never-applied check instead of slipping past it.

- Updated dependencies [a259fce]
  - @plumeria/utils@18.2.4

## 18.2.3

### Patch Changes

- 7641416: Fix: a style prop that is never applied fails the build instead of silently dropping the style. `classStyle={[styles.base, cond && styleArray]}` and `classStyle={cond ? styleArray : styles.base}` now compile: the styles a prop's call sites pass are carried through the condition, and a closed gate leaves the surrounding styles in place.

- Updated dependencies [7641416]
  - @plumeria/utils@18.2.3

## 18.2.2

### Patch Changes

- a2db725: Bump version to 18.2.2
- Updated dependencies [a2db725]
  - @plumeria/utils@18.2.2

## 18.2.1

### Patch Changes

- 9e8f603: Bump version to 18.2.1
- Updated dependencies [9e8f603]
  - @plumeria/utils@18.2.1

## 18.2.0

### Minor Changes

- 9becf0a: Bump version to 18.2.0

### Patch Changes

- Updated dependencies [9becf0a]
  - @plumeria/utils@18.2.0

## 18.1.9

### Patch Changes

- 73fc784: Keep a literal argument to a dynamic function key off the px fallback on a unitless property
- Updated dependencies [73fc784]
  - @plumeria/utils@18.1.9

## 18.1.8

### Patch Changes

- fa39906: Update dependencies (postcss 8.5.25, GHSA-r28c-9q8g-f849)
- Updated dependencies [fa39906]
  - @plumeria/utils@18.1.8

## 18.1.7

### Patch Changes

- f233fe1: Bump version to 18.1.7
- Updated dependencies [f233fe1]
  - @plumeria/utils@18.1.7

## 18.1.6

### Patch Changes

- 5d03b90: Fix: name the css variable of a dynamic function key after the declaration it resolves to, so two keys that share a parameter name no longer overwrite each other on one element
  Fix: set the variable for a parameter that only appears under a nested selector or an at-rule
  Fix: resolve a dynamic function key written inside a condition, instead of dropping the branch it belongs to
  Fix: read the named parameters of a destructured signature, and fold such an argument into the rule only when its value is written out in full
  Fix: report a dynamic function key that cannot reach the element, instead of emitting a call that throws at runtime
- Updated dependencies [5d03b90]
  - @plumeria/utils@18.1.6

## 18.1.5

### Patch Changes

- 9f7072b: Bump version to 18.1.5
- Updated dependencies [9f7072b]
  - @plumeria/utils@18.1.5

## 18.1.4

### Patch Changes

- 4464af6: Fix: keep the virtual css id relative so a bundler cannot print the author's directories into the stylesheet it ships
  Fix: strip the annotation naming the virtual css from the emitted stylesheet on esbuild and Bun
- Updated dependencies [4464af6]
  - @plumeria/utils@18.1.4

## 18.1.3

### Patch Changes

- 0325770: Update dependencies
- Updated dependencies [0325770]
  - @plumeria/utils@18.1.3

## 18.1.2

### Patch Changes

- b8ee5f7: Fix: tell two bracket groups apart when one condition folds both into a lookup, a key both objects carry no longer answers with the later group's style
  Fix: number a bracket dimension's keys in a compound lookup, a key holding the `__` the compound key is joined with no longer blurs where one dimension ends
- Updated dependencies [b8ee5f7]
  - @plumeria/utils@18.1.2

## 18.1.1

### Patch Changes

- 4c16d5b: Fix: merge the sources of a styling prop in the order they are written, an unconditional style placed after a condition no longer loses to it
  Fix: a condition placed after a bracket group is no longer overridden by that group
- Updated dependencies [4c16d5b]
  - @plumeria/utils@18.1.1

## 18.1.0

### Minor Changes

- 29a90d8: Feat: accept a non-literal bracket key inside a condition, `enabled ? styles[variant] : styles.disabled` no longer fails to compile
  Feat: fold an argument's mutually exclusive branches into one lookup, so nesting no longer doubles the generated table per level
  Fix: emit CSS for a bracket group reached through a condition, `enabled && styles[variant]` produced no rules at all

### Patch Changes

- Updated dependencies [29a90d8]
  - @plumeria/utils@18.1.0

## 18.0.1

### Patch Changes

- 5c34fd1: Fix: register prop styles for member expression JSX tags, `<svg.Logo classStyle={...} />` failed to compile
  Fix: resolve a component tag through the export graph so any chain depth lands on the module its leaf is declared in
  Fix: track namespace imports so `<Icons.Logo />` resolves through `import * as Icons`
  Perf: resolve the component key once per JSX element instead of once per attribute
- Updated dependencies [5c34fd1]
  - @plumeria/utils@18.0.1

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

### Patch Changes

- Updated dependencies [7664aa1]
  - @plumeria/utils@18.0.0

## 17.0.1

### Patch Changes

- 6db8b00: Fix: add contain autocomplete keywords size inline-size layout style paint in csstypes.d.ts
  Fix: fix contain include multiple keywords and single keyword in validate-values.ts
- Updated dependencies [6db8b00]
  - @plumeria/utils@17.0.1

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

### Patch Changes

- Updated dependencies [d844142]
  - @plumeria/utils@17.0.0

## 16.5.0

### Minor Changes

- e0efd1c: fix: identifier replacement now skips non-reference positions
  feat: bracket conditional expressions with dynamic and literal keys
  fix: splitCssRules standalone comment handling
  refactor: remove dead code across compiler, turbopack-loader, and unplugin

### Patch Changes

- Updated dependencies [e0efd1c]
  - @plumeria/utils@16.5.0

## 16.4.2

### Patch Changes

- a994769: Bump version to 16.4.2 (fix utils/parser.ts for dynamic props edge cases)
- Updated dependencies [a994769]
  - @plumeria/utils@16.4.2

## 16.4.1

### Patch Changes

- ac13d67: Bump version to 16.4.1 (fix next dev mode)
- Updated dependencies [ac13d67]
  - @plumeria/utils@16.4.1

## 16.4.0

### Minor Changes

- 9b6ad43: Bump version to 16.4.0 (update inspector)

### Patch Changes

- Updated dependencies [9b6ad43]
  - @plumeria/utils@16.4.0

## 16.3.0

### Minor Changes

- d04bc8a: Bump version to 16.3.0 (core fixed)

### Patch Changes

- Updated dependencies [d04bc8a]
  - @plumeria/utils@16.3.0

## 16.2.12

### Patch Changes

- 8eb82a7: Fix: throw an unknown function
- Updated dependencies [8eb82a7]
  - @plumeria/utils@16.2.12

## 16.2.11

### Patch Changes

- 2f08d34: Bump version to 16.2.11
- Updated dependencies [2f08d34]
  - @plumeria/utils@16.2.11

## 16.2.10

### Patch Changes

- 8a93dce: Bump version to 16.2.10 (improve dev mode Incremental generation)
- Updated dependencies [8a93dce]
  - @plumeria/utils@16.2.10

## 16.2.9

### Patch Changes

- e71ab6f: Bump version to 16.2.9 (Update core README.md)
- Updated dependencies [e71ab6f]
  - @plumeria/utils@16.2.9

## 16.2.8

### Patch Changes

- 0906bc9: Bump version to 16.2.8 (@rust-gear/glob to 1.1.0)
- Updated dependencies [0906bc9]
  - @plumeria/utils@16.2.8

## 16.2.7

### Patch Changes

- 542859d: Bump version to 16.2.7
- Updated dependencies [542859d]
  - @plumeria/utils@16.2.7

## 16.2.6

### Patch Changes

- 0b56e62: Fix: change the reverse edge to a safe implementation and switched the key from index to key also output the CSS prop on the parent side
- Updated dependencies [0b56e62]
  - @plumeria/utils@16.2.6

## 16.2.5

### Patch Changes

- 5a9f52e: bump version to 16.2.5
- Updated dependencies [5a9f52e]
  - @plumeria/utils@16.2.5

## 16.2.4

### Patch Changes

- 6172179: Bump version to 16.2.4
- Updated dependencies [6172179]
  - @plumeria/utils@16.2.4

## 16.2.3

### Patch Changes

- 9a85e20: Fix: add getFileDependencies and resolveExport
- Updated dependencies [9a85e20]
  - @plumeria/utils@16.2.3

## 16.2.2

### Patch Changes

- 8c10355: Bump version to 16.2.2
- Updated dependencies [8c10355]
  - @plumeria/utils@16.2.2

## 16.2.1

### Patch Changes

- c7a3a47: Bump version to 16.2.1 (plumerialint can now be executed in parallel)
- Updated dependencies [c7a3a47]
  - @plumeria/utils@16.2.1

## 16.2.0

### Minor Changes

- 1e54d3b: Bump version 16.2.0 (add validate-pseudos eslint rule)

### Patch Changes

- Updated dependencies [1e54d3b]
  - @plumeria/utils@16.2.0

## 16.1.1

### Patch Changes

- 7d73f9c: Bump version to 16.1.1 (inspector OIDC)
- Updated dependencies [7d73f9c]
  - @plumeria/utils@16.1.1

## 16.1.0

### Minor Changes

- 901ebf0: Bump version to 16.1.0 (add inspector)

### Patch Changes

- Updated dependencies [901ebf0]
  - @plumeria/utils@16.1.0

## 16.0.0

### Major Changes

- 08c5be7: Add support for dynamic props and update variants API to use optimized bracket syntax

### Patch Changes

- Updated dependencies [08c5be7]
  - @plumeria/utils@16.0.0

## 15.1.3

### Patch Changes

- f175e10: Bump version to 15.1.3
- Updated dependencies [f175e10]
  - @plumeria/utils@15.1.3

## 15.1.2

### Patch Changes

- 0e54f0e: Update dependencies
- Updated dependencies [0e54f0e]
  - @plumeria/utils@15.1.2

## 15.1.1

### Patch Changes

- 87c6f77: Fix edge case merging the className with a ternary expression
- Updated dependencies [87c6f77]
  - @plumeria/utils@15.1.1

## 15.1.0

### Minor Changes

- 2a406a5: Bump version to 15.1.0

### Patch Changes

- Updated dependencies [2a406a5]
  - @plumeria/utils@15.1.0

## 15.0.0

### Major Changes

- a235bdc: Bump version to 15.0.0

### Patch Changes

- Updated dependencies [a235bdc]
  - @plumeria/utils@15.0.0

## 14.2.1

### Patch Changes

- 565fb17: Bump version to 14.2.1
- Updated dependencies [565fb17]
  - @plumeria/utils@14.2.1

## 14.2.0

### Minor Changes

- 3c790f4: Bump version to 14.2.0

### Patch Changes

- Updated dependencies [3c790f4]
  - @plumeria/utils@14.2.0

## 14.1.2

### Patch Changes

- c0ea263: Bump version to 14.1.2
- Updated dependencies [c0ea263]
  - @plumeria/utils@14.1.2

## 14.1.1

### Patch Changes

- 6fa1869: Bump version to 14.1.1
- Updated dependencies [6fa1869]
  - @plumeria/utils@14.1.1

## 14.1.0

### Minor Changes

- 717cf1c: Bump version to 14.1.0

### Patch Changes

- Updated dependencies [717cf1c]
  - @plumeria/utils@14.1.0

## 14.0.0

### Major Changes

- 9103875: Enhance error handling for edge cases

### Patch Changes

- Updated dependencies [9103875]
  - @plumeria/utils@14.0.0

## 13.2.3

### Patch Changes

- f8bd7a0: Align the hash logic of createTheme with turbopack-loader
- Updated dependencies [f8bd7a0]
  - @plumeria/utils@13.2.3

## 13.2.2

### Patch Changes

- 7e40f03: Update dependencies in v13.2.2
- Updated dependencies [7e40f03]
  - @plumeria/utils@13.2.2

## 13.2.1

### Patch Changes

- f34661f: Bump version to 13.2.1
- Updated dependencies [f34661f]
  - @plumeria/utils@13.2.1

## 13.2.0

### Minor Changes

- 51c0d47: Bump version to 13.2.0

### Patch Changes

- Updated dependencies [51c0d47]
  - @plumeria/utils@13.2.0

## 13.1.5

### Patch Changes

- 4401cb4: Bump version to 13.1.5
- Updated dependencies [4401cb4]
  - @plumeria/utils@13.1.5

## 13.1.4

### Patch Changes

- a1caf4a: Add funding and homepage in package.json
- Updated dependencies [a1caf4a]
  - @plumeria/utils@13.1.4

## 13.1.3

### Patch Changes

- 3f7305f: Move rollup plugin utils to dependencies
- Updated dependencies [3f7305f]
  - @plumeria/utils@13.1.3

## 13.1.2

### Patch Changes

- da6941d: Bump version to 13.1.2
- Updated dependencies [da6941d]
  - @plumeria/utils@13.1.2

## 13.1.1

### Patch Changes

- 2f463a7: Bump version to 13.1.1
- Updated dependencies [2f463a7]
  - @plumeria/utils@13.1.1

## 13.1.0

### Minor Changes

- 77d7a5e: Fix HMR bug

### Patch Changes

- Updated dependencies [77d7a5e]
  - @plumeria/utils@13.1.0

## 13.0.2

### Patch Changes

- 37f0541: Bump version to 13.0.2
- Updated dependencies [37f0541]
  - @plumeria/utils@13.0.2

## 13.0.1

### Patch Changes

- 3afcccd: Fix add a colon to the regular expression
- Updated dependencies [3afcccd]
  - @plumeria/utils@13.0.1

## 13.0.0

### Major Changes

- 08751c3: Support new createTheme and robust error handling

### Patch Changes

- Updated dependencies [08751c3]
  - @plumeria/utils@13.0.0

## 12.0.8

### Patch Changes

- 51606d5: Bump version to 12.0.8
- Updated dependencies [51606d5]
  - @plumeria/utils@12.0.8

## 12.0.7

### Patch Changes

- b34c654: Update dependencies
- Updated dependencies [b34c654]
  - @plumeria/utils@12.0.7

## 12.0.6

### Patch Changes

- d435d9d: Fix a bug in the ternary operator for function keys
- Updated dependencies [d435d9d]
  - @plumeria/utils@12.0.6

## 12.0.5

### Patch Changes

- 4187423: Fix path resolution and refactoring
- Updated dependencies [4187423]
  - @plumeria/utils@12.0.5

## 12.0.4

### Patch Changes

- 4623785: Bump version to 12.0.4
- Updated dependencies [4623785]
  - @plumeria/utils@12.0.4

## 12.0.3

### Patch Changes

- 8eef799: Bump version to 12.0.3
- Updated dependencies [8eef799]
  - @plumeria/utils@12.0.3

## 12.0.2

### Patch Changes

- 9a3cd2f: Fix correct identifier resolution
- Updated dependencies [9a3cd2f]
  - @plumeria/utils@12.0.2

## 12.0.1

### Patch Changes

- c8c9f74: Bump version to 12.0.1
- Updated dependencies [c8c9f74]
  - @plumeria/utils@12.0.1

## 12.0.0

### Major Changes

- 3aba19c: Update dependencies

### Patch Changes

- Updated dependencies [3aba19c]
  - @plumeria/utils@12.0.0

## 11.2.1

### Patch Changes

- 0e9ecfd: Bump version to 11.2.1
- Updated dependencies [0e9ecfd]
  - @plumeria/utils@11.2.1

## 11.2.0

### Minor Changes

- 99f5e6f: Implementation to remove import statements

### Patch Changes

- Updated dependencies [99f5e6f]
  - @plumeria/utils@11.2.0

## 11.1.3

### Patch Changes

- a486adb: Prevent theme conflicts and stabilize HMR
- Updated dependencies [a486adb]
  - @plumeria/utils@11.1.3

## 11.1.2

### Patch Changes

- dfcda01: Bump version to 11.1.2
- Updated dependencies [dfcda01]
  - @plumeria/utils@11.1.2

## 11.1.1

### Patch Changes

- 9999562: Bump version to 11.1.1
- Updated dependencies [9999562]
  - @plumeria/utils@11.1.1

## 11.1.0

### Minor Changes

- f58f70a: Bump version to 11.1.0

### Patch Changes

- Updated dependencies [f58f70a]
  - @plumeria/utils@11.1.0

## 11.0.2

### Patch Changes

- 6f8c7da: Feat implementation dynamic key multi arguments
- Updated dependencies [6f8c7da]
  - @plumeria/utils@11.0.2

## 11.0.1

### Patch Changes

- 8426076: Bump version to 11.0.1
- Updated dependencies [8426076]
  - @plumeria/utils@11.0.1

## 11.0.0

### Major Changes

- 132dca2: Add unplugin

### Patch Changes

- Updated dependencies [132dca2]
  - @plumeria/utils@11.0.0
