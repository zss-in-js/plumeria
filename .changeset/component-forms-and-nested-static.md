---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

Fix: a style handed to a component through a prop threw `Dynamic or unresolvable style object` when that component was written as a function declaration or exported as the default. Every form a component can take is now read, and `compileCSS` falls back to the file's other components when the owner holds no entry, as the bundler plugins already did.

Fix: a constant read through more than one property, such as `theme.colors.primary`, resolved to nothing, so the declaration was dropped from the sheet without an error and an interpolation of it was left empty. The whole path is now walked.
