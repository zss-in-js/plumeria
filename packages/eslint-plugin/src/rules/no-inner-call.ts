/**
 * @fileoverview Restrict calls inside a function
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Rule } from 'eslint';

export const noInnerCall: Rule.RuleModule = {
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
  create(context) {
    let functionDepth = 0;
    const plumeriaAliases: Record<string, string> = {};

    return {
      ImportDeclaration(node) {
        if (node.source.value === '@plumeria/core') {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ImportNamespaceSpecifier') {
              plumeriaAliases[specifier.local.name] = 'NAMESPACE';
            } else if (specifier.type === 'ImportDefaultSpecifier') {
              plumeriaAliases[specifier.local.name] = 'NAMESPACE';
            } else if (specifier.type === 'ImportSpecifier') {
              const importedName =
                specifier.imported.type === 'Identifier'
                  ? specifier.imported.name
                  : String(specifier.imported.value);
              plumeriaAliases[specifier.local.name] = importedName;
            }
          });
        }
      },
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
          const callee = node.callee;
          let propertyName: string | undefined;
          let fullName: string | undefined;

          if (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.property.type === 'Identifier'
          ) {
            const objectName = callee.object.name;
            const alias = plumeriaAliases[objectName];
            if (alias === 'NAMESPACE') {
              propertyName = callee.property.name;
              fullName = `${objectName}.${propertyName}`;
            }
          } else if (callee.type === 'Identifier') {
            const name = callee.name;
            const alias = plumeriaAliases[name];
            if (alias && alias !== 'NAMESPACE') {
              propertyName = alias;
              fullName = name;
            }
          }

          if (
            propertyName === 'create' ||
            propertyName === 'createStatic' ||
            propertyName === 'createTheme' ||
            propertyName === 'keyframes' ||
            propertyName === 'viewTransition' ||
            propertyName === 'variants'
          ) {
            context.report({
              node,
              messageId: 'noInnerCall',
              data: { name: fullName || propertyName },
            });
          }
        }
      },
    };
  },
};
