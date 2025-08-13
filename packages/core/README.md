# @plumeria/core

Plumeria is a JavaScript library for scalable and optimized styling.

## Installation

To get started with Plumeria, install the core package:

```sh
npm install @plumeria/core
```

### Compiler

Install the `css` command to extract styles at build time:

```sh
npm install --save-dev @plumeria/compiler
```

### Stylesheet Import

In your app entry point, import the compiled CSS file:

```ts
import '@plumeria/core/stylesheet.css';
```

## API

### css.create()

Define a set of atomic styles:

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  text: {
    color: 'yellow', // zxxxxxx1
  },
  box: {
    width: '100%', // zxxxxxx2
    background: 'rgb(60,60,60)', // zxxxxxx3
  },
});
```

### css.props()

Use `css.props()` to combine multiple styles or switch between them conditionally.  
css.props is compiled and style properties to the right take precedence.

```jsx
<div className={css.props(styles.text, styles.box)} />
//   className="zxxxxxx1 zxxxxxx2 zxxxxxx3"
```

Shorthand and longhand property rules follow the same principles as CSS rules.

---

It supports media query pseudo-classes and elements in a familiar syntax.

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  box: {
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
  text: {
    color: '#333',
    ':hover': {
      color: 'skyblue',
      opacity: 0.9,
    },
  },
});
```

## ESLint Support

The [@plumeria/eslint-plugin](https://www.npmjs.com/package/@plumeria/eslint-plugin) provides recommended rules:

### Rules: recommended

```
- no-destructure: error
- no-inner-call: error
- no-unused-keys: warn
- sort-properties: warn
- validate-values: warn
```

It plugin provides autocomplete and validation support.

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
