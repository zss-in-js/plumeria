import { noDestructure } from './rules/no-destructure';
import { noInnerCall } from './rules/no-inner-call';
import { noUnusedKeys } from './rules/no-unused-keys';
import { sortProperties } from './rules/sort-properties';
import { validateValues } from './rules/validate-values';
import type { ESLint, Linter, Rule } from 'eslint';

type PlumeriaPlugin = ESLint.Plugin & {
  rules: Record<string, Rule.RuleModule>;
  configs: {
    recommended: Linter.LegacyConfig;
  };
  flatConfigs: {
    recommended: Linter.Config;
  };
};

const rules: Record<string, Rule.RuleModule> = {
  'no-destructure': noDestructure,
  'no-inner-call': noInnerCall,
  'no-unused-keys': noUnusedKeys,
  'sort-properties': sortProperties,
  'validate-values': validateValues,
};

const configs: PlumeriaPlugin['configs'] = {
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
const flatConfigs: PlumeriaPlugin['flatConfigs'] = {
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

export const plumeria: PlumeriaPlugin = {
  rules,
  configs,
  flatConfigs,
};
