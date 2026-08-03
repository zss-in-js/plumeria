# @plumeria/core

![License](https://img.shields.io/badge/License-MIT-10B981)
![npm](https://img.shields.io/npm/v/@plumeria/core?&color=10B981)

![Web](https://img.shields.io/badge/Web-atomic-6366F1?logo=npm&logoColor=white)
![Types](https://img.shields.io/badge/Types-100%25-6366F1?logo=npm&logoColor=white)
![Runtime](https://img.shields.io/badge/Runtime-never-6366F1?logo=npm&logoColor=white)

**Plumeria** is a **zero-cost abstraction layer** for styling React components. You write type-safe styles in TypeScript, and the compiler resolves them into atomic CSS at build time — leaving no runtime JavaScript behind. Its axioms are grounded in category theory, making styles self-evident, predictable, and composable by construction, while strict syntax and linting keep the cognitive overhead low.

## Installation

`@plumeria/core` contains type definitions only. Which JSX prop carries styles is declared in your project — one line for the default `classStyle`, see [Declaring the styling prop](#declaring-the-styling-prop). Styles are compiled away at build time by a bundler integration — [`@plumeria/next-plugin`](https://www.npmjs.com/package/@plumeria/next-plugin) for Next.js, or [`@plumeria/unplugin`](https://www.npmjs.com/package/@plumeria/unplugin) for Vite, Webpack, and others.

```sh
pnpm add -D @plumeria/core
```

See the [installation guide](https://plumeria.dev/docs/getting-started/installation) for full setup, and [`@plumeria/eslint-plugin`](https://www.npmjs.com/package/@plumeria/eslint-plugin) for the linting rules.

## Example

Styles can be passed to the `classStyle` prop. That prop accepts static and dynamic styles as an array. At build time, the compiler resolves `classStyle` into a static `className`; dynamic values are passed as CSS variables through the `style` attribute — no runtime library is involved.

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
      classStyle={[
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

## Declaring the styling prop

The prop name is a build-time setting — `styleProp` on the bundler plugin — so `@plumeria/core` declares no prop of its own. Baking one in would let the types and the compiler disagree. Add one file to your project naming the prop you compile with.

For the default, `classStyle`, reference the declaration that ships with the package:

```ts
// plumeria.d.ts
/// <reference types="@plumeria/core/class-style" />
```

If you renamed the prop, declare that name on React's attribute interfaces instead. `Style` is the type of anything the prop accepts — a style, a conditional, or an array of them:

```ts
// plumeria.d.ts
import type { Style } from '@plumeria/core';

declare global {
  namespace React {
    interface HTMLAttributes<T> {
      sx?: Style
    }
    interface SVGAttributes<T> {
      sx?: Style
    }
  }
}
```

```tsx
<div sx={[styles.text, cond && styles.cond]} />
```

Declaration merging is additive, so several names can coexist during a migration. Whichever you declare has to match what the bundler plugin was given — if they disagree the prop type-checks but is never compiled away.

Explore the [documentation](https://plumeria.dev/) for the core principles, full API reference, and integrations.

## API Stability

Plumeria publishes frequently. To make that legible, every public API is rated for **future** change likelihood — not past churn. The rating is a commitment about what will happen next, not a description of what already has.

| API                    | Stability |        |
| ---------------------- | --------- | ------ |
| `css.create`           | ★★★★★     | Frozen |
| `css.createTheme`      | ★★★★★     | Frozen |
| `css.createStatic`     | ★★★★★     | Frozen |
| `css.keyframes`        | ★★★★★     | Frozen |
| `css.viewTransition`   | ★★★★★     | Frozen |
| `css.marker`           | ★★★★☆     | Stable |
| `css.extended`         | ★★★★☆     | Stable |
| `css.use`/`classStyle` | ★★★★★     | Frozen |

> The **`classStyle`** property can be changed.

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
