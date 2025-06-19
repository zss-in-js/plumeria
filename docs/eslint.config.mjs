import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import plumeria from '@plumeria/eslint-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  plumeria.flatConfigs.recommended,
  eslint.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{ts,js,jsx,tsx}'],
  },
];

export default eslintConfig;
