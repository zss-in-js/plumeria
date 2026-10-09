# @plumeria/swc-jest

## 19.12.0

### Minor Changes

- e784644: - `no-unknown-css-properties` checks names against MDN data instead of `known-css-properties`, and reports names MDN does not document, such as the speech properties
  - The CSS types are generated from MDN data, so newer properties such as `cornerShape` complete and keywords follow each property's syntax
  - The CSS types keep the obsolete properties browsers still apply, such as `gridGap` and `fontStretch`, and drop names no browser runs, such as `voiceFamily`
  - `MsOverflowStyle` in the CSS types is now `msOverflowStyle`
  - A number for `lineClamp`, `WebkitLineClamp`, `readingOrder` and the other unitless properties is written without `px`
  - `plumeria-lint` keeps a compile cache, so it starts faster from the second run

### Patch Changes

- Updated dependencies [e784644]
  - @plumeria/compiler@19.12.0

## 19.11.0

### Minor Changes

- 21c541a: Bump version to 19.11.0

### Patch Changes

- Updated dependencies [21c541a]
  - @plumeria/compiler@19.11.0

## 19.10.4

### Patch Changes

- 2079db2: Bump version to 19.10.4
- Updated dependencies [2079db2]
  - @plumeria/compiler@19.10.4

## 19.10.3

### Patch Changes

- 0a9c2d8: Bump version to 19.10.3
- Updated dependencies [0a9c2d8]
  - @plumeria/compiler@19.10.3

## 19.10.2

### Patch Changes

- 50858a7: Bump version to 19.10.2
- Updated dependencies [50858a7]
  - @plumeria/compiler@19.10.2

## 19.10.1

### Patch Changes

- 107a11a: Bump version to 19.10.1
- Updated dependencies [107a11a]
  - @plumeria/compiler@19.10.1

## 19.10.0

### Minor Changes

- db560c7: Bump version to 19.10.0

### Patch Changes

- Updated dependencies [db560c7]
  - @plumeria/compiler@19.10.0

## 19.9.1

### Patch Changes

- f51e812: Bump version to 19.9.1
- Updated dependencies [f51e812]
  - @plumeria/compiler@19.9.1

## 19.9.0

### Minor Changes

- 353ffb0: - Add `@plumeria/swc-jest`, a Jest transformer that compiles Plumeria styles and hands the result to `@swc/jest`

### Patch Changes

- Updated dependencies [353ffb0]
  - @plumeria/compiler@19.9.0
