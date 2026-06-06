/**
 * @fileoverview Disallow styleName prop in files that do not import @plumeria
 */

import type { Rule } from 'eslint';
import type { JSXAttribute } from 'estree-jsx';

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

      JSXAttribute(node: JSXAttribute & Rule.NodeParentExtension) {
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
