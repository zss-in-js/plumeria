---
'@plumeria/compiler': patch
'@plumeria/utils': patch
---

- Fix a style handed to a component through a prop named the same as the one elements take. It was resolved to class names at the call site and the attribute was renamed, so the component never received it and the style was dropped with no error. This is the spelling the `StyleProps` reference shows
- Fix the compiler blaming the file being compiled when a style it cannot read came through a namespace import, instead of naming the file that actually failed and the error it raised
- Read the export a namespace binding carries from the member that follows it, so a style imported with `import * as` is traced through a file that only re-exports it. Both the compiler and the bundler plugins stopped at the re-exporting file, which is sound, and reported the generic unresolvable-style message
