---
'@plumeria/eslint-plugin': patch
---

- Fix: `sort-properties` places `animationFillMode`, `animationComposition`, `animationTimeline`, `animationRange`, `animationRangeStart`, `animationRangeEnd`, `borderBlockColor`, `borderBlockStyle`, `borderBlockWidth`, `borderInlineColor`, `borderInlineStyle`, `borderInlineWidth`, and `whiteSpaceCollapse` in the group they belong to. The order table did not carry them, so `--fix` sorted each one past every property it knows.
- Fix: `validate-values` accepts `anchor()` only in the inset properties and `anchor-size()` only in the accepted `@position-try` properties. Both were accepted wherever a length is, and both are invalid outside those properties.
- Fix: `validate-values` compares keywords, global values, and units without regard to case, so `display: 'BLOCK'` and `width: '10PX'` no longer report. CSS keywords are ASCII case-insensitive.
- Feat: `validate-values` checks the value of `animationRange`, `animationRangeStart`, and `animationRangeEnd` against the named timeline ranges, and reports a numeric `animationTimeline`. None of the four were checked at all.
