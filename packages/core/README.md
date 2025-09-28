# @plumeria/core

The atomic on-demand CSS-in-JS.

### Quick Example

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12,
    color: 'navy',
  },
  size: {
    width: 120,
  },
});

const className = css.props(styles.text, styles.size);
```

Plumeria compiles each style property into a unique, **atomic**, and **hashed** class name. This prevents style collisions and maximizes reusability.

**Generated CSS:**

```css
.x1p2jzyu {
  font-size: 12px;
}
.xzie71ek {
  color: navy;
}
.xgpw2mmc {
  width: 120px;
}
```

**Resulting:**

```
className: "x1p2jzyu xzie71ek xgpw2mmc"
```

## Documentation

Read the [documentation](https://plumeria.dev/) for more details.

## Installation

- [Vite](https://plumeria.dev/docs/integration/vite)
- [Next](https://plumeria.dev/docs/integration/next)
- [Webpack](https://plumeria.dev/docs/integration/webpack)
- [CLI](https://plumeria.dev/docs/integration/cli)
- [ESLint](https://plumeria.dev/docs/integration/eslint)

## Acknowledgement

Plumeria is made possible thanks to the inspirations from the following projects:

- [Linaria](https://linaria.dev/)
- [React Native](https://reactnative.dev/docs/stylesheet)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [StyleX](https://stylexjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Uno CSS](https://unocss.dev/)

## License

[MIT](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) License &copy; 2023-PRESENT [Refirst 11](https://github.com/refirst11)
