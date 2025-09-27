/**
 * @fileoverview CSS properties recess base reorder fix feature
 * Compatible with eslint 8 and below or 9 and above
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';
import { propertyGroups } from '../util/propertyGroups';

const createRule = ESLintUtils.RuleCreator((name) => name);

/**
 * @param context Rule context
 * @returns Source code object
 */
function getSourceCode(context: Rule.RuleContext) {
  return context.getSourceCode ? context.getSourceCode() : context.sourceCode;
}

function getPropertyName(property: TSESTree.Property): string | string[] {
  if (property.key.type === 'Literal' && Array.isArray(property.key.value)) {
    return property.key.value;
  }
  if (property.key.type === 'Identifier') {
    return property.key.name;
  }
  if (property.key.type === 'Literal') {
    return String(property.key.value);
  }
  return '';
}

function getPropertyIndex(
  property: TSESTree.Property,
  isTopLevel = false,
): number | null {
  const name = getPropertyName(property);

  if (Array.isArray(name)) {
    return null;
  }

  if (
    isTopLevel &&
    (property.key.type !== 'Identifier' ||
      (typeof name === 'string' &&
        (name.startsWith('&') || name.startsWith(':') || name.startsWith('@'))))
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

export const sortProperties = createRule({
  name: 'sort-properties',
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

  defaultOptions: [],

  create(context) {
    return {
      ObjectExpression(node: TSESTree.ObjectExpression) {
        const sourceCode = getSourceCode(
          context as unknown as Rule.RuleContext,
        );
        const isTopLevel = !node.parent || node.parent.type !== 'Property';
        const properties = node.properties.filter(
          (prop): prop is TSESTree.Property => 'key' in prop && !!prop.key,
        );

        const sorted = [...properties].sort((a, b) => {
          const indexA = getPropertyIndex(a, isTopLevel);
          const indexB = getPropertyIndex(b, isTopLevel);
          return indexA === null || indexB === null ? 0 : indexA - indexB;
        });

        const misordered = properties.filter((prop, i) => prop !== sorted[i]);

        if (misordered.length === 0) return;

        const match = sourceCode.getText(node as any).match(/^{\s*\n(\s*)/);
        const indent = match ? match[1] : '';
        const lineEnding = match ? '\n' : ' ';

        misordered.forEach((prop) => {
          context.report({
            node: prop as any,
            messageId: 'sortProperties',
            data: {
              position: sorted.indexOf(prop) + 1,
              property: getPropertyName(prop),
            },
            fix(fixer) {
              const newText = sorted
                .map((p) => {
                  const propName = getPropertyName(p);
                  if (Array.isArray(propName)) {
                    const arrayKey = sourceCode.getText(p.key as any);
                    const arrayContent = (
                      p.value as TSESTree.ObjectExpression
                    ).properties
                      .map(
                        (inner) =>
                          `${indent}  ${sourceCode.getText(inner as any)}`,
                      )
                      .join(`,${lineEnding}`);
                    return `${indent}${arrayKey}: {\n${arrayContent}\n${indent}}`;
                  }
                  return `${indent}${sourceCode.getText(p as any)}`;
                })
                .join(`,${lineEnding}`);

              return fixer.replaceTextRange(
                [node.range[0] + 1, node.range[1] - 1],
                `${lineEnding}${newText}${lineEnding}`,
              );
            },
          });
        });
      },
    };
  },
});
