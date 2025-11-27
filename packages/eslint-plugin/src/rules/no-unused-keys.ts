/**
 * @fileoverview Warns about unused keys in objects inside functions
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Rule } from 'eslint';

/* istanbul ignore next */
function getFilename(context: Rule.RuleContext): string {
  return context.getFilename ? context.getFilename() : context.filename;
}

function getRootObject(node: any): any {
  if (node.type === 'Identifier') {
    return node;
  }
  if (node.type === 'MemberExpression') {
    return getRootObject(node.object);
  }
}

export const noUnusedKeys: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detect unused object keys if they are not referenced anywhere',
    },
    messages: {
      unusedKey:
        "The key '{{ key }}' is defined but never referenced anywhere.",
    },
    schema: [],
  },

  create(context) {
    const filename = getFilename(context as unknown as Rule.RuleContext);
    if (filename.endsWith('.ts')) {
      return {};
    }
    const definedKeys = new Map();
    const referencedKeys = new Set();
    const dynamicallyAccessedVars = new Set(); // dynamic bracket access

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          'name' in node.callee.object &&
          'name' in node.callee.property &&
          node.callee.object.name === 'css' &&
          node.callee.property.name === 'create'
        ) {
          const arg = node.arguments[0];
          if (
            arg &&
            arg.type === 'ObjectExpression' &&
            node.parent.type === 'VariableDeclarator' &&
            'name' in node.parent.id
          ) {
            const variableName = node.parent.id.name;

            const keyMap = new Map();

            arg.properties.forEach((prop) => {
              if (
                prop.type === 'Property' &&
                prop.key &&
                prop.key.type === 'Identifier' &&
                prop.value.type === 'ObjectExpression'
              ) {
                keyMap.set(prop.key.name, prop.key);
              }
            });

            definedKeys.set(variableName, keyMap);
          }
        }
      },

      MemberExpression(node) {
        if (node.computed && node.property.type === 'Identifier') {
          // Detect dynamic access - handle nested MemberExpressions
          const rootObject = getRootObject(node.object);
          if (rootObject && rootObject.type === 'Identifier') {
            const variableName = rootObject.name;
            dynamicallyAccessedVars.add(variableName);
            definedKeys.delete(variableName);
          }
          return;
        }

        if (node.property.type === 'Identifier') {
          // Handle nested MemberExpressions
          const rootObject = getRootObject(node.object);
          if (rootObject && rootObject.type === 'Identifier') {
            const normalKey = `${rootObject.name}.${node.property.name}`;
            referencedKeys.add(normalKey);
          }
        }
      },

      'Program:exit'() {
        definedKeys.forEach((keyMap, variableName) => {
          keyMap.forEach((keyNode: any, keyName: string) => {
            const normalKey = `${variableName}.${keyName}`;
            if (!referencedKeys.has(normalKey)) {
              context.report({
                node: keyNode,
                messageId: 'unusedKey',
                data: { key: keyName },
              });
            }
          });
        });
      },
    };
  },
};
