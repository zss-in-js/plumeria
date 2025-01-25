import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import objectCss from 'eslint-plugin-object-css';

const eslintConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  objectCss.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
  }
);

export default eslintConfig;
