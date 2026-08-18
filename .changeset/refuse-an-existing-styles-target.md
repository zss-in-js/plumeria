---
'@plumeria/codemod': patch
---

- Fix: `migrate --from css-modules` overwrote a `*.styles.ts` that was already there without reporting it. A stylesheet whose target exists is now reported as `target-exists` and left alone, the way the export already treats an existing `*.module.css`, and its consumers keep the import they had rather than being pointed at a file that was never written.
- Fix: `migrate --from css-modules` left a style read with a run-time key spelling the stylesheet import it had just renamed, so `s[name]` survived as an unbound identifier. The read now carries the generated binding.
- Fix: `migrate --from plumeria` folded a style key named by a constant only inside a composition array, so `classStyle={styles[VARIANT]}` kept the constant while the import that carried it was retired. A lone call site folds the same way.
