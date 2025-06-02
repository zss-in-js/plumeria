[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=brightgreen)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml)

# Plumeria 🍃 <br> The expressive CSS-in-JS library

> 🌸 Plumeria is a modern CSS-in-JS library focused on ergonomics, performance, and expressive design systems.

## 📘 Documentation

👉 [plumeria.dev](https://plumeria.dev) — Full guides and API references

Each package has its own README, such as [@plumeria/core](https://github.com/zss-in-js/plumeria/tree/main/packages/core).

## ✨ Quick Example

```ts
import { css, cx } from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12,
  },
  size: {
    width: 120,
  },
});

const className = cx(styles.text, styles.size);
```

## 📦 Monorepo Structure

```vbnet
plumeria/
├── examples/         → Example apps and integrations
└── packages/
    ├── compiler/     → Style compiler and static extraction
    ├── core/         → Core runtime utilities (css, cx, etc.)
    ├── eslint-plugin/→ Lint rules for Plumeria conventions
    ├── next/         → Integration with Next.js
    └── vite/         → Plugin for Vite builds

```

## 🧑‍💻 Contributing

We welcome contributions of all kinds — bug reports, feature ideas, pull requests.

📄 [Contributing Guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

## ⚖️ License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/license).
