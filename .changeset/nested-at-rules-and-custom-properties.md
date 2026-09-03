---
'@plumeria/codemod': patch
'@plumeria/compiler': patch
'@plumeria/eslint-plugin': patch
'@plumeria/turbopack-loader': patch
'@plumeria/unplugin': patch
'@plumeria/utils': patch
---

- Fix: a custom property written in camelCase, such as `--fooBar`, was emitted kebab-cased as `--foo-bar` while `var(--fooBar)` in a value was left as written, so the variable never resolved. Custom property names now keep their case.
- Fix: an at-rule nested inside another at-rule dropped the outer condition, so `@media` wrapping `@supports` compiled to the `@supports` block alone. Both conditions are now kept, and `@supports`, `@layer` and `@scope` are accepted alongside a nested query in the types.
- Fix: a hex code inside `url()` or a quoted value was replaced with its color name, so `url(#fff)` became `url(white)` and `content: '#fff'` became `content: 'white'`. Those values are now left as written.
- Update: `navy`, `springgreen`, `powderblue` and `lavenderblush` are normalized like the other named colors.
