import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { plumeria } from '@plumeria/eslint-plugin';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  plumeria.flatConfigs.recommended,
  {
    ignores: ['**/dist/**', '**/vite-plugin/**', '**/.*/**', '**/*.js'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
);
