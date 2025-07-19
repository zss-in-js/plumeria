# @plumeria/next

## 0.7.0

### Minor Changes

- 75ae36d: feat: Repeated devDependencies updates

## 0.6.7

### Patch Changes

- 790fa39: fix: dependencies update

## 0.6.6

### Patch Changes

- dd36811: chore(next): package dependencies update zss-engine@0.2.40

## 0.6.5

### Patch Changes

- 523997f: fix(next): RefreshOn.tsx add process.nextTick for SSR

## 0.6.4

### Patch Changes

- 7b6a433: feat: zss-engine update

## 0.6.3

### Patch Changes

- 7309528: fix: import from zss-utils changed to zss-engine

## 0.6.2

### Patch Changes

- b701464: refactor(zss-utils): patch update

## 0.6.1

### Patch Changes

- ad15df4: refactor(zss-utils): refactored core and zss-utils.

## 0.6.1

### Patch Changes

- 54a348f: feat: readme update and compile minify is production only

## 0.5.7

### Patch Changes

- 9f4d373: feat: Distribution dist/esm|cjs types

## 0.5.6

### Patch Changes

- 9190340: feat: anchor the dependencies

## 0.5.5

### Patch Changes

- 4b6eae1: fix: next security update

## 0.5.4

### Patch Changes

- 6c91a26: feat: security update

## 0.5.3

### Patch Changes

- [`92d4139`](https://github.com/zss-in-js/plumeria/commit/92d4139112cedf8cab9aefab813435a86415d194) Thanks [@refirst11](https://github.com/refirst11)! - fix: Fixed so that style does not peel off

## 0.5.2

### Patch Changes

- [`5f5c41e`](https://github.com/zss-in-js/plumeria/commit/5f5c41e2f0e9dea3e7e02c55090908e9fbada6d5) Thanks [@refirst11](https://github.com/refirst11)! - chore: npm add included dist types

## 0.5.1

### Patch Changes

- [`083c86c`](https://github.com/zss-in-js/plumeria/commit/083c86c82602be1bcbfcf62de7bf71b81467e0ba) Thanks [@refirst11](https://github.com/refirst11)! - Separation of dist and types was complicated to manage, so we rolled it back.

## 0.5.0

### Minor Changes

- [`3333425`](https://github.com/zss-in-js/plumeria/commit/333342500841e5466eaeff0418801174ca9fc42a) Thanks [@refirst11](https://github.com/refirst11)! - Fixed: Type definition file was not included.

## 0.4.2

### Patch Changes

- [`966a794`](https://github.com/zss-in-js/plumeria/commit/966a7945cc571c92179602f467ce4f9b042b3c41) Thanks [@refirst11](https://github.com/refirst11)! - feat: build imporve and add sourceMap

## 0.4.1

### Patch Changes

- [`d8e7fce`](https://github.com/zss-in-js/plumeria/commit/d8e7fceca6f03221c09d00bc3bf36757ae71e63e) Thanks [@refirst11](https://github.com/refirst11)! - fix: Minify has been discontinued for security reasons.

## 0.4.0

### Minor Changes

- feat: support dual package

## 0.3.0

### Minor Changes

- b95b458: fix: ServerCSS rendering has been significantly improved.  
  By adding key={serverCSS} to client components that return null, router.refresh() is now reliably executed when the style changes.

## 0.2.6

### Patch Changes

- a6d6606: fix: fix needed a first refresh

## 0.2.5

### Patch Changes

- f183acc: fix: fix 404 rendering loop

## 0.2.4

### Patch Changes

- fe3a7f9: Fixed an issue where server component styles were missing when updating client styles

## 0.2.3

### Patch Changes

- b50c2d6: fix: first mount refresh

## 0.2.2

### Patch Changes

- 8d74431: fix: refresh with link transition

## 0.2.1

### Patch Changes

- 991941c: Fix: Important fix. Fixed refresh loop when using devtools on server components with link click and style update.

## 0.2.0

### Minor Changes

- b0b4e4f: fix: supports hot reloading
