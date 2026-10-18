---
'@plumeria/core': major
'@plumeria/compiler': major
'@plumeria/utils': major
'@plumeria/eslint-plugin': major
'@plumeria/codemod': major
'@plumeria/swc-jest': major
'@plumeria/turbopack-loader': major
'@plumeria/unplugin': major
---

- Feat: `css.positionTry` defines an `@position-try` rule and returns its dashed name, and emits the rule only when the name is used in a value
- Feat: `@starting-style` is accepted as a key in `css.create`, so an element can transition in from its starting values
- Update: `@layer` and `@scope` are no longer accepted as keys in `css.create` or as a `createTheme` selector, because a layered or scoped style is not decided by composition order; `validate-at-rules` reports them
- Feat: `no-unknown-css-properties` reports properties that `@position-try` does not accept inside `css.positionTry`
- Feat: the rules that read styles in `css.keyframes` and `css.viewTransition` also read `css.positionTry`, and `no-mutable-binding`, `no-destructure` and `no-inner-call` cover it
- Update: `sort-properties` places the anchor positioning properties right after `position`
- Fix: the export codemod writes a lone `classStyle` condition that can be false, such as `open && styles.x`, as `(open && styles.x) || undefined`, since `className` does not take `false`, and the adopt codemod reads it back into `classStyle`
