import { noDestructure } from './rules/no-destructure';
import { noInnerCall } from './rules/no-inner-call.js';
import { noUnusedKeys } from './rules/no-unused-keys';
import { sortProperties } from './rules/sort-properties';
import { validateValues } from './rules/validate-values';

const rules = {
  'no-destructure': noDestructure,
  'no-inner-call': noInnerCall,
  'no-unused-keys': noUnusedKeys,
  'sort-properties': sortProperties,
  'validate-values': validateValues,
};

const configs = {
  recommended: {
    plugins: ['@plumeria'],
    rules: {
      '@plumeria/no-destructure': 'error',
      '@plumeria/no-inner-call': 'error',
      '@plumeria/no-unused-keys': 'warn',
      '@plumeria/sort-properties': 'warn',
      '@plumeria/validate-values': 'warn',
    },
  },
};

const flatConfigs = {
  recommended: {
    plugins: {
      '@plumeria': {
        rules,
      },
    },
    rules: {
      '@plumeria/no-destructure': 'error',
      '@plumeria/no-inner-call': 'error',
      '@plumeria/no-unused-keys': 'warn',
      '@plumeria/sort-properties': 'warn',
      '@plumeria/validate-values': 'warn',
    },
  },
};

module.exports = {
  rules,
  configs,
  flatConfigs,
};
