import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import zsslint from 'eslint-plugin-zss-lint';

const eslintConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  zsslint.flatConfigs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/packages/collection/**',
      '**/.next/**',
      '**/*.js',
      '**/*css.mjs',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);

export default eslintConfig;
