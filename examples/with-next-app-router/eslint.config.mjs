import { FlatCompat } from '@eslint/eslintrc';
import zsslint from 'eslint-plugin-zss-lint';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{ts,js,jsx,tsx}'],
    plugins: {
      'zss-lint': zsslint,
    },
  },
  ...compat.extends('plugin:zss-lint/recommended'),
];

export default eslintConfig;
