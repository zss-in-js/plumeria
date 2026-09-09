---
'@plumeria/core': major
'@plumeria/eslint-plugin': major
'@plumeria/codemod': major
---

- Feat: add `StyleProps` and `WithoutProperties` for constraining the properties a style prop accepts.
- Feat: add `StaticStyles`, which rejects a dynamic style and narrows properties when given a type argument.
- Feat: add the `validate-at-rules` lint rule, which reports an unrecognised at-rule inside `css.create()`.
- Feat: the export reports a reference to a Plumeria style type and leaves that module in place, instead of removing the import the reference still needs.
- Fix: `css.use()` declared a rest parameter that was not an array type.
- Fix: the `classStyle` global augmentation was missing its `declare` modifier.
- Break: `Style` accepts only styles created by `css.create`; an inline object is a type error.
