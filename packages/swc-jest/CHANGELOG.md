# @plumeria/swc-jest

## 21.0.0

### Major Changes

- f462d48: - Update: `css.viewTransition` is renamed to `css.viewTransitionClass`, and its rules select the returned class, as in `::view-transition-old(*.vt-…)`, so it can be given to the `default`, `enter`, `exit`, `update` and `share` props of React's `<ViewTransition>` or set with `viewTransitionClass` in `css.create`
  - Feat: a `css.viewTransitionClass` is emitted when it is used in one of those `<ViewTransition>` props, including both sides of a condition and the values of a type map, as well as when it is used in `css.create`
  - Update: a name from `css.keyframes`, `css.viewTransitionClass`, `css.positionTry` or `css.varType` is written where it is read, and its declaration is dropped as with `css.createTheme`, so no definition is left in the bundle
  - Feat: reading a Plumeria definition through a namespace import, by member, string key, destructuring, a rest element or the namespace as a whole, is a compile error that asks for a named import
  - Feat: the `rename-api` codemod renames an API across a codebase, as in `npx @plumeria/codemod rename-api viewTransition viewTransitionClass`
  - Update: the ESLint rules that read `css.viewTransition` read `css.viewTransitionClass`

### Patch Changes

- Updated dependencies [f462d48]
  - @plumeria/compiler@21.0.0

## 20.0.0

### Major Changes

- 1bf429a: - Feat: `css.positionTry` defines an `@position-try` rule and returns its dashed name, and emits the rule only when the name is used in a value
  - Feat: `@starting-style` is accepted as a key in `css.create`, so an element can transition in from its starting values
  - Update: `@layer` and `@scope` are no longer accepted as keys in `css.create` or as a `createTheme` selector, because a layered or scoped style is not decided by composition order; `validate-at-rules` reports them
  - Feat: `no-unknown-css-properties` reports properties that `@position-try` does not accept inside `css.positionTry`
  - Feat: the rules that read styles in `css.keyframes` and `css.viewTransition` also read `css.positionTry`, and `no-mutable-binding`, `no-destructure` and `no-inner-call` cover it
  - Update: `sort-properties` places the anchor positioning properties right after `position`
  - Fix: the export codemod writes a lone `classStyle` condition that can be false, such as `open && styles.x`, as `(open && styles.x) || undefined`, since `className` does not take `false`, and the adopt codemod reads it back into `classStyle`

### Patch Changes

- Updated dependencies [1bf429a]
  - @plumeria/compiler@20.0.0

## 19.15.0

### Minor Changes

- 2a4673f: - Feat: `css.varType` defines a typed custom property and returns its name, and emits its `@property` only when the name is used in a key or value
  - Feat: `css.varType` reports an `@property` the browser cannot parse, such as a quote in `syntax` or an `initialValue` of another type, at its definition instead of breaking the whole stylesheet
  - Feat: `validate-values` checks a `css.varType` `initialValue` against its `syntax`, and reports font-relative units, container units and `var()`, which the browser drops
  - Feat: `no-mutable-binding`, `no-destructure` and `no-inner-call` cover `css.varType`

### Patch Changes

- Updated dependencies [2a4673f]
  - @plumeria/compiler@19.15.0

## 19.14.4

### Patch Changes

- 1e59337: Bump version to 19.14.4
- Updated dependencies [1e59337]
  - @plumeria/compiler@19.14.4

## 19.14.3

### Patch Changes

- e3f505f: Bump version to 19.14.3
- Updated dependencies [6e9ed5d]
  - @plumeria/compiler@19.14.3

## 19.14.2

### Patch Changes

- df92992: Bump version to 19.14.2
- Updated dependencies [57dfbc9]
  - @plumeria/compiler@19.14.2

## 19.14.1

### Patch Changes

- 28cb676: Bump version to 19.14.1
- Updated dependencies [8c70c05]
  - @plumeria/compiler@19.14.1

## 19.14.0

### Minor Changes

- 4ef2f4d: Bump version to 19.14.0

### Patch Changes

- Updated dependencies [4ef2f4d]
  - @plumeria/compiler@19.14.0

## 19.13.0

### Minor Changes

- ba9260a: - Fix: A `next build` that reuses `.next` emits Plumeria's styles, so `.next` no longer has to be removed before each build
  - Fix: `next dev` compiles its stylesheet the same way as `next build`, so styles split across modules resolve the same in both
  - Fix: Editing a style in `next dev` no longer leaves rules from earlier edits or earlier dev sessions behind, and keeps the previous rules until every module has updated so the page does not flicker
  - Fix: A syntax error in an imported style file no longer leaves the importing page broken in `next dev` after the file is fixed
  - Fix: A dynamic key written as a string literal, such as `sizeStyles['small']`, compiles to the class name instead of a lookup table
  - Fix: The unplugin compiles each module's CSS from the source it transformed, so a file whose name contains glob syntax such as `!` or `[slug]`, and a module with no file on disk, get their styles
  - Feat: `compileCSS` takes `sources` to compile a given source in place of the file on disk, and `files` to compile a given list of files without a glob
  - Perf: `compileCSS` reuses the CSS of unchanged files between runs
  - Refactor: `transformSource` no longer collects stylesheets, and `collectOndemandSheets` and `sheets` are removed; every plugin builds its CSS through `compileCSS`
  - Update: Turbopack builds require Next.js 16.0.3 or later

### Patch Changes

- Updated dependencies [ba9260a]
  - @plumeria/compiler@19.13.0

## 19.12.1

### Patch Changes

- 8b7fc9e: Bump version to 19.12.1
- Updated dependencies [8b7fc9e]
  - @plumeria/compiler@19.12.1

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
