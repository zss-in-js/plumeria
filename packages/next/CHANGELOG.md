# @plumeria/next

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
