---
'@plumeria/codemod': patch
---

- Fix: `migrate --from plumeria` writes a `css.keyframes` into the CSS Module that reads it rather than into the global stylesheet. A CSS Module renames the value of `animation-name` the way it renames a class, so a global `@keyframes` never matched the renamed reference. One a `css.viewTransition` names is written globally as well, since a `::view-transition-*` rule is not scoped.
- Fix: the global stylesheet is looked for at `app/global.css` and `src/app/global.css`, under either the `global.css` or `globals.css` spelling, before a new `styles/global.css` is created. An App Router project imports the former from its root layout, and nothing imported the file the migration used to write.
- Fix: only the definitions an exported style reaches are written out. A `css.keyframes`, `css.viewTransition`, or `css.createTheme` that nothing reads, or that only a file the migration held back reads, stays in the TypeScript file that declares it.
- Feat: `migrate --from css-modules` reads a stylesheet's `@keyframes` back into a `css.keyframes` binding, and splits an `animation` shorthand naming one into its longhands. A keyframe step no longer reports as an unsupported selector.
