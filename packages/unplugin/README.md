# @plumeria/unplugin

This is a universal bundler plugin for Plumeria. Built on [unplugin](https://github.com/unjs/unplugin), it provides plugins for all major frontend build tools from a single codebase.

It completely eliminates runtime overhead by parsing Plumeria's Zero-Runtime CSS-in-JS at build time and extracting it as a virtual CSS module.

## Compatible Bundlers

- [Vite](https://vitejs.dev/)
- [Webpack](https://webpack.js.org/)
- [Rspack](https://www.rspack.dev/)
- [Farm](https://farmfe.org/)
- [Esbuild](https://esbuild.github.io/)
- [Rollup](https://rollupjs.org/)
- [Rolldown](https://rolldown.rs/)
- [Bun](https://bun.sh/)

## Installation

```bash
npm install -D @plumeria/unplugin
# or
yarn add -D @plumeria/unplugin
# or
pnpm add -D @plumeria/unplugin
# Alternatively,
bun add -D @plumeria/unplugin
```
## How to Use

Import `@plumeria/unplugin` in the configuration file of each bundler, and register it as a plugin by calling the bundler-specific method (`vite()`, `webpack()`, etc.).

### Vite

```js
//vite.config.js
import { defineConfig } from 'vite';
import plumeria from '@plumeria/unplugin';

export default defineConfig({ 
  plugins: [ 
    plumeria.vite(), 
  ],
});
```

### Webpack

```js
// webpack.config.js
import plumeria from '@plumeria/unplugin';

export default { 
  plugins: [ 
    plumeria.webpack(), 
  ],
};
```

### Rspack

```js
// rspack.config.js
import plumeria from '@plumeria/unplugin';

export default  { 
  plugins: [ 
    plumeria.rspack(), 
  ],
};
```

### Farm

```js
// farm.config.js
import { defineConfig } from '@farmfe/core';
import plumeria from '@plumeria/unplugin';

export default defineConfig({ 
  plugins: [ 
    plumeria.farm({ devEmitToDisk: true }), 
  ],
});
```

### Esbuild

```js
// build.js
import { build } from 'esbuild';
import plumeria from '@plumeria/unplugin';

build({ 
  entryPoints: ['src/index.tsx'], 
  bundle: true, 
  outfile: 'dist/out.js', 
  plugins: [ 
    plumeria.esbuild(), 
  ],
}).catch(() => process.exit(1));
```

### Rollup
```js
// rollup.config.js
import plumeria from '@plumeria/unplugin';
export default {
  input: 'src/index.tsx',
  plugins: [
    plumeria.rollup(),
  ],
};
```

### Rolldown
```js
// rolldown.config.js
import plumeria from '@plumeria/unplugin';
export default {
  input: 'src/index.tsx',
  plugins: [
    plumeria.rolldown(),
  ],
};
```

### Bun
```js
// build.js
import plumeria from '@plumeria/unplugin';
await Bun.build({
  entrypoints: ['./src/index.tsx'],
  outdir: './dist',
  plugins: [
    plumeria.bun(),
  ],
});
```
## Options

You can control the files to be converted by passing options when calling the plugin. By default `ts/tsx/js/jsx` is targeted.

```js
plumeria.vite({
  include: ['**/*.{ts,tsx}'],
  exclude: ['**/node_modules/**'],
  devEmitToDisk: false,
  styleProp: 'sx',
});
```

| Option | Default | Description |
| :-- | :-- | :-- |
| `include` | `ts/tsx/js/jsx` | Files to transform. |
| `exclude` | — | Files to skip. |
| `devEmitToDisk` | `false` | Write CSS to disk in development so the bundler's watcher drives HMR. |
| `styleProp` | `'classStyle'` | The JSX prop that carries styles. |

### styleProp

Renaming the prop takes two steps, and they have to agree. Tell the plugin:

```js
plumeria.vite({ styleProp: 'sx' });
```

and declare the same name for TypeScript. `@plumeria/core` ships no prop declaration of its own, so add one file to your project:

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

For the default name, reference the declaration that ships with the package instead:

```ts
// plumeria.d.ts
/// <reference types="@plumeria/core/class-style" />
```

If the two disagree, the prop type-checks but is never compiled away. [`@plumeria/eslint-plugin`](https://www.npmjs.com/package/@plumeria/eslint-plugin) reads the same name from `settings.plumeria.styleProp`.

## Development Mode and HMR (Hot Module Replacement)

`@plumeria/unplugin` provides HMR optimized for each bundler in development mode (dev server).

- **Vite / Farm / Webpack / Rspack**: The extracted stylesheet is served as a virtual module and reloaded only when its content actually changed, so a style edit updates in place without a repaint.

## Testing

`@plumeria/unplugin/factory` exposes the plugin behind every bundler entry, so a test can drive its `transform`, `resolveId` and `load` hooks directly and assert on the compiled output with no bundler in between. See [Testing](https://plumeria.dev/docs/testing) for the example, and for the component behavior and rendered-page checks that complement it.

## API Stability

**Stability: Frozen** — the signature will not change; behaviour may still be corrected.
See [API Stability](https://github.com/zss-in-js/plumeria#api-stability).

## License

Plumeria is [MIT licensed](https://github.com/zss-in-js/plumeria/blob/main/LICENSE).
