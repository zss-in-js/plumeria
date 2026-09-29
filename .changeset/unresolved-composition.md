---
'@plumeria/eslint-plugin': minor
---

- Add `no-unresolved-composition`, enabled as a warning in `recommended` and plumerialint, which reports `css.use()` results that are joined with `+`, a template literal or `.join()`, or passed to a function such as `clsx` or `css.use()` itself, including through local variables, `+=` assignments and object properties
- Report separate `css.use()` results with a message to merge them into one call, results passed to a function with a message to pass the styles directly, and external class names with a message that lists them and asks to rewrite them with `css.create()`
