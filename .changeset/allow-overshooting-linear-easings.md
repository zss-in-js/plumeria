---
'@plumeria/eslint-plugin': patch
---

- Fix: allow any number as a `linear()` easing stop in `validate-values`, so generated spring and bounce curves that overshoot past 1 or dip below 0 are no longer reported. Leading-dot numbers such as `.5` are now reported in `linear()` and `cubic-bezier()`, as they already were everywhere else.
