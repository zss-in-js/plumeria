---
'@plumeria/codemod': patch
---

- Fix: `migrate --from plumeria` reproduces the order a `classStyle` array composes in, by ordering the generated rules to satisfy every call site, collapsing an unconditional array into one class that `composes` its members, and giving a call site that still disagrees an override class carrying only the disputed declarations.
- Fix: a file the plan cannot export is left in Plumeria together with every file it reads definitions from, so a partial migration no longer leaves source that does not compile.
- Fix: negative values, `css.use`, a token read outside a style, a style arriving through a prop, and a `classStyle` on an element that already carries `className` are all converted instead of being reported or rewritten by halves.
- Fix: the generated import is written with the other imports rather than where the `css.create` stood, and the block appended to `global.css` is replaced on a re-run instead of appended again.
- Fix: `migrate --from css-modules` points a consumer at where the module actually landed, restores a composed array, a `css.use` call, and a function style call, and keeps one name per module when a file reads several.
- Fix: a style read with a computed key is reported rather than exported, because the class it names is not known until it runs.
