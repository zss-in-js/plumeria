# Plumeria &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-lightyellow.svg)](https://github.com/zss-in-js/plumeria/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@plumeria/core.svg?color=red)](https://www.npmjs.com/package/@plumeria/core) [![tests](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml/badge.svg)](https://github.com/zss-in-js/plumeria/actions/workflows/tests.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-na.svg)](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md)

## Documentation

[Documentation Website](https://plumeria.dev)

Readme for [@plumeria/core](https://github.com/zss-in-js/plumeria/tree/main/packages/core) is in packages/core.

### Example

Here is a simple example of Plumeria use:

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

const style = cx(styles.text, styles.size);
```

## Development

This is the development monorepo for Plumeria

### Structure

- `examples`

  - Contains example apps using Plumeria.

- `packages`
  - Contains the Plumeria monorepo
  - [compiler](https://github.com/zss-in-js/plumeria/tree/main/packages/compiler)
  - [core](https://github.com/zss-in-js/plumeria/tree/main/packages/core)
  - [eslint-plugin](https://github.com/zss-in-js/plumeria/tree/main/packages/eslint-plugin)
  - [next](https://github.com/zss-in-js/plumeria/tree/main/packages/next)
  - [vite](https://github.com/zss-in-js/plumeria/tree/main/packages/vite)

## Contributing

Development happens in the open on GitHub and we are grateful for contributions including bug fixes, improvements, and ideas.

### Contributing Guide

Read the [contributing guide](https://github.com/zss-in-js/plumeria/blob/main/.github/CONTRIBUTING.md) to learn about our development process, how to propose bug fixes and improvements, and how to build and test your changes.

### License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/license).
