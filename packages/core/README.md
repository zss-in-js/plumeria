# @plumeria/core

**Type-Only CSS Extract**  
Build-time Compilation・No Bundle Size

```ts
import * as css from '@plumeria/core';

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

**Compiled:**

```tsx
className="xhrr6ses xvbwmxqp xhk51flp"
```

**Generated CSS:**

```css
.xhrr6ses:not(#\#) {
  font-size: 12px;
}
.xvbwmxqp {
  color: navy;
}
.xhk51flp {
  width: 120px;
}
```

## Documentation

Read the [documentation](https://plumeria.dev/) for more details.

## Installation

- [Vite](https://plumeria.dev/docs/integration/vite)
- [Next](https://plumeria.dev/docs/integration/next)
- [Turbopack](https://plumeria.dev/docs/integration/turbopack)
- [Webpack](https://plumeria.dev/docs/integration/webpack)
- [PostCSS](https://plumeria.dev/docs/integration/postcss)
- [ESLint](https://plumeria.dev/docs/integration/eslint)

## Acknowledgements

Plumeria is made possible thanks to the inspirations from the following projects:

- [Linaria](https://linaria.dev/)
- [React Native](https://reactnative.dev/docs/stylesheet)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [StyleX](https://stylexjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Uno CSS](https://unocss.dev/)

## License

[MIT](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) License &copy; 2023-PRESENT [Refirst 11](https://github.com/refirst11)
