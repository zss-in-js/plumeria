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
      description: 'Disallow destructuring css.create and css.global',
      recommended: true,
    },
    messages: {
      noDestructure:
        'Do not destructure "{{name}}" from "css". Use dot notation instead.',
    },
    schema: [],
  },
  create(context) {
    const isCssIdentifier = (node) =>
      node.type === 'Identifier' && node.name === 'css';

    return {
      VariableDeclarator(node) {
        if (
          node.id.type === 'ObjectPattern' &&
          node.init &&
          isCssIdentifier(node.init)
        ) {
          const forbiddenKeys = ['create', 'global'];
          const violated = node.id.properties.filter(
            (prop) =>
              prop.type === 'Property' &&
              prop.key.type === 'Identifier' &&
              forbiddenKeys.includes(prop.key.name),
          );

          if (violated.length > 0) {
            for (const prop of violated) {
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
