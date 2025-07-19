# @plumeria/core

Plumeria is a JavaScript library for Scalable and optimized styling.

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

Define a set of atomic styles:

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  text: {
    color: 'yellow', // xxxhash1
  },
  box: {
    width: '100%', // xxxhash2
    background: 'rgb(60,60,60)', // xxxhash3
  },
});
```

## `css.props()`

Use `css.props()` to combine multiple styles or switch between them conditionally.  
css.props is compiled and style properties to the right take precedence.  
The same goes for shorthand and longhand rules.

```jsx
<div className={css.props(styles.text, styles.box)} />
// "xxxhash1 xxxhash2 xxxhash3"
```

Supports pseudo/media queries inline:

```ts
import { css, ps, media } from '@plumeria/core';

const styles = css.create({
  box: {
    [media.maxWidth(900)]: {
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
  xs: media.maxWidth(480),
  sm: media.maxWidth(640),
  md: media.maxWidth(768),
  lg: media.maxWidth(1024),
  xl: media.maxWidth(1280),
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

### `color`

To use `color`, import it:

```ts
import { color } from '@plumeria/core';
```

```ts
backgroundColor: color.darken('skyblue', 0.12),
backgroundColor: color.lighten('navy', 0.6),
backgroundColor: color.skyblue,
backgroundColor: color.aqua,
// and many more
```

### `px`

To use `px`, import it:

```ts
import { px } from '@plumeria/core';
```

Pseudo expand helper:

```tsx
px(ps.hover, ps.after);
// => ":hover::after"
```

## 🧹 ESLint Support

Use [@plumeria/eslint-plugin](https://www.npmjs.com/package/@plumeria/eslint-plugin) for recommended rules:

### Rules: recommended

```
- no-destructure: error
- no-inner-call: error
- no-unused-keys: warn
- sort-properties: warn
- validate-values: warn
```

Plumeria is best used alongside TypeScript for excellent autocomplete and validation support.

## 📄 License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
