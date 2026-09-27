---
'@plumeria/compiler': minor
'@plumeria/eslint-plugin': minor
'@plumeria/next-plugin': minor
'@plumeria/turbopack-loader': minor
'@plumeria/unplugin': minor
'@plumeria/utils': minor
---

- Compile a file that writes the styling prop without importing `@plumeria/core`. The scan, the Turbopack and unplugin transforms, and the file condition `withPlumeria` hands to Turbopack used to skip every file that did not mention `@plumeria/core`, so a component handed `classStyle={styles.a}` from such a file received an empty class. They now also compile a file that writes the styling prop as a JSX attribute, and a lightweight reader keeps a mention in a comment, a string or JSX text from pulling a file in
- `props-require-import` is renamed to `custom-props-require-import` and no longer reports the styling prop. It now reports a file without the `@plumeria/core` import that passes a `css.create` style to a component through any other prop, following the import to the file that defines the style, and its fix adds the import
