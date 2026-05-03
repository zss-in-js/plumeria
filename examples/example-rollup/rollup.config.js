import plumeria from '@plumeria/unplugin';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.tsx',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  plugins: [
    plumeria.rollup(),
    postcss({ extract: true }),
    resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development'),
      preventAssignment: true,
    }),
    esbuild({
      include: /\.[jt]sx?$/,
      sourceMap: false,
      minify: false,
      target: 'es2022',
      jsx: 'automatic',
    }),
  ],
};
