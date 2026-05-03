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

You can control the files to be converted by passing options when calling the plugin. By default, `\.(ts|tsx|js|jsx)$` is targeted.

```js
plumeria.vite({
// Files to be converted
include: [/\.[jt]sx?$/],
// Files to exclude from conversion
exclude: [/node_modules/],

// Whether to emit styles to disk in development mode
devEmitToDisk: false,
});
```
## Development Mode and HMR (Hot Module Replacement)

`@plumeria/unplugin` provides HMR optimized for each bundler in development mode (dev server).

- **Vite / Farm / Webpack / Rspack**: The plugin extracts styles as virtual CSS modules, enabling seamless updates via hot reloading.