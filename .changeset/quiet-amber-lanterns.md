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

- Update: `css.viewTransition` is renamed to `css.viewTransitionClass`, and its rules select the returned class, as in `::view-transition-old(*.vt-…)`, so it can be given to the `default`, `enter`, `exit`, `update` and `share` props of React's `<ViewTransition>` or set with `viewTransitionClass` in `css.create`
- Feat: a `css.viewTransitionClass` is emitted when it is used in one of those `<ViewTransition>` props, including both sides of a condition and the values of a type map, as well as when it is used in `css.create`
- Update: a name from `css.keyframes`, `css.viewTransitionClass`, `css.positionTry` or `css.varType` is written where it is read, and its declaration is dropped as with `css.createTheme`, so no definition is left in the bundle
- Feat: reading a Plumeria definition through a namespace import, by member, string key, destructuring, a rest element or the namespace as a whole, is a compile error that asks for a named import
- Feat: the `rename-api` codemod renames an API across a codebase, as in `npx @plumeria/codemod rename-api viewTransition viewTransitionClass`
- Update: the ESLint rules that read `css.viewTransition` read `css.viewTransitionClass`
