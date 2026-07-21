# @plumeria/core

![License](https://img.shields.io/badge/License-MIT-10B981)
![npm](https://img.shields.io/npm/v/@plumeria/core?&color=10B981)

![Web](https://img.shields.io/badge/Web-atomic-6366F1?logo=npm&logoColor=white)
![Types](https://img.shields.io/badge/Types-100%25-6366F1?logo=npm&logoColor=white)
![Runtime](https://img.shields.io/badge/Runtime-never-6366F1?logo=npm&logoColor=white)

**Plumeria** is a **zero-cost abstraction layer** for styling React components. You write type-safe styles in TypeScript, and the compiler resolves them into atomic CSS at build time — leaving no runtime JavaScript behind. Its axioms are grounded in category theory, making styles self-evident, predictable, and composable by construction, while strict syntax and linting keep the cognitive overhead low.

## Installation

`@plumeria/core` contains type definitions only — importing it augments React's JSX types so that styleName is accepted on host elements. Styles are compiled away at build time by a bundler integration — [`@plumeria/next-plugin`](https://www.npmjs.com/package/@plumeria/next-plugin) for Next.js, or [`@plumeria/unplugin`](https://www.npmjs.com/package/@plumeria/unplugin) for Vite, Webpack, and others.

```sh
pnpm add -D @plumeria/core
```

See the [installation guide](https://plumeria.dev/docs/getting-started/installation) for full setup, and [`@plumeria/eslint-plugin`](https://www.npmjs.com/package/@plumeria/eslint-plugin) for the linting rules.

## Example

Styles can be passed to the `styleName` prop. That prop accepts static and dynamic styles as an array. At build time, the compiler resolves `styleName` into a static `className`; dynamic values are passed as CSS variables through the `style` attribute — no runtime library is involved.

```tsx
import * as css from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: 12
  },
  cond: {
    background: 'navy'
  },
  scale: (value) => ({
    scale: value
  })
});

export default function App({ cond }) {
  const scale = useScale(); // from your own hook
  return (
    <div
      styleName={[
        styles.text,
        cond && styles.cond,
        styles.scale(scale)
      ]}
    />
  );
}
```

**Compiled:**

```tsx
<div
  className={'xhrr6ses ' + (cond ? 'xj00ajs1' : '') + ' xnoo1byz'}
  style={{ '--scale-value': scale }}
/>
```

**Generated CSS:**

```css
.xhrr6ses:not(#\#) {
  font-size: 12px;
}
.xj00ajs1 {
  background: navy;
}
.xnoo1byz {
  scale: var(--scale-value);
}
```

Explore the [documentation](https://plumeria.dev/) for the core principles, full API reference, and integrations.

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
