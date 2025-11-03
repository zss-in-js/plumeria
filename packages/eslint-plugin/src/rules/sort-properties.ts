/**
 * @fileoverview CSS properties recess base reorder fix feature
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Property } from 'estree';
import type { Rule } from 'eslint';

import { propertyGroups } from '../util/propertyGroups';

/* istanbul ignore next */
function getSourceCode(context: Rule.RuleContext) {
  return context.getSourceCode ? context.getSourceCode() : context.sourceCode;
}

function getPropertyName(property: Property): string {
  if (property.key.type === 'Identifier') {
    return property.key.name;
  }
  if (property.key.type === 'Literal') {
    return String(property.key.value);
  }
  return '';
}

function getPropertyIndex(
  property: Property,
  isTopLevel: boolean,
): number | null {
  const name = getPropertyName(property);

  if (isTopLevel) {
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
    if (name.startsWith(':')) return (propertyGroups.length + 1) * 1000;
    if (name.startsWith('&')) return (propertyGroups.length + 2) * 1000;
    if (name.startsWith('@media')) return (propertyGroups.length + 3) * 1000;
    if (name.startsWith('@container'))
      return (propertyGroups.length + 3) * 1000;
  }

  return lastGroupIndex * 1000 + maxPropIndex + 1;
}

export const sortProperties: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Sort CSS properties keeping original order for specific keys',
    },
    fixable: 'code',
    schema: [],
    messages: {
      sortProperties:
        'Property "{{property}}" should be at position {{position}}',
    },
  },

  create(context) {
    return {
      ObjectExpression(node) {
        const sourceCode = getSourceCode(context);
        const isTopLevel = !node.parent || node.parent.type !== 'Property';
        const properties = node.properties.filter(
          (prop) => 'key' in prop && !!prop.key,
        );

        const sorted = [...properties].sort((a, b) => {
          const indexA = getPropertyIndex(a as Property, isTopLevel);
          const indexB = getPropertyIndex(b as Property, isTopLevel);
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
              position: String(sorted.indexOf(prop) + 1),
              property: getPropertyName(prop as Property),
            },
            fix(fixer) {
              const newText = sorted
                .map((p) => {
                  return `${indent}${sourceCode.getText(p)}`;
                })
                .join(`,${lineEnding}`);

              return fixer.replaceTextRange(
                [
                  (node.range as [number, number])[0] + 1,
                  (node.range as [number, number])[1] - 1,
                ],
                `${lineEnding}${newText}${lineEnding}`,
              );
            },
          });
        });
      },
    };
  },
};
