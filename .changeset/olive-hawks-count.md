---
'@plumeria/eslint-plugin': patch
---

- Fix: `no-order-dependent-overlap` to report the third pair the specificity graph leaves to source order. Two media queries written in one style, where one provably matches a subset of the other — `(min-width: 900px)` inside `(min-width: 600px)` — and the narrower one written first, mean the broader one wins wherever they meet, which is the opposite of what writing the narrower query meant. Whether one condition implies another is not decidable in general, so no depth is assigned to a condition and only the comparable subset is read: a single numeric `min-` or `max-` range, on one axis, in one unit. A compound query, a keyword query, `@supports` and `@container` are left alone. The swap is offered as a suggestion rather than a fix, since applying it changes which query wins.
