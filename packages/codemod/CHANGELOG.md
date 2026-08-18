# @plumeria/codemod

## 18.2.21

### Patch Changes

- ad35eaa: - Feat: a style read with a key named by a constant — `styles[size]` where `size` is a `const` holding a string, in the same file or imported from another — is resolved to the class it names instead of being reported, and a constant left naming nothing is removed with it.
  - Fix: `migrate --from css-modules` writes a restored read with the name the import carries, so a composed array, a `css.use` call, and a local holding a style survive a file whose module was renamed on the way back.

## 18.2.20

### Patch Changes

- a1c9e4b: - Fix: `migrate --from plumeria` reproduces the order a `classStyle` array composes in, by ordering the generated rules to satisfy every call site, collapsing an unconditional array into one class that `composes` its members, and giving a call site that still disagrees an override class carrying only the disputed declarations.
  - Fix: a file the plan cannot export is left in Plumeria together with every file it reads definitions from, so a partial migration no longer leaves source that does not compile.
  - Fix: negative values, `css.use`, a token read outside a style, a style arriving through a prop, and a `classStyle` on an element that already carries `className` are all converted instead of being reported or rewritten by halves.
  - Fix: the generated import is written with the other imports rather than where the `css.create` stood, and the block appended to `global.css` is replaced on a re-run instead of appended again.
  - Fix: `migrate --from css-modules` points a consumer at where the module actually landed, restores a composed array, a `css.use` call, and a function style call, and keeps one name per module when a file reads several.
  - Fix: a style read with a computed key is reported rather than exported, because the class it names is not known until it runs.

## 18.2.19

### Patch Changes

- 69b7897: - Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.
  - Fix: import specifiers are resolved through `tsconfig.json` `paths`, directory `index` files, and filenames that carry a dot, so a definition reached under an alias is found instead of reported as dynamic.
  - Feat: `css.createStatic` values imported from another file are inlined into the generated CSS, and the import is removed only when nothing outside the exported styles still reads it.
  - Feat: `css.marker` and `css.extended` are expanded into the custom property and the `@container style()` rule they compile to.
  - Feat: several `css.create` calls in one file are written to one stylesheet, renaming a key an earlier call already claimed and repointing its usages.
  - Feat: a file that only defines styles is left untouched and its consumers are pointed at the generated `*.module.css`, matching how `--from css-modules` leaves the original stylesheet in place.

## 18.2.18

### Patch Changes

- e2018e9: - Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.

## 18.2.17

### Patch Changes

- e8950f2: - Update: README.md and documentation describe using `--dry-run` to preview a CSS Modules migration without writing files.

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

- a2db725: Update: README.md

## 18.2.1

### Patch Changes

- 9e8f603: Feat: migrate a CSS Modules stylesheet with `migrate --from css-modules`

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
