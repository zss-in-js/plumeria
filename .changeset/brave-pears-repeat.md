---
'@plumeria/utils': patch
---

Fix: `@plumeria/utils` to give a nested selector inside a conditional rule both the nested depth and the condition depth. Previously a nested selector received a single `:not(#\#)` whether or not it sat inside `@media`, `@container`, or `@supports`, so a declaration such as `@media { ':hover': ... }` tied with a bare `':hover'` on specificity and the winner depended on the order the rules happened to be emitted. The condition now contributes its own depth, so the conditional declaration wins regardless of where it appears in the stylesheet. Custom properties stay exempt and receive no depth.

Fix: `@plumeria/utils` to move conditional at-rules after base rules while optimizing. A base longhand and a conditional shorthand can still land on the same specificity, because property depth and condition depth share one scale, and until now the stylesheet order decided that pair. `@media`, `@container`, `@supports`, `@layer`, and `@scope` are now hoisted as a stable partition, so the conditional declaration wins and the same style object produces the same result no matter which order its keys were written in. Conditions are never sorted against each other, so overlapping conditions keep resolving by source order, and at-rules that carry no condition depth such as `@keyframes` are left where they are.
