---
'@plumeria/eslint-plugin': patch
---

- Accept a length for `outlineWidth` in `validate-values`. The property was grouped with the border widths for its keywords but left out of the length group, so `thin`, `medium` and `thick` passed while `2px`, `calc()` and every other length was reported as invalid
