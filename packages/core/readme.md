# @plumeria/core

## Installation

To start using with Plumeria you can install just core packages:

```sh
npm install --save @plumeria/core
```

## API

### css.create()

Styles are defined as a map of CSS rules using css.create(). In the example below, there are 2 different CSS rules. The names "box" and "text" are arbitrary names given to the rules.

```tsx
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

```ts
const styles = css.create({
  box: {
    [css.media.max('width: 900px')]: {
      width: '100%',
      color: 'rgb(60,60,60)',
    },
  },
  text: {
    [css.pseudo.hover]: {
      color: 'yellow',
      opacity: 0.9,
    },
  },
});
```

### css.global()

This API lets you define global CSS.
You need to import the file containing css.global() wherever you use it (e.g. the top-level root).

```ts
css.global({
  h2: {
    fontSize: 24,
  },
  h3: {
    fontSize: 34,
  },
});
```

The compiler extracts the CSS rules, replacing the rules in the source code with the compiled CSS.

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
const colors = css.defineThemeVars({
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

### css.colors.darken()

Mixes #000 or #FFF into the color.  
The first argument takes the color and the second argument takes the same value as opacity (string % or number).

```ts
css.colors.darken('skyblue', 0.12);
css.colors.darken('skyblue', '12%');
```

## Linter

[eslint-plugin-object-css](https://www.npmjs.com/package/eslint-plugin-object-css) can be used with Plumeria.  
Type safety relies on this eslint-plugin. It includes 397 properties, excluding deprecated and experimental.

## How Plumeria works

Plumeria complies with Semantic HTML, which means that it uses one style for each class name.

```tsx
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
