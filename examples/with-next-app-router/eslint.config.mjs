import { FlatCompat } from '@eslint/eslintrc';
import objectCss from 'eslint-plugin-object-css';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{ts,js,jsx,tsx}'],
    plugins: {
      'object-css': objectCss,
    },
  },
  ...compat.extends('plugin:object-css/recommended'),
];

export default eslintConfig;
