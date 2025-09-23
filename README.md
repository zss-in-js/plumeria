# Plumeria &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=brightgreen)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml)

Plumeria is a JavaScript library for scalable and optimized styling.

## Documentation

Visit our [official documentation](https://plumeria.dev).

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
.z1p2jzyu {
  font-size: 12px;
}
.zzie71ek {
  color: navy;
}
.zgpw2mmc {
  width: 120px;
}
```

**Resulting:**

```
className: "z1p2jzyu zzie71ek zgpw2mmc"
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

## Acknowledgement

- [Linaria](https://linaria.dev/) - for inspiring the Zero-Runtime architecture
- [React Native](https://reactnative.dev/docs/stylesheet) - for inspiring the class API and inline styling
- [React Native for Web](https://necolas.github.io/react-native-web/) - for inspiring the port of React Native to the web
- [StyleX](https://stylexjs.com/) - for inspiring the optimization of atomic css
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the utility approach
- [Uno CSS](https://unocss.dev/) - for inspiring the engine concepts

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/license).
