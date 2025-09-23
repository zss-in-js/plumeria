/**
 * @fileoverview Restrict destructure css.create and css.global
 * Compatible with eslint 8 and below or 9 and above
 */

'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow destructuring css.props and css.global',
      recommended: true,
    },
    messages: {
      noDestructure:
        'Do not destructure "{{name}}" from "css". Use dot notation instead.',
    },
    schema: [],
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          node.id.type === 'ObjectPattern' &&
          node.init &&
          node.init.type === 'Identifier' &&
          node.init.name === 'css'
        ) {
          for (const prop of node.id.properties) {
            if (
              prop.type === 'Property' &&
              prop.key.type === 'Identifier' &&
              (prop.key.name === 'create' ||
                prop.key.name === 'props' ||
                prop.key.name === 'keyframes' ||
                prop.key.name === 'viewTransition' ||
                prop.key.name.startsWith('define'))
            ) {
              context.report({
                node: prop,
                messageId: 'noDestructure',
                data: { name: prop.key.name },
              });
            }
          }
        }
      },
    };
  },
};
