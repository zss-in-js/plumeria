---
'@plumeria/compiler': patch
'@plumeria/utils': patch
---

- Move a unit the declaration writes itself into the value the element sets, instead of leaving it after the variable. ``width: `${pct}%` `` compiled to `width: var(--v)%`, and CSS substitutes a variable as tokens rather than text, so the `%` never joined the number: the declaration was invalid, was dropped, and the element fell back to its unstyled width with nothing reported. It now compiles to `width: var(--v)` with `20%` in the variable. The same applies to a unit written inside `calc()`
- Split the variable when one parameter lands both in a declaration that writes the unit and in one that does not, the way a parameter crossing the unitless rule was already split
