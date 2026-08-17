---
'@plumeria/codemod': patch
---

- Feat: `npx @plumeria/codemod migrate --from plumeria` exports `css.create` definitions to CSS Modules, writes global styles (`createTheme`, `keyframes`, `viewTransition`) to `src/styles/global.css`, and rewrites consumers to use `className`.
- Fix: import specifiers are resolved through `tsconfig.json` `paths`, directory `index` files, and filenames that carry a dot, so a definition reached under an alias is found instead of reported as dynamic.
- Feat: `css.createStatic` values imported from another file are inlined into the generated CSS, and the import is removed only when nothing outside the exported styles still reads it.
- Feat: `css.marker` and `css.extended` are expanded into the custom property and the `@container style()` rule they compile to.
- Feat: several `css.create` calls in one file are written to one stylesheet, renaming a key an earlier call already claimed and repointing its usages.
- Feat: a file that only defines styles is left untouched and its consumers are pointed at the generated `*.module.css`, matching how `--from css-modules` leaves the original stylesheet in place.
