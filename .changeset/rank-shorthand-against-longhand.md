---
'@plumeria/codemod': patch
---

- Fix: a declaration keeps the win it has in Plumeria, where the rank it is given — one step per shorthand covering the property, one more under an at-rule — settles the pair rather than the order it was written in. The export reproduces that rank by ordering the rules and the declarations inside them, so a base longhand still outranks a shorthand set under a media query.
- Fix: two properties that only partly overlap — `borderColor` against `borderTop` — are recognised as sharing ground, so the order the call site composes them in is carried into the stylesheet instead of being read as unrelated. A pair that both covers and partly overlaps keeps both answers, through a class that carries only the crossing declarations.
- Fix: a narrower condition is written after the one it implies, so a `@media (min-width: 900px)` rule still wins where a `@media (min-width: 600px)` rule also matches.
- Fix: a composition whose members come from separate modules is folded into a single class in the first of them. Two stylesheets have no order that reaches both, and a fold puts the members back under one that does.
- Fix: an argument reaching a function style through a custom property carries the unit Plumeria would have added, so `styles.box(100)` is still `100px` after the export.
- Fix: `migrate --from css-modules` finds a module the same way wherever it looks, so a style read as a value and a function style call are both restored in a file whose stylesheet sits beside it.
