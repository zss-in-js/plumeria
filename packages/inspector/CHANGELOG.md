# @plumeria/inspector

## 18.0.1

### Patch Changes

- 4299382: Bump version to 18.0.1
- Updated dependencies [4299382]
  - @plumeria/headlessui@18.0.1

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
  - @plumeria/headlessui@18.0.0

## 17.0.1

### Patch Changes

- 6db8b00: Fix: add contain autocomplete keywords size inline-size layout style paint in csstypes.d.ts
  Fix: fix contain include multiple keywords and single keyword in validate-values.ts
- Updated dependencies [6db8b00]
  - @plumeria/headlessui@17.0.1

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
  - @plumeria/headlessui@17.0.0

## 16.5.0

### Minor Changes

- e0efd1c: Bump version to 16.5.0

### Patch Changes

- Updated dependencies [e0efd1c]
  - @plumeria/headlessui@16.5.0

## 16.4.2

### Patch Changes

- a994769: Bump version to 16.4.2 (fix utils/parser.ts for dynamic props edge cases)
- Updated dependencies [a994769]
  - @plumeria/headlessui@16.4.2

## 16.4.1

### Patch Changes

- ac13d67: Bump version to 16.4.1 (fix next dev mode)
- Updated dependencies [ac13d67]
  - @plumeria/headlessui@16.4.1

## 16.4.0

### Minor Changes

- 9b6ad43: Fix: inspector to subpath architecture and remove production argument

### Patch Changes

- Updated dependencies [9b6ad43]
  - @plumeria/headlessui@16.4.0

## 16.3.0

### Minor Changes

- d04bc8a: Bump version to 16.3.0 (core fixed)

### Patch Changes

- Updated dependencies [d04bc8a]
  - @plumeria/headlessui@16.3.0

## 16.2.12

### Patch Changes

- 8eb82a7: Bump version to 16.2.12 (fix throw an unknown function)
- Updated dependencies [8eb82a7]
  - @plumeria/headlessui@16.2.12

## 16.2.11

### Patch Changes

- 2f08d34: Bump version to 16.2.11
- Updated dependencies [2f08d34]
  - @plumeria/headlessui@16.2.11

## 16.2.10

### Patch Changes

- 8a93dce: Bump version to 16.2.10 (improve dev mode Incremental generation)
- Updated dependencies [8a93dce]
  - @plumeria/headlessui@16.2.10

## 16.2.9

### Patch Changes

- e71ab6f: Bump version to 16.2.9 (Update core README.md)
- Updated dependencies [e71ab6f]
  - @plumeria/headlessui@16.2.9

## 16.2.8

### Patch Changes

- 0906bc9: Bump version to 16.2.8 (@rust-gear/glob to 1.1.0)
- Updated dependencies [0906bc9]
  - @plumeria/headlessui@16.2.8

## 16.2.7

### Patch Changes

- 542859d: Bump version to 16.2.7
- Updated dependencies [542859d]
  - @plumeria/headlessui@16.2.7

## 16.2.6

### Patch Changes

- 0b56e62: Bump version to 16.2.6
- Updated dependencies [0b56e62]
  - @plumeria/headlessui@16.2.6

## 16.2.5

### Patch Changes

- 5a9f52e: bump version to 16.2.5
- Updated dependencies [5a9f52e]
  - @plumeria/headlessui@16.2.5

## 16.2.4

### Patch Changes

- 6172179: Bump version to 16.2.4
- Updated dependencies [6172179]
  - @plumeria/headlessui@16.2.4

## 16.2.3

### Patch Changes

- 9a85e20: Bump version 16.2.3
- Updated dependencies [9a85e20]
  - @plumeria/headlessui@16.2.3

## 16.2.2

### Patch Changes

- 8c10355: Fix other css supported
- Updated dependencies [8c10355]
  - @plumeria/headlessui@16.2.2

## 16.2.1

### Patch Changes

- c7a3a47: Bump version to 16.2.1 (plumerialint can now be executed in parallel)
- Updated dependencies [c7a3a47]
  - @plumeria/headlessui@16.2.1

## 16.2.0

### Minor Changes

- 1e54d3b: Bump version 16.2.0 (add validate-pseudos eslint rule)

### Patch Changes

- Updated dependencies [1e54d3b]
  - @plumeria/headlessui@16.2.0

## 16.1.1

### Patch Changes

- Updated dependencies [08c5be7]
  - @plumeria/headlessui@16.0.0
