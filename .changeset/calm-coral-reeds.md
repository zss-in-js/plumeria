---
'@plumeria/compiler': patch
'@plumeria/utils': patch
'@plumeria/eslint-plugin': patch
'@plumeria/unplugin': patch
'@plumeria/swc-jest': patch
'@plumeria/turbopack-loader': patch
'@plumeria/next-plugin': patch
---

- Fix: a received style can be composed onto a component the build never scans, such as a `@plumeria/headlessui` part, with `classStyle={[styles.base, classStyle]}` instead of failing the build
- Fix: passing a received style to a component that declares the style prop fails the build at that attribute, even when the same style is also applied to an element, instead of the style being silently dropped
- Fix: `no-style-prop-relay` reports a received style passed to a component that declares the style prop, the same case the build stops at, including a component imported from another file
- Fix: `no-order-dependent-overlap` no longer reports selectors that cannot match at the same time: the same attribute with different values, `:not([attr])` with `[attr=...]`, `:user-valid` with `:user-invalid`, `:playing` with `:paused`, `:dir(ltr)` with `:dir(rtl)`, and odd with even `:nth-*()`
- Fix: `no-style-prop-relay` reports a file the editor opens under a path that differs from the real one, such as a different letter case on macOS
- Update: Next.js in `@plumeria/next-plugin` devDependencies to 16.4.2
