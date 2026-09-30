---
'@plumeria/eslint-plugin': patch
'@plumeria/init': patch
---

- Ask "Which spelling should lint enforce?" and rename the `both` answer to `none`
- Remove the `--both` flag
- Add `no-style-prop-relay`, enabled as an error in `recommended` and plumerialint, which reports a style prop that a component only passes on
- Report function keys passed to `css.use()` in `no-unresolved-composition`
