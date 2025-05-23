/**
 * @fileoverview Restrict calls inside a function
 * Compatible with eslint 8 and below or 9 and above
 */

'use strict';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'An error occurs if a specific call is made within a function',
      recommended: true,
    },
    messages: {
      noInnerCall: 'Do not use {{name}} inside functions',
    },
  },
  create(context) {
    let functionDepth = 0;

    return {
      FunctionDeclaration() {
        functionDepth++;
      },
      FunctionExpression() {
        functionDepth++;
      },
      ArrowFunctionExpression() {
        functionDepth++;
      },
      'FunctionDeclaration:exit'() {
        functionDepth--;
      },
      'FunctionExpression:exit'() {
        functionDepth--;
      },
      'ArrowFunctionExpression:exit'() {
        functionDepth--;
      },
      CallExpression(node) {
        if (functionDepth > 0) {
          if (node.callee.type === 'MemberExpression') {
            const objectName = node.callee.object.name;
            const propertyName = node.callee.property.name;

            if (objectName === 'css') {
              const fullName = `${objectName}.${propertyName}`;
              if (
                propertyName === 'create' ||
                propertyName === 'global' ||
                propertyName === 'keyframes' ||
                propertyName === 'defineVars' ||
                propertyName === 'defineTheme'
              ) {
                context.report({
                  node,
                  messageId: 'noInnerCall',
                  data: { name: fullName },
                });
              }
            }
          }
        }
      },
    };
  },
};
