import { FlatCompat } from '@eslint/eslintrc';
import plumeria from '@plumeria/eslint-plugin';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{ts,js,jsx,tsx}'],
    plugins: {
      '@plumeria': plumeria,
    },
  },
  ...compat.extends('plugin:@plumeria/recommended'),
];

export default eslintConfig;
