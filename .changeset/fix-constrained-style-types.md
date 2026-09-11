---
'@plumeria/core': minor
'@plumeria/eslint-plugin': minor
'@plumeria/codemod': minor
---

- Fix: a style type accepts only a namespace `css.create` returned, so the object that holds the styles, and an object that came from anywhere else, are type errors.
- Fix: key `Marker` by the pseudo class it emits, so a style built from `css.marker()` passes a constrained style prop type.
- Fix: accept an at-rule prelude that follows the keyword without a space, both in the type and in `validate-at-rules`.
- Feat: add `AtomicStyle` and `AtomicDynamicStyle`, which name one created style by the rule object it was created from, so a prop can require a property and pin its value.
- Fix: a declaration file can name the type of an exported style through those exports, instead of failing on the symbol that tags it.
- Fix: the export reports a reference to `AtomicStyle` or `AtomicDynamicStyle` as well, instead of migrating a module that still needs the import.
