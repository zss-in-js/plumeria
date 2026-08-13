import { propsRequireImport } from './rules/props-require-import';
import { noCombinator } from './rules/no-combinator';
import { noDestructure } from './rules/no-destructure';
import { noInlineObject } from './rules/no-inline-object';
import { noInnerCall } from './rules/no-inner-call';
import { noInvalidSelector } from './rules/no-invalid-selector';
import { noLogicalProperties } from './rules/no-logical-properties';
import { noMixedStylingProps } from './rules/no-mixed-styling-props';
import { noPhysicalProperties } from './rules/no-physical-properties';
import { noOrderDependentOverlap } from './rules/no-order-dependent-overlap';
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
  'props-require-import': propsRequireImport,
  'no-combinator': noCombinator,
  'no-destructure': noDestructure,
  'no-inline-object': noInlineObject,
  'no-inner-call': noInnerCall,
  'no-invalid-selector': noInvalidSelector,
  'no-logical-properties': noLogicalProperties,
  'no-mixed-styling-props': noMixedStylingProps,
  'no-physical-properties': noPhysicalProperties,
  'no-order-dependent-overlap': noOrderDependentOverlap,
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
      '@plumeria/props-require-import': 'error',
      '@plumeria/no-combinator': 'error',
      '@plumeria/no-destructure': 'error',
      '@plumeria/no-inline-object': 'error',
      '@plumeria/no-inner-call': 'error',
      '@plumeria/no-invalid-selector': 'error',
      '@plumeria/no-mixed-styling-props': 'error',
      '@plumeria/no-order-dependent-overlap': 'warn',
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
