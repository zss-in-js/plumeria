---
'@plumeria/codemod': patch
---

- Update: `migrate --from css-modules` converts several selector shapes it used to report. A compound class rides on the class written last, a chain of three or more classes becomes one marker per level with each gated by the one above it, a bare tag under a class takes a key of its own that the consumer rewrite attaches to the markup it can see — a child combinator taking a different key from a descendant one, and reaching one level rather than any — and an attribute selector or a `:global` ancestor becomes an `:is()` selector key.
- Update: the styling prop is written in stylesheet order rather than in the order the class list carried, a `composes` expansion included, because a class list has no order of its own in CSS. Reads of two stylesheets keep the slots they were given, since which of them the bundler puts first is not a fact one file holds.
- Fix: the migration no longer writes a call site it cannot answer for. A class a rule was refused for, and a pair whose order Plumeria's rank settles against the one CSS gives it — a declaration under an at-rule, or further down the shorthand graph, outranks one written after it — are reported and the stylesheet is held whole: nothing written and no consumer moved, so a later run converts it once the rule named in the report is dealt with.
