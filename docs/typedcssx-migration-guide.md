# TypedCSSX migration guide

🎉 First of all, thanks for using typedcssx, and thanks for your interest in plumeria!  
Plumeria was created with the aim of requiring almost no peripheral plugins.
Since it's built on the same Node.js platform, the transition shouldn't be much harder than with other libraries.

## New file extension

The file extension has changed from `*.css.ts` to `*.ts.` or `*.tsx`

## New import

`import cssx from 'typedcssx'` to `import { css } from '@plumeria/core'`

## New command for compile

`npx cssx` is now `npx css`.  
The argument --compile has been changed to --type-check.  
argments is `--view` and `--paths` and `--type-check`.

## Deleted API

`cssx.set()`  
set was used to directly enumerate properties, but since css.create() includes it comprehensively, it has been removed as unnecessary.x

## Changed System

TypedCSSX used CSSModules to strictly restrict CSS class names. However, this required a Next.js-specific plugin to change class names, so we decided to move to regular simple css files for Plumeria.

### Custom Properties

The custom property Pseudo has been renamed to `css.pseudo.*`.
This was mainly due to the fact that it polluted completion, and properties are not strings and therefore do not support flexible syntax.

The new syntax is `[cx("& a", css.pseudo.hover)]: {...}`

Even if you have to assign a class to each li tag in a ul list, you can use syntax.

```ts
const styles = css.create({
  list: {
    '& li': {
      listStyle: 'none',
    },
  },
});
```

Since strings are not always type-safe, we recommend using css.pseudo.hover etc. whenever possible.

## The type system has been greatly improved

Use number | string for properties that can accept numbers, string for properties that only accept strings.
Detailed type control has been moved to eslint-plugin.
Values ​​that can only be used on Windows systems can no longer be used from the `<color>` type. This is purely a cross-platform advantage.

## New API

`css.container.*` `css.media.*` `css.pseudo.*` `css.colors.*`  
`css.defineThemeVars()` `css.keyframes()`

Please read the documentation for more details.

- [defineThemeVars()](https://plumeria.dev/docs/defineThemeVars)
- [keyframes()](https://plumeria.dev/docs/keyframes)

## New Utils

`<ServerCSS />` import has been changed to @plumeria/next.  
`union` function has been changed to `cx` function.

## Other Changes

The injectCSS, transpiler and build functions have been moved to the zss-engine library, and the compiler has been moved to @plumeria/compiler.
