import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { plumeria } from '@plumeria/eslint-plugin';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  plumeria.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
  },
);
