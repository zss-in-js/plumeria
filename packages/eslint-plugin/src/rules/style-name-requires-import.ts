/**
 * @fileoverview Disallow styleName prop in files that do not import @plumeria
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Rule } from 'eslint';

export const styleNameRequiresImport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow styleName prop in files without a @plumeria/core import',
    },
    messages: {
      styleNameError: 'styleName requires importing "@plumeria/core".',
    },
    schema: [],
  },

  create(context) {
    let hasPlumeriaImport = false;
    const styleNameNodes: Rule.Node[] = [];

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source === 'string' && source.startsWith('@plumeria/core')) {
          hasPlumeriaImport = true;
        }
      },

      JSXAttribute(node: Rule.Node & { name: { name?: string } }) {
        if (node.name && node.name.name === 'styleName') {
          styleNameNodes.push(node);
        }
      },

      'Program:exit'() {
        if (!hasPlumeriaImport) {
          for (const node of styleNameNodes) {
            context.report({
              node,
              messageId: 'styleNameError',
            });
          }
        }
      },
    };
  },
};
