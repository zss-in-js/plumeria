# @plumeria/core

Plumeria is a CSS-in-JS built using [**zss-engine**](https://www.npmjs.com/package/zss-engine) and [**zss-utils**](https://www.npmjs.com/package/zss-utils) that provides a speedy development cycle.

## Installation

To start using Plumeria, install the following two packages:

```sh
npm install --save @plumeria/core
```

### Compiler

To compile `@plumeria/core`, for example, to use `npx css`, install  
[`@plumeria/compiler`](https://www.npmjs.com/package/@plumeria/compiler) for static extraction through the Command Line.  
Also, it can be easily integrated into the build process.

The compiler is built using [**SWC**](https://swc.rs/) and performs high-speed transpilation in memory.

```sh
npm install --save-dev @plumeria/compiler
```

### Static StyleSheet

Import stylesheet in your application's entry point.  
CSS for all APIs is collected here.

Applies the static stylesheet for production environments.

```ts
import '@plumeria/core/stylesheet';
```

## API

### css.create()

Styles are defined as a map of CSS rules using css.create(). In the example below, there are 2 different CSS rules. The names "box" and "text" are arbitrary names given to the rules.

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
Due to restrictions on avoiding collisions in HTML selectors, css.global() is designed to throw a compilation error if written more than once.

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

### rx

### React JSX only features

React `inline-style` are **offloaded** using only static sheet the css variables.  
It is can pass states to multiple variables at once.

```ts
'use client';

import { useState } from 'react';
import { css, rx } from '@plumeria/core';

const styles = css.create({
  bar: {
    width: 'var(--width)',
    background: 'aqua',
  },
});

export const Component = () => {
  const [state, setState] = useState(0);
  return (
    <di>
      <button onClick={() => setState((prev) => prev + 10)}>count</button>
      <div {...rx(styles.bar, { '--width': state + 'px' })} />
    </di>
  );
};
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
