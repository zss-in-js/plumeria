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

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  text: {
    color: 'yellow',
  },
  box: {
    width: '100%',
    background: 'rgb(60,60,60)',
  },
});

const className = css.props(styles.text, styles.box);
```

Plumeria compiles each style property into a unique, **atomic**, and **hashed** class name. This prevents style collisions and maximizes reusability.

**Generated CSS:**

```css
.xxr7afjw {
  color: yellow;
}
.xq97ksf4 {
  width: 100%;
}
.xk450ff8 {
  background: rgb(60, 60, 60);
}
```

**Resulting:**

```
className: "xxr7afjw xq97ksf4 xk450ff8"
```

## Documentation

Read the [documentation](https://plumeria.dev/) for more details.

## Integration

- [Vite](https://plumeria.dev/docs/integration/vite)
- [Next](https://plumeria.dev/docs/integration/next)
- [Webpack](https://plumeria.dev/docs/integration/webpack)
- [CLI](https://plumeria.dev/docs/integration/cli)
- [ESLint](https://plumeria.dev/docs/integration/eslint)

## Acknowledgement

Plumeria is made possible thanks to the inspirations from the following projects:

> in alphabetical order

- [Linaria](https://linaria.dev/)
- [React Native](https://reactnative.dev/docs/stylesheet)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [StyleX](https://stylexjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Uno CSS](https://unocss.dev/)

## License

[MIT](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) License &copy; 2023-PRESENT [Refirst 11](https://github.com/refirst11)
