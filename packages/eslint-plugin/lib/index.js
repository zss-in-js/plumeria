'use strict';

const noInnerCall = require('./rules/no-inner-call.js');
const noUnusedKeys = require('./rules/no-unused-keys.js');
const sortProperties = require('./rules/sort-properties.js');
const validateValues = require('./rules/validate-values.js');

const rules = {
  'no-inner-call': noInnerCall,
  'no-unused-keys': noUnusedKeys,
  'sort-properties': sortProperties,
  'validate-values': validateValues,
};

const configs = {
  recommended: {
    plugins: ['@plumeria'],
    rules: {
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
