# @plumeria/core

**Zero-runtime CSS in JS library in TypeScript.**

## Installation

To start using Plumeria, Install the following two packages:

```sh
npm install @plumeria/core
```

### Compiler

To compile `@plumeria/core`, for example, to use `npx css`, install  
[`@plumeria/compiler`](https://www.npmjs.com/package/@plumeria/compiler) for static extraction through the build process.

```sh
npm install --save-dev @plumeria/compiler
```

### StyleSheet

Import stylesheet in your application's entry point.  
Applies the static stylesheet for production environments.

```ts
import '@plumeria/core/stylesheet.css';
```

## API

### css.create()

Styles are defined as a map of CSS rules using css.create(). In the example below, there are 2 different CSS className. The className `styles.box` and `styles.text` are arbitrary names given to the rules.

```ts
import { css } from '@plumeria/core';

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

Pseudo and media queries can be wrapped in property style definitions:  
Also, any properties that are not wrapped will conform to that className.

```ts
const styles = css.create({
  box: {
    // 900px
    [css.media.maxWidth(900)]: {
      width: '100%',
      color: 'rgb(60,60,60)',
    },
  },
  text: {
    color: '#333',
    [css.pseudo.hover]: {
      color: 'skyblue',
      opacity: 0.9,
    },
  },
});
```

### css.global()

This API lets you define global CSS.

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

### css.keyframes()

Define @keyframes and set the return value directly to animationName.

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

### css.defineVars()

Defines custom CSS variables (custom properties) at the `:root` level.  
This API allows you to declare design tokens such as spacing, sizes, or other constants, which can be referenced throughout your styles using the tokens.sm to `var(--sm)` syntax.

```ts
const tokens = css.defineVars({
  xs: 240,
  sm: 360,
  md: 480,
  lg: 600,
  xl: 720,
});
```

### css.defineTheme()

Define data-theme as objects.  
A default compile to :root, and the rest as a string compile to data-theme, You can also use media and container here.

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

### css.color

Mixes #000 or #FFF into the color.  
The first argument takes the color and the second argument takes the same value as opacity (string % or number).

You can also retrieve the complement of the color property from an color object.

```ts
color: css.color.darken('skyblue', 0.12),
color: css.color.lighten('navy', 0.6),

color: css.color.skyblue,
color: css.color.aqua,
// ...many more colors
color: css.color.*...,

```

### cx

Merges strings such as class names and pseudo.

```tsx
// ":hover::after"
cx(css.pseudo.hover, css.pseudo.after);
// "text_hash box_hash"
cx(styles.text, styles, box);
```

## ESLint

[@plumeria/eslint-plugin](https://www.npmjs.com/package/@plumeria/eslint-plugin)

### Rules: recommended

\- no-inner-call:(error)  
\- no-unused-keys:(warn)  
\- sort-properties:(warn)  
\- validate-values:(warn)

It is recommended to use it in conjunction with TypeScript completion, which is one of the big advantages of using plumeria.

## License

plumeria is [MIT licensed](https://github.com/refirst11/rscute/blob/main/LICENSE).
