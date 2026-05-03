import { defineConfig } from 'rolldown';
import plumeria from '@plumeria/unplugin';
import postcss from 'rollup-plugin-postcss';

export default defineConfig({
  input: 'src/index.tsx',
  output: {
    dir: 'dist',
  },
  moduleTypes: {
    css: 'empty',
  },
  plugins: [plumeria.rolldown(), postcss({ extract: true })],
});
