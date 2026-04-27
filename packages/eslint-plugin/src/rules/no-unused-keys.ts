/**
 * @fileoverview Warns about unused keys in objects inside functions
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Rule } from 'eslint';
import type { Node, Identifier } from 'estree';

/* istanbul ignore next */
function getFilename(context: Rule.RuleContext): string {
  return context.getFilename ? context.getFilename() : context.filename;
}

function getRootObject(node: Node): Identifier | undefined {
  if (node.type === 'Identifier') {
    return node;
  }
  if (node.type === 'MemberExpression') {
    return getRootObject(node.object);
  }
  return undefined;
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
            node.parent.id.type === 'Identifier'
          ) {
            const variableName = node.parent.id.name;
            const keyMap = new Map();

            arg.properties.forEach((prop) => {
              if (
                prop.type === 'Property' &&
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
        const rootObject = getRootObject(node.object);
        if (!rootObject) return;

        if (node.computed) {
          if (node.property.type === 'Identifier') {
            dynamicallyAccessedVars.add(rootObject.name);
            definedKeys.delete(rootObject.name);
          } else if (node.property.type === 'Literal') {
            referencedKeys.add(`${rootObject.name}.${node.property.value}`);
          }
          // Other computed keys (e.g. BinaryExpression) are ignored
          return;
        }

        referencedKeys.add(
          `${rootObject.name}.${(node.property as Identifier).name}`,
        );
      },

      'Program:exit'() {
        definedKeys.forEach((keyMap, variableName) => {
          keyMap.forEach((keyNode: Node, keyName: string) => {
            const normalKey = `${variableName}.${keyName}`;
            if (!referencedKeys.has(normalKey)) {
              context.report({
                node: keyNode,
                messageId: 'unusedKey',
                data: {
                  key: keyName,
                },
              });
            }
          });
        });
      },
    };
  },
};
