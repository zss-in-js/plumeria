# @plumeria/core

Plumeria is a JavaScript library for Scalable and optimized styling.

## 🌱 Installation

To get started with Plumeria, install the core package:

```sh
npm install @plumeria/core
```

### Compiler (for static extraction)

If you want to extract styles at build time using commands like `npx css`, install:

```sh
npm install --save-dev @plumeria/compiler
```

More at: [@plumeria/compiler on npm](https://www.npmjs.com/package/@plumeria/compiler)

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
    color: 'yellow', // xxxhash1
  },
  box: {
    width: '100%', // xxxhash2
    background: 'rgb(60,60,60)', // xxxhash3
  },
});
```

### css.props()

Use `css.props()` to combine multiple styles or switch between them conditionally.  
css.props is compiled and style properties to the right take precedence.  
The same goes for shorthand and longhand rules.

```jsx
<div className={css.props(styles.text, styles.box)} />
//   className="xxxhash1 xxxhash2 xxxhash3"
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

## ESLint Support

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

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
