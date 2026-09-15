---
'@plumeria/compiler': patch
---

- Refuse a `css.create`, `css.createTheme` or `css.createStatic` call that is not assigned to a named top-level variable, instead of skipping the declaration and emitting nothing for it. A default-exported or destructured call used to leave its styles out of the sheet with no diagnostic
- Refuse a dynamic function key handed to `css.use()`. A called key used to emit a rule reading a custom property that only an element can set, so nothing on the page ever defined it; an uncalled key emitted nothing at all
- Report a call that is only a statement as one that has to be assigned, ahead of anything wrong with the selector it was given, which is the order the bundler plugins already used
