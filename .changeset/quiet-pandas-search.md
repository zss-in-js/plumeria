---
'@plumeria/utils': patch
'@plumeria/eslint-plugin': patch
---

- Fix: `@plumeria/utils` to place a conditional at-rule after every condition that contains it while optimizing. A query matching a subset of another is the more specific of the two, the same way a longhand is more specific than the shorthand covering it, and until now that pair was left to the order the atoms happened to be emitted in: the `classStyle` array usually, or the file the compiler reached first where one of the two was also used on its own. Specificity cannot carry the ranking, because whether one condition implies another is undecidable in general, so the pair is ordered instead — the narrower one last, where it wins everywhere both of them reach. This supersedes the note added in 18.2.6 that conditions are never sorted against each other.

- Fix: `zss-engine@2.5.0` reads a condition as the interval of viewports, or of container sizes, that it matches, so one condition implying another is the same question in every shape it can be written in: `min-` and `max-` prefixes, the `>=` comparison form, the two-sided form, several joined with `and`, on `width`, `height`, `inline-size` or `block-size`. A media type or a container name has to match, and a query it cannot read — `not`, `only`, a comma, `style()`, a feature that is not a size, an unknown unit — ranks against nothing. `no-order-dependent-overlap` reads a pair through the same function, so what the rule reports and what the stylesheet does cannot drift apart, and it now covers `@container` alongside `@media`.

Note: a pair the optimizer can compare may move a condition it cannot compare, because no arrangement satisfies the ranking and holds every other pair still. Two conditions that overlap without either containing the other, such as `600px` to `900px` against `700px` to `1000px`, are still decided by source order.
