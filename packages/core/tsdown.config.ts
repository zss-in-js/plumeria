import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    clean: true,
    dts: true,
    format: ['cjs'],
    entry: ['src/index.ts', 'src/processors/css.ts', 'src/checker/index.ts'],
    hash: false,
  },
  {
    clean: true,
    dts: false,
    format: ['esm'],
    entry: ['src/index.ts', 'src/processors/css.ts', 'src/checker/index.ts'],
    hash: false,
  },
]);
