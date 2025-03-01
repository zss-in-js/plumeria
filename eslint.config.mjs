import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import objectCss from 'eslint-plugin-object-css';

const eslintConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
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
    plugins: {
      'object-css': objectCss,
    },
    rules: {
      'object-css/valid-value': 'warn',
      'object-css/recess-order': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);

export default eslintConfig;
