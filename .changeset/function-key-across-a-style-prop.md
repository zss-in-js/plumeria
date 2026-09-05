---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: a dynamic function key handed to a component through a style prop was silently dropped. The key now reaches the element together with the variables the caller computed, so `<Card styleArray={styles.tone(color)} />` renders the class and the custom property that writing the call on the element would.
- Fix: `css.use()` reports a style prop that carries a dynamic function key instead of dropping it, because such a value has to reach the element as a custom property and a class name string cannot carry one.
