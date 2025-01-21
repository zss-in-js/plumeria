# Plumeria

## Documentation

[Documentation Website](https://plumeria-docs.vercel.app/)

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

- `example`

  - Contains example apps using Plumeria and eslint-plugin.

- `packages`
  - Contains the Plumeria monorepo
  - [collection](https://github.com/zss-in-js/plumeria/tree/main/packages/collection)
  - [compiler](https://github.com/zss-in-js/plumeria/tree/main/packages/compiler)
  - [core](https://github.com/zss-in-js/plumeria/tree/main/packages/core)
  - [next](https://github.com/zss-in-js/plumeria/tree/main/packages/next)

## Contributing

Development happens in the open on GitHub and we are grateful for contributions including bug fixes, improvements, and ideas.

### Contributing Guide

Read the [contributing guide](https://github.com/zss-in-js/plumeria/blob/main/CONTRIBUTING.md) to learn about our development process, how to propose bug fixes and improvements, and how to build and test your changes.

### License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/license).
