import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    clean: true,
    dts: true,
    format: ['cjs'],
    entry: ['src/css.ts'],
    hash: false,
  },
  {
    clean: true,
    dts: false,
    format: ['esm'],
    entry: ['src/css.ts'],
    hash: false,
  },
]);
