import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import objectCss from 'eslint-plugin-object-css';

const __dirname = import.meta.dirname;
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  eslint.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{ts,js,jsx,tsx}'],
    plugins: {
      'object-css': objectCss,
    },
    rules: {
      'object-css/recess-order': 'warn',
      'object-css/valid-value': 'error',
    },
  },
];

export default eslintConfig;
