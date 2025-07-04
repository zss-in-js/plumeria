[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=brightgreen)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml)

# Plumeria — Zero-Runtime CSS-in-JS

Scalable and intuitive styling in design systems.

## Features

- ⚡ Atomic CSS generation for scalability
- ✨ Minimal and optimized CSS output
- 🎨 Ergonomic API for expressive design systems
- ⚜️ Works with most JavaScript frameworks

## 📘 Documentation

📖 [plumeria.dev](https://plumeria.dev) — Full guides and API references

Each package has its own README, such as [@plumeria/core](https://github.com/zss-in-js/plumeria/tree/main/packages/core).

## ✨ Quick Example

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12, // xhash1x
    color: 'navy', // xhash2x
  },
  size: {
    width: 120, // xhash3x
  },
});

const className = styles.$text; // (string)
// className is "xhash1x xhash2x"

const classNames = css.props(styles.text, styles.size); // (object to string)
// classNames is "xhash1x xhash2x xhash3x"
```

## 📦 Monorepo Structure

```
plumeria/
├── docs/             → Documentation website (Next.js + fuma-docs)
├── examples/         → Example apps and integrations
└── packages/
    ├── compiler/     → Style compiler and static extraction
    ├── core/         → Core runtime utilities (css, ps, etc.)
    ├── eslint-plugin/→ Lint rules for Plumeria conventions
    ├── next/         → Integration with Next.js
    └── vite/         → Plugin for Vite builds

```

## 🧑‍💻 Contributing

We welcome contributions of all kinds — bug reports, feature ideas, pull requests.

📄 [Contributing Guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

## ⚖️ License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/license).
