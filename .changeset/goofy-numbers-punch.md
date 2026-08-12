---
'@plumeria/turbopack-loader': patch
'@plumeria/utils': patch
---

Fix: `@plumeria/utils` to preserve shorthand and longhand declarations as
independent atoms, and merge identical selectors and at-rules without
reordering them during optimization.

Fix: `@plumeria/turbopack-loader` to optimize its accumulated development
virtual stylesheet so duplicate selectors and at-rules are merged consistently.

Fix: `zss-engine@2.4.1` The override longhand behavior has been removed. The behavior within styles that crushed longhand when shorthand was written below it has been abolished, and it has been standardized so that longhand is added regardless of the order in which it is written. This is because JavaScript objects do not need to reproduce CSS cascading, and Plumeria determines everything simply by satisfying the merge rules. If you are using ESLint's recommended rules, this change will not affect you, so it will be treated as a patch update.

Fix: Logical longhand properties now receive specificity based on their depth
in the shorthand graph. For example, `padding-block-start` receives two
`:not(#\#)` selectors in base styles and three inside conditional rules.

Update: Generated base and conditional styles no longer depend on moving media queries
to the end of the stylesheet. Their priority is controlled by specificity, so
development and production preserve the same behavior while optimization can
merge duplicate rules without sorting conditions.
