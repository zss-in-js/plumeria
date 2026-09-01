---
'@plumeria/compiler': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: a component held by a call — `memo`, `forwardRef` or any other wrapper — was not read as a component, so a style reached through its non-destructured parameter threw `Dynamic or unresolvable style object`, and the styles handed to it were found by scanning the file rather than by name. The function a call wraps is now read as the component it is.

- Change: a wrapped component is now held to the same rule as every other one, so a style prop it never applies to an element is reported where it is received. Passing that style on to another component already failed the build, but the error was raised in the component that received it next.
