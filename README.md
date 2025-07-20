[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=brightgreen)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml)

# Plumeria

Plumeria is a JavaScript library for Scalable and optimized styling.

## Documentation

[plumeria.dev](https://plumeria.dev) — Full guides and API references

There is also a small documentation in [@plumeria/core](https://github.com/zss-in-js/plumeria/tree/main/packages/core).

## Quick Example

```ts
import { css } from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12, // xxxhash1
    color: 'navy', // xxxhash2
  },
  size: {
    width: 120, // xxxhash3
  },
});

const className = css.props(styles.text, styles.size);
// className is "xxxhash1 xxxhash2 xxxhash3"
```

## Structure

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

## Contributing

We welcome contributions of all kinds — bug reports, feature ideas, pull requests.

[Contributing Guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

## Acknowledgement

- [Linaria](https://linaria.dev/) - for inspiring the Zero-Runtime architecture
- [ReactNative](https://reactnative.dev/docs/stylesheet) - for inspiring the class API and inline styling
- [StyleX](https://stylexjs.com/) - for inspiring the optimization of atomic CSS-in-JS
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the utility approach
- [Uno CSS](https://unocss.dev/) - for inspiring the core concepts

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/license).
