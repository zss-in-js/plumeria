---
'@plumeria/eslint-plugin': patch
'@plumeria/utils': patch
---

- Feat: `@plumeria/eslint-plugin` adds `no-order-dependent-overlap`, which reports two properties written in one style that overlap while neither one outranks the other. Every pair where one property contains the other is settled by specificity and is left alone; what remains is one property written under both its logical and its physical name, such as `paddingTop` beside `paddingBlockStart`, and two shorthands that cross without either containing the other, such as `borderTop` beside `borderBlockWidth`. Those pairs are decided by the order they are written, which is stable inside one style object and up to the bundler once the pair is split across two files. The rule is `warn` in `recommended`.

- Fix: `zss-engine@2.4.3` registers `corner-shape` and the eight corner longhands it sets, which were typeable but carried no depth at all, so `cornerShape` and `cornerTopLeftShape` left the stylesheet order to decide the winner while the identically shaped `border-radius` was already settled by specificity. The shorthand graph is also exported, so the ESLint rule ranks a pair from the same data the compiler generates the stylesheet from.

Note: an alias pair carries a suggestion for each side and the rule has no autofix. Removing one half of a crossing pair would drop the values the other half never set, and the two spellings of an alias pair are the same property only in a horizontal writing mode, so neither edit is safe to apply in bulk.

Note: the corner longhands now receive one `:not(#\#)` where they received none. Class names are unaffected.
