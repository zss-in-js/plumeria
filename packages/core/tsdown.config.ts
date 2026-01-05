import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    clean: true,
    dts: true,
    format: ['esm'],
    entry: ['src/css.ts'],
    hash: false,
  },
]);
