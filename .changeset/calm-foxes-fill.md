---
'@plumeria/eslint-plugin': patch
---

- Fix: `expand-border-shorthands` expands a `var()` or a template-literal expression that stands as one token, assigning it to the component the other tokens leave open; such a value was reported as unsplittable.

- Fix: the expansion writes `currentColor` for an omitted color instead of `currentcolor`, which `validate-values` rejected, and `validate-values` now lists `currentColor` as a `borderColor` keyword.
