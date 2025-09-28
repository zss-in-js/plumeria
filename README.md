# Plumeria &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=brightgreen)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml)

The atomic on-demand CSS-in-JS.

## Quick Example

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

**Output:**

Plumeria compiles each style property into a unique, **atomic**, and **hashed** class name. This prevents style collisions and
maximizes reusability.

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

## Structure

```
plumeria/
├── docs/               → Documentation website
├── examples/           → Example apps and integrations
└── packages/
    ├── compiler/       → CLI for Rust-based static extraction
    ├── core/           → API built on the zss-engine
    ├── eslint-plugin/  → Plugin for ESLint
    ├── next-plugin/    → Plugin for Integration with Next.js
    ├── vite-plugin/    → Plugin for integration with Vite
    └── webpack-plugin/ → Plugin for integration with Webpack

```

## Contributing

We welcome contributions of all kinds — bug reports, feature ideas, pull requests.

[Contributing Guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

## Documentation

Read the [documentation](https://plumeria.dev/) for more details.

## Installation

- [Vite](https://plumeria.dev/docs/integration/vite)
- [Next](https://plumeria.dev/docs/integration/next)
- [Webpack](https://plumeria.dev/docs/integration/webpack)
- [CLI](https://plumeria.dev/docs/integration/cli)
- [ESLint](https://plumeria.dev/docs/integration/eslint)

## Acknowledgement

- [Linaria](https://linaria.dev/) - for inspiring the Zero-Runtime architecture
- [React Native](https://reactnative.dev/docs/stylesheet) - for inspiring the class API and inline styling
- [React Native for Web](https://necolas.github.io/react-native-web/) - for inspiring the port of React Native to the web
- [StyleX](https://stylexjs.com/) - for inspiring the optimization of atomic css
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the utility approach
- [Uno CSS](https://unocss.dev/) - for inspiring the engine concepts

## License

[MIT](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) License &copy; 2023-PRESENT [Refirst 11](https://github.com/refirst11)
