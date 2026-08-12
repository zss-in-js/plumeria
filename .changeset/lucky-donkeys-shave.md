---
'@plumeria/core': patch
'@plumeria/utils': patch
---

- Fix: `@plumeria/core` to expose `overflowInline` instead of `overflowBlockX`. CSS has no `overflow-block-x` property; the logical counterpart of `overflow-x` is `overflow-inline`, and the type was reachable under a name that does not exist.

- Fix: `zss-engine@2.4.2` aligns the shorthand graph with the logical property groups, so a property no longer ties with the shorthand that covers it. `paddingTop` and `paddingBlock` shared a depth and left the stylesheet order to decide whether the longhand survived; the physical edges now sit below the axis shorthand that sets them, across `margin`, `padding`, `inset`, `scroll-margin`, `scroll-padding`, and the `border` axes. `overflow` and `overscroll-behavior` gained the logical longhands they were missing, which had carried no depth at all, and `containIntrinsicSize`, `positionTry`, `marker`, `cue`, `pause`, and `rest` are registered as shorthands.

Note: these depths decide how many `:not(#\#)` selectors an atomic class receives, so the generated stylesheet changes for the properties listed above. Class names are unaffected.
