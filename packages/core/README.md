# @plumeria/core

Plumeria is a Near zero-runtime CSS-in-JS for efficient design systems.

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
import '@plumeria/core/stylesheet';
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
    [css.media.max('width: 900px')]: {
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
  h2: {
    fontSize: 24,
  },
  h3: {
    fontSize: 16,
  },
});
```

### cx

Merges strings such as class names and pseudos.

```tsx
const styles = css.create({
  text: {
    [cx(css.pseudo.hover, css.pseudo.after)]: {
      color: 'yellow',
      opacity: 0.9,
    },
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

### css.defineThemeVars()

Define data-theme and regular variables as objects.  
A default compile to :root, and the rest as a string compile to data-theme, You can also use media and container here.

```ts
const preset = css.defineThemeVars({
  normal: 'white',
  text_primary: {
    default: 'rgb(60,60,60)',
    light: 'black',
    dark: 'white',
    [css.media.max('width: 700px')]: 'gray',
  },
  bg_primary: {
    light: 'white',
    dark: 'black',
  },
});
```

### css.colors

Mixes #000 or #FFF into the color.  
The first argument takes the color and the second argument takes the same value as opacity (string % or number).

```ts
color: css.colors.darken('skyblue', 0.12),
color: css.colors.lighten('navy', 0.6),
```

## Linter

[eslint-plugin-zss-lint](https://www.npmjs.com/package/eslint-plugin-zss-lint) is a linter built for CSS-in-JS libraries built with zss-engine.

Rules:  
\- sort-properties  
\- validate-values  
\- no-unused-keys

Type safety relies on this eslint-plugin. It includes all properties, excluding deprecated and experimental.

## How Plumeria works

Plumeria complies with Semantic HTML, which means that it uses one style for each class name.

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

This is necessary to preserve the CSS syntax and the concept of keeping track of classes.  
In this code, box and text are converted to class names with a prefix that makes the object a hash: .box_ybg34i .text_ybg34i  
These classes are designed to be used in CSS syntax.
