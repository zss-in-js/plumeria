---
'@plumeria/compiler': major
'@plumeria/core': major
'@plumeria/eslint-plugin': major
'@plumeria/headlessui': major
'@plumeria/inspector': major
'@plumeria/next-plugin': major
'@plumeria/turbopack-loader': major
'@plumeria/unplugin': major
'@plumeria/utils': major
---

Bump version to 18.0.0

- feat: add @plumeria/codemod for renaming the styling prop across a codebase
- fix: read styleProp in no-inline-object, it matched styleName only
- fix: name the configured prop in the css.use() dynamic style error
- break: rename the default styling prop from styleName to classStyle
- break: rename the @plumeria/core/style-name subpath to @plumeria/core/class-style
- break: rename the styleName prop on @plumeria/headlessui components to classStyle
- break: rename the no-inline-object messageId to noInlineObjectInStyleProp
