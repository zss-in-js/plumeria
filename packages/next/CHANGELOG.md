# @plumeria/next

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
