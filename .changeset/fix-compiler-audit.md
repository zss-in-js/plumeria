---
'@plumeria/compiler': patch
'@plumeria/utils': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
---

- Fix: extract styles from wrapped expressions, nested arrays, scoped aliases, and conditional style props.
- Fix: extract styles from an array handed to a component prop.
- Fix: apply an array default when a style prop is omitted, so the compiler and the loader settle on the same class.
- Fix: accept an omitted optional style prop, whether it is destructured or read off the props object.
- Fix: report an unsupported at-rule passed to createTheme in the compiler.
- Fix: honor the compiler working directory for dependency and tsconfig path resolution.
- Fix: prevent outer constants from overriding dynamic style parameter defaults.
- Fix: report a spread element in a style array instead of dropping the styles behind it.
- Fix: read a destructured props parameter the same way in the compiler, the loader, and the plugin.
