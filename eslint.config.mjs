import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import plumeria from '@plumeria/eslint-plugin';

const eslintConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  plumeria.flatConfigs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.astro/**',
      '**/*.js',
      '**/.react-router/types/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
);

export default eslintConfig;
