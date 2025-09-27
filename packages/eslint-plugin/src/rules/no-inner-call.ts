/**
 * @fileoverview Restrict calls inside a function
 * Compatible with eslint 8 and below or 9 and above
 */

import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

export const noInnerCall = createRule({
  name: 'no-inner-call',
  meta: {
    type: 'problem',
    docs: {
      description:
        'An error occurs if a specific call is made within a function',
    },
    messages: {
      noInnerCall: 'Do not use {{name}} inside functions',
    },
    schema: [],
  },
  defaultOptions: [],
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
          if (
            node.callee.type === 'MemberExpression' &&
            'name' in node.callee.object &&
            'name' in node.callee.property
          ) {
            const objectName = node.callee.object.name;
            const propertyName = node.callee.property.name;

            if (objectName === 'css') {
              const fullName = `${objectName}.${propertyName}`;
              if (
                propertyName === 'create' ||
                propertyName === 'keyframes' ||
                propertyName === 'viewTransition' ||
                propertyName.startsWith('define')
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
});
