# @plumeria/next-plugin

Next.js plugin for Plumeria.  
It registers the compiler with Turbopack and Webpack, and emits the project's stylesheet at build time.

## Installation

```bash
npm install -D @plumeria/next-plugin
# or
yarn add -D @plumeria/next-plugin
# or
pnpm add -D @plumeria/next-plugin
```

No PostCSS setup is required. `@plumeria/postcss-plugin` was removed in 17.0.0 — if you are upgrading, delete `postcss.config.js` and the `@plumeria` at-rule from your global stylesheet.

## How to Use

Wrap your config with `withPlumeria`. It works with both Turbopack and Webpack.

```ts
// next.config.ts
import type { NextConfig } from 'next';
import { withPlumeria } from '@plumeria/next-plugin';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPlumeria(nextConfig);
```

Then declare the styling prop once in your project. `@plumeria/core` ships no prop declaration of its own, so nothing is accepted on host elements until you do:

```ts
// plumeria.d.ts
/// <reference types="@plumeria/core/style-name" />
```

## Options

Options are passed as the second argument.

```ts
export default withPlumeria(nextConfig, {
  styleProp: 'sx',
  include: ['./src/**/*.{ts,tsx}'],
  exclude: ['**/node_modules/**', '**/.next/**'],
});
```

| Option | Default | Description |
| :-- | :-- | :-- |
| `styleProp` | `'styleName'` | The JSX prop that carries styles. |
| `include` | all `js/jsx/ts/tsx` | Globs the stylesheet is compiled from. |
| `exclude` | `node_modules`, `dist`, `.next` | Globs excluded from that compilation. |

### styleProp

Renaming the prop takes two steps, and they have to agree. Tell the plugin:

```ts
export default withPlumeria(nextConfig, { styleProp: 'sx' });
```

and declare the same name for TypeScript instead of referencing the default:

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

If the two disagree, the prop type-checks but is never compiled away. [`@plumeria/eslint-plugin`](https://www.npmjs.com/package/@plumeria/eslint-plugin) reads the same name from `settings.plumeria.styleProp`.

### include / exclude

The stylesheet is compiled from every source file by default. Narrowing the globs reduces build times on large projects.

```ts
export default withPlumeria(nextConfig, {
  include: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
});
```

## Requirements

Turbopack rule conditions keep the compiler from being handed every module in the graph, `node_modules` included. They are a Next.js 16 option, and the plugin applies them only from 16.0.0 up — on 15.x the rule stays unfiltered and builds are slower. Everything else works on both.

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
