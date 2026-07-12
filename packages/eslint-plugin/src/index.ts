import { styleNameRequiresImport } from './rules/style-name-requires-import';
import { noCombinator } from './rules/no-combinator';
import { noDestructure } from './rules/no-destructure';
import { noInlineObject } from './rules/no-inline-object';
import { noInnerCall } from './rules/no-inner-call';
import { noInvalidSelector } from './rules/no-invalid-selector';
import { noMixedStylingProps } from './rules/no-mixed-styling-props';
import { noUnknownCssProperties } from './rules/no-unknown-css-properties';
import { noUnusedKeys } from './rules/no-unused-keys';
import { sortProperties } from './rules/sort-properties';
import { formatProperties } from './rules/format-properties';
import { validateValues } from './rules/validate-values';
import { validatePseudos } from './rules/validate-pseudos';

import type { Linter, Rule } from 'eslint';

type Rules = Record<string, Rule.RuleModule>;
type Configs = {
  recommended: Linter.Config;
};

const rules: Rules = {
  'style-name-requires-import': styleNameRequiresImport,
  'no-combinator': noCombinator,
  'no-destructure': noDestructure,
  'no-inline-object': noInlineObject,
  'no-inner-call': noInnerCall,
  'no-invalid-selector': noInvalidSelector,
  'no-mixed-styling-props': noMixedStylingProps,
  'no-unknown-css-properties': noUnknownCssProperties,
  'no-unused-keys': noUnusedKeys,
  'sort-properties': sortProperties,
  'format-properties': formatProperties,
  'validate-values': validateValues,
  'validate-pseudos': validatePseudos,
};

const configs: Configs = {
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
      '@plumeria/no-invalid-selector': 'error',
      '@plumeria/no-mixed-styling-props': 'error',
      '@plumeria/no-unknown-css-properties': 'error',
      '@plumeria/no-unused-keys': 'warn',
      '@plumeria/sort-properties': 'warn',
      '@plumeria/format-properties': 'warn',
      '@plumeria/validate-values': 'warn',
      '@plumeria/validate-pseudos': 'error',
    },
  },
};

const plugin: {
  rules: Record<string, Rule.RuleModule>;
  configs: {
    recommended: Linter.Config;
  };
} = {
  rules,
  configs,
};

export = plugin;
