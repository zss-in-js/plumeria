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
      description: 'Detect unused object keys if they are not referenced anywhere',
      recommended: true,
    },
    messages: {
      unusedKey: "The key '{{ key }}' is defined but never referenced anywhere.",
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
      // Filter out `css.global` and find objects in functions
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'css' &&
          node.callee.property.name !== 'global' &&
          node.callee.property.name !== 'defineThemeVars' &&
          node.callee.property.name !== 'keyframes'
        ) {
          const arg = node.arguments[0];
          if (arg && arg.type === 'ObjectExpression' && node.parent.type === 'VariableDeclarator') {
            const variableName = node.parent.id.name;
            const keyMap = new Map();

            arg.properties.forEach((prop) => {
              if (prop.key && prop.key.type === 'Identifier' && prop.value.type === 'ObjectExpression') {
                keyMap.set(prop.key.name, prop.key);
              }
            });

            definedKeys.set(variableName, keyMap);
          }
        }
      },
      // `styles.header_main` の参照を記録
      MemberExpression(node) {
        if (node.object.type === 'Identifier' && node.property.type === 'Identifier') {
          const fullKey = `${node.object.name}.${node.property.name}`;
          referencedKeys.add(fullKey);

          // TypeScript の型情報を取得し、ジャンプ可能かチェック
          if (parserServices && checker) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const symbol = checker.getSymbolAtLocation(tsNode);
            if (symbol) {
              referencedKeys.add(fullKey);
            }
          }
        }
      },
      'Program:exit'() {
        definedKeys.forEach((keyMap, variableName) => {
          keyMap.forEach((keyNode, keyName) => {
            const fullKey = `${variableName}.${keyName}`;
            if (!referencedKeys.has(fullKey)) {
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
