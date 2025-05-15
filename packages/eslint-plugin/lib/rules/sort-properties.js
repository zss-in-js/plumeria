/**
 * @fileoverview CSS properties recess base reorder fix feature
 * Compatible with eslint 8 and below or 9 and above
 */

'use strict';

const propertyGroups = require('../util/propertyGroups');

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @returns {import('eslint').SourceCode}
 */
function getSourceCode(context) {
  return context.getSourceCode ? context.getSourceCode() : context.sourceCode;
}

function getPropertyName(property) {
  if (property.key.type === 'Literal' && Array.isArray(property.key.value)) {
    return property.key.value;
  }
  return property.key.name || property.key.value || '';
}

function getPropertyIndex(property, isTopLevel = false) {
  const name = getPropertyName(property);

  if (
    isTopLevel &&
    (property.key.type !== 'Identifier' || name.startsWith('&') || name.startsWith(':') || name.startsWith('@'))
  ) {
    return null;
  }

  let lastGroupIndex = 0;
  let maxPropIndex = 0;

  for (let i = 0; i < propertyGroups.length; i++) {
    const group = propertyGroups[i];
    const propIndex = group.properties.indexOf(name);

    if (propIndex !== -1) {
      return i * 1000 + propIndex;
    }

    lastGroupIndex = i;
    maxPropIndex = Math.max(maxPropIndex, group.properties.length);
  }

  if (typeof name === 'string') {
    if (name.startsWith('&')) return (propertyGroups.length + 1) * 1000;
    if (name.includes(':')) return (propertyGroups.length + 2) * 1000;
    if (name.includes('@media')) return (propertyGroups.length + 3) * 1000;
  }

  return lastGroupIndex * 1000 + maxPropIndex + 1;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Sort CSS properties keeping original order for specific keys',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      sortProperties: 'Property "{{property}}" should be at position {{position}}',
    },
  },

  create(context) {
    return {
      ObjectExpression(node) {
        const sourceCode = getSourceCode(context);
        const isTopLevel = !node.parent || node.parent.type !== 'Property';
        const properties = node.properties.filter((prop) => prop.key);

        const sorted = [...properties].sort((a, b) => {
          const indexA = getPropertyIndex(a, isTopLevel);
          const indexB = getPropertyIndex(b, isTopLevel);
          return indexA === null || indexB === null ? 0 : indexA - indexB;
        });

        const misordered = properties.filter((prop, i) => prop !== sorted[i]);

        if (misordered.length === 0) return;

        const match = sourceCode.getText(node).match(/^{\s*\n(\s*)/);
        const indent = match ? match[1] : '';
        const lineEnding = match ? '\n' : ' ';

        misordered.forEach((prop) => {
          context.report({
            node: prop,
            messageId: 'sortProperties',
            data: {
              position: sorted.indexOf(prop) + 1,
              property: getPropertyName(prop),
            },
            fix(fixer) {
              const newText = sorted
                .map((p) => {
                  if (Array.isArray(getPropertyName(p))) {
                    const arrayKey = sourceCode.getText(p.key);
                    const arrayContent = p.value.properties
                      .map((inner) => `${indent}  ${sourceCode.getText(inner)}`)
                      .join(`,${lineEnding}`);
                    return `${indent}${arrayKey}: {\n${arrayContent}\n${indent}}`;
                  }
                  return `${indent}${sourceCode.getText(p)}`;
                })
                .join(`,${lineEnding}`);

              return fixer.replaceTextRange(
                [node.range[0] + 1, node.range[1] - 1],
                `${lineEnding}${newText}${lineEnding}`
              );
            },
          });
        });
      },
    };
  },
};
