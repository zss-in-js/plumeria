import { styleNameRequiresImport } from './rules/style-name-requires-import';
import { noCombinator } from './rules/no-combinator';
import { noDestructure } from './rules/no-destructure';
import { noInlineObject } from './rules/no-inline-object';
import { noInnerCall } from './rules/no-inner-call';
import { noUnusedKeys } from './rules/no-unused-keys';
import { sortProperties } from './rules/sort-properties';
import { formatProperties } from './rules/format-properties';
import { validateValues } from './rules/validate-values';

import { noUnknownCssProperties } from './rules/no-unknown-css-properties';
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
  'style-name-requires-import': styleNameRequiresImport,
  'no-combinator': noCombinator,
  'no-destructure': noDestructure,
  'no-inline-object': noInlineObject,
  'no-inner-call': noInnerCall,
  'no-unknown-css-properties': noUnknownCssProperties,
  'no-unused-keys': noUnusedKeys,
  'sort-properties': sortProperties,
  'format-properties': formatProperties,
  'validate-values': validateValues,
};

const configs: PlumeriaPlugin['configs'] = {
  recommended: {
    plugins: ['@plumeria'],
    rules: {
      '@plumeria/style-name-requires-import': 'error',
      '@plumeria/no-combinator': 'error',
      '@plumeria/no-destructure': 'error',
      '@plumeria/no-inline-object': 'error',
      '@plumeria/no-inner-call': 'error',
      '@plumeria/no-unknown-css-properties': 'error',
      '@plumeria/no-unused-keys': 'warn',
      '@plumeria/sort-properties': 'warn',
      '@plumeria/format-properties': 'warn',
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
      '@plumeria/style-name-requires-import': 'error',
      '@plumeria/no-combinator': 'error',
      '@plumeria/no-destructure': 'error',
      '@plumeria/no-inline-object': 'error',
      '@plumeria/no-inner-call': 'error',
      '@plumeria/no-unknown-css-properties': 'error',
      '@plumeria/no-unused-keys': 'warn',
      '@plumeria/sort-properties': 'warn',
      '@plumeria/format-properties': 'warn',
      '@plumeria/validate-values': 'warn',
    },
  },
};

export const plumeria: PlumeriaPlugin = {
  rules,
  configs,
  flatConfigs,
};
