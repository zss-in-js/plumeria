# @plumeria/headlessui

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

- 050be48: Bump version to 18.2.15

## 18.2.14

### Patch Changes

- 6ee1a20: Bump version to 18.2.14

## 18.2.13

### Patch Changes

- d2f5a82: Bump version to 18.2.13
- 13d5fd7: Bump version to 18.2.13

## 18.2.12

### Patch Changes

- 7c32413: Bump version to 18.2.12

## 18.2.11

### Patch Changes

- 79cf605: Bump version to 18.2.11

## 18.2.10

### Patch Changes

- 05ec58a: Bump version to 18.2.10

## 18.2.9

### Patch Changes

- cacc782: Bump version to 18.2.9

## 18.2.8

### Patch Changes

- 3f0f14b: Bump version to 18.2.8

## 18.2.7

### Patch Changes

- ddc0c29: Bump version to 18.2.7

## 18.2.6

### Patch Changes

- 055e0a1: Bump version to 18.2.6

## 18.2.5

### Patch Changes

- fa97e3e: Bump version to 18.2.5

## 18.2.4

### Patch Changes

- a259fce: Bump version to 18.2.4

## 18.2.3

### Patch Changes

- 7641416: Bump version to 18.2.3

## 18.2.2

### Patch Changes

- a2db725: Update dependencies

## 18.2.1

### Patch Changes

- 9e8f603: Bump version to 18.2.1

## 18.2.0

### Minor Changes

- 9becf0a: Bump version to 18.2.0

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

- 5c34fd1: Bump version to 18.0.1

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

- e0efd1c: Bump version to 16.5.0

## 16.4.2

### Patch Changes

- a994769: Bump version to 16.4.2 (fix utils/parser.ts for dynamic props edge cases)

## 16.4.1

### Patch Changes

- ac13d67: Bump version to 16.4.1 (fix next dev mode)

## 16.4.0

### Minor Changes

- 9b6ad43: Bump version to 16.4.0 (update inspector)

## 16.3.0

### Minor Changes

- d04bc8a: Bump version to 16.3.0 (core fixed)

## 16.2.12

### Patch Changes

- 8eb82a7: Bump version to 16.2.12 (fix throw an unknown function)

## 16.2.11

### Patch Changes

- 2f08d34: Bump version to 16.2.11

## 16.2.10

### Patch Changes

- 8a93dce: Bump version to 16.2.10 (improve dev mode Incremental generation)

## 16.2.9

### Patch Changes

- e71ab6f: Bump version to 16.2.9 (Update core README.md)

## 16.2.8

### Patch Changes

- 0906bc9: Bump version to 16.2.8 (@rust-gear/glob to 1.1.0)

## 16.2.7

### Patch Changes

- 542859d: Bump version to 16.2.7

## 16.2.6

### Patch Changes

- 0b56e62: Bump version to 16.2.6

## 16.2.5

### Patch Changes

- 5a9f52e: bump version to 16.2.5

## 16.2.4

### Patch Changes

- 6172179: Bump version to 16.2.4

## 16.2.3

### Patch Changes

- 9a85e20: Bump version 16.2.3

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

- 08c5be7: Bump version to 16.0.0

## 15.1.3

### Patch Changes

- f175e10: Bump version to 15.1.3

## 15.1.2

### Patch Changes

- 0e54f0e: Update dependencies

## 15.1.1

### Patch Changes

- 87c6f77: Bump version to 15.1.1

## 15.1.0

### Minor Changes

- 2a406a5: Bump version to 15.1.0

## 15.0.0

### Major Changes

- a235bdc: Add 14 headless components and updates to switch them from a flat structure to a chained component format

## 14.2.1

### Patch Changes

- 565fb17: headlessui: refactor export in index.ts and sideEffects false in package.json

## 14.2.0

### Minor Changes

- 3c790f4: Add headlessui package
