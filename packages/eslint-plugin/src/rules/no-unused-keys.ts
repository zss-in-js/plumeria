/**
 * @fileoverview Warns about unused keys in objects inside functions
 * Compatible with eslint 8 and below or 9 and above
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';

const createRule = ESLintUtils.RuleCreator((name) => name);

/* istanbul ignore next */
function getFilename(context: Rule.RuleContext): string {
  return context.getFilename ? context.getFilename() : context.filename;
}

export const noUnusedKeys = createRule({
  name: 'no-unused-keys',
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
  defaultOptions: [],

  create(context) {
    const filename = getFilename(context as unknown as Rule.RuleContext);
    if (filename.endsWith('.ts')) {
      return {};
    }
    const definedKeys = new Map();
    const referencedKeys = new Set();

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
        if (
          node.object.type === 'Identifier' &&
          node.property.type === 'Identifier'
        ) {
          const normalKey = `${node.object.name}.${node.property.name}`;
          referencedKeys.add(normalKey);
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
});
