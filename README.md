# Plumeria &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=brightgreen)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml) [![codecov](https://codecov.io/github/zss-in-js/plumeria/graph/badge.svg?token=BMEGY37BYZ)](https://codecov.io/github/zss-in-js/plumeria)

An atomic CSS runtime designed to disappear.

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

## Structure

```
plumeria/
├── docs/               → Documentation website
├── examples/           → Example apps and integrations
└── packages/
    ├── compiler/          → CLI for swc-based static extraction
    ├── core/              → API built on the zss-engine
    ├── eslint-plugin/     → Plugin for ESLint
    ├── next-plugin/       → Plugin for Integration with Next.js
    ├── postcss-plugin/    → Plugin for PostCSS CSS static extraction
    ├── utils/             → Utils for Plugin parser and transformer
    ├── turbopack-loader/  → Loader for Integration with Turbopack
    ├── vite-plugin/       → Plugin for integration with Vite
    └── webpack-plugin/    → Plugin for integration with Webpack

```

## Contributing

We welcome contributions of all kinds — bug reports, feature ideas, pull requests.

[Contributing Guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

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

- [Linaria](https://linaria.dev/) - for inspiring the Zero-Runtime architecture
- [React Native](https://reactnative.dev/docs/stylesheet) - for inspiring the class API and inline styling
- [React Native for Web](https://necolas.github.io/react-native-web/) - for inspiring the port of React Native to the web
- [StyleX](https://stylexjs.com/) - for inspiring the optimization of atomic css
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the utility approach
- [Uno CSS](https://unocss.dev/) - for inspiring the engine concepts

## License

[MIT](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) License &copy; 2023-PRESENT [Refirst 11](https://github.com/refirst11)
