# @plumeria/core

**Zero-runtime, expressive CSS-in-JS library for TypeScript.**

## 🌱 Installation

To get started with Plumeria, install the core package:

```sh
npm install @plumeria/core
```

### 🛠 Compiler (for static extraction)

If you want to extract styles at build time using commands like `npx css`, install:

```sh
npm install --save-dev @plumeria/compiler
```

More at: [@plumeria/compiler on npm](https://www.npmjs.com/package/@plumeria/compiler)

### 🎨 Stylesheet Import

In your app entry point, import the compiled CSS file:

```ts
import '@plumeria/core/stylesheet.css';
```

## 📘 API Reference

### `css.create()`

Define a set of styles:

```ts
import { css, cx, ps, px } from '@plumeria/core';

const styles = css.create({
  box: {
    width: '100%',
    color: 'rgb(60,60,60)',
  },
  text: {
    color: 'yellow',
  },
});
```

Supports pseudo/media queries inline:

```ts
const styles = css.create({
  box: {
    [css.media.maxWidth(900)]: {
      width: '100%',
    },
  },
  text: {
    color: '#333',
    [ps.hover]: {
      color: 'skyblue',
      opacity: 0.9,
    },
  },
});
```

### `css.createComposite()`

Creates modifier classes for a base style:

```ts
const styles = css.create({
  flexBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
});

const composed = css.createComposite(styles.flexBox, {
  hover: {
    [ps.hover]: {
      scale: 1.5,
    },
  },
  active: {
    [ps.active]: {
      color: css.color.gray,
    },
  },
});
```

This produces named modifier classes based on the base style.  
You can use them like this:

```jsx
<div className={composed.hover} />
```

Automatically generates all modifier variants while keeping the base style clean.

### `css.global()`

Define global styles:

```ts
css.global({
  html: {
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
  },
  body: {
    position: 'relative',
    width: 600,
  },
  h1: {
    fontSize: 32,
  },
});
```

### `css.keyframes()`

Create keyframes for animation:

```ts
const fade = css.keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

const styles = css.create({
  box: {
    animationName: fade,
    animationDuration: '1s',
  },
});
```

### `css.defineConsts()`

Define reusable constant values with type safety:

```ts
const breakpoints = css.defineConsts({
  xs: css.media.maxWidth(480),
  sm: css.media.maxWidth(640),
  md: css.media.maxWidth(768),
  lg: css.media.maxWidth(1024),
  xl: css.media.maxWidth(1280),
});
```

Use them in your style definitions:

```ts
const styles = css.create({
  container: {
    [breakpoints.sm]: {
      padding: 16,
    },
    [breakpoints.lg]: {
      padding: 32,
    },
  },
});
```

Constants are fully type-safe and readonly.

### `css.defineVars()`

Define design tokens with CSS variables:

```ts
const tokens = css.defineVars({
  white: 'white',
  black: 'black',
  textPrimary: '#eaeaea',
  textSecondary: '#333',
  link: 'lightblue',
  accent: 'purple',
});
```

### `css.defineTheme()`

Define theme values with responsive and conditional support:

```ts
const themes = css.defineTheme({
  text_primary: {
    default: 'rgb(60,60,60)',
    light: 'black',
    dark: 'white',
    [css.media.maxWidth(700)]: 'gray',
  },
  bg_primary: {
    light: 'white',
    dark: 'black',
  },
});
```

### `css.color`

Color utility:

```ts
color: css.color.darken('skyblue', 0.12),
color: css.color.lighten('navy', 0.6),

color: css.color.skyblue,
color: css.color.aqua,
// and many more
```

### `cx`

Classname merging helper:

```tsx
px(ps.hover, ps.after);
// => ":hover::after"
cx(styles.text, styles.box);
// => "text_hash box_hash"
```

## 🧹 ESLint Support

Use [@plumeria/eslint-plugin](https://www.npmjs.com/package/@plumeria/eslint-plugin) for recommended rules:

### Rules: recommended

```
- no-inner-call: error
- no-unused-keys: warn
- sort-properties: warn
- validate-values: warn
```

Plumeria is best used alongside TypeScript for excellent autocomplete and validation support.

## 📄 License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
