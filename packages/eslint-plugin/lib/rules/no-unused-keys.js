/**
 * @fileoverview Warns about unused keys in objects inside functions
 * Compatible with eslint 8 and below or 9 and above
 */

'use strict';

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @returns {import('eslint').Filename}
 */
function getFilename(context) {
  return context.getFilename ? context.getFilename() : context.filename;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detect unused object keys if they are not referenced anywhere',
      recommended: true,
    },
    messages: {
      unusedKey:
        "The key '{{ key }}' is defined but never referenced anywhere.",
    },
  },

  create(context) {
    const filename = getFilename(context);
    if (filename.endsWith('.ts')) {
      return {};
    }
    const parserServices = context.parserServices;
    const checker = parserServices?.program?.getTypeChecker();
    const definedKeys = new Map();
    const referencedKeys = new Set();

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'css' &&
          node.callee.property.name === 'create'
        ) {
          const arg = node.arguments[0];
          if (
            arg &&
            arg.type === 'ObjectExpression' &&
            node.parent.type === 'VariableDeclarator'
          ) {
            const variableName = node.parent.id.name;
            const keyMap = new Map();

            arg.properties.forEach((prop) => {
              if (
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
          const dollerKey = `${node.object.name}.$${node.property.name}`;
          referencedKeys.add(normalKey);
          referencedKeys.add(dollerKey);

          if (parserServices && checker) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const symbol = checker.getSymbolAtLocation(tsNode);
            if (symbol) {
              referencedKeys.add(normalKey);
              referencedKeys.add(dollerKey);
            }
          }
        }
      },
      'Program:exit'() {
        definedKeys.forEach((keyMap, variableName) => {
          keyMap.forEach((keyNode, keyName) => {
            const normalKey = `${variableName}.${keyName}`;
            const dollerKey = `${variableName}.$${keyName}`;
            if (
              !referencedKeys.has(normalKey) &&
              !referencedKeys.has(dollerKey)
            ) {
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
