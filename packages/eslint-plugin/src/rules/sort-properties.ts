/**
 * @fileoverview CSS properties recess base reorder fix feature
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Property, SpreadElement } from 'estree';
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

function getLIS(arr: number[]): number[] {
  const n = arr.length;
  if (n === 0) return [];

  const dp = new Array(n).fill(1);
  const parent = new Array(n).fill(-1);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        parent[i] = j;
      }
    }
  }

  let maxLen = 0;
  let bestEndIdx = 0;
  for (let i = 0; i < n; i++) {
    if (dp[i] > maxLen) {
      maxLen = dp[i];
      bestEndIdx = i;
    }
  }

  const result = [];
  let curr = bestEndIdx;
  while (curr !== -1) {
    result.push(curr);
    curr = parent[curr];
  }
  return result.reverse();
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
        const properties = (
          node.properties as (Property | SpreadElement)[]
        ).filter(
          (prop) =>
            ('key' in prop && !!prop.key) || prop.type === 'SpreadElement',
        );

        const chunks: (Property | SpreadElement)[][] = [];
        let currentChunk: (Property | SpreadElement)[] = [];

        properties.forEach((prop) => {
          if (prop.type === 'SpreadElement') {
            if (currentChunk.length > 0) chunks.push(currentChunk);
            chunks.push([prop]);
            currentChunk = [];
          } else {
            currentChunk.push(prop);
          }
        });
        if (currentChunk.length > 0) chunks.push(currentChunk);

        const sorted = chunks
          .map((chunk) => {
            if (chunk.length === 1 && chunk[0].type === 'SpreadElement') {
              return chunk;
            }
            return [...chunk].sort((a, b) => {
              const indexA = getPropertyIndex(a as Property, isTopLevel);
              const indexB = getPropertyIndex(b as Property, isTopLevel);
              return indexA === null || indexB === null ? 0 : indexA - indexB;
            });
          })
          .flat();

        const propertyToIndexInSorted = new Map<
          Property | SpreadElement,
          number
        >();
        sorted.forEach((prop, index) => {
          propertyToIndexInSorted.set(prop, index);
        });

        const targetPositions = properties.map(
          (prop) => propertyToIndexInSorted.get(prop)!,
        );
        const lisIndices = new Set(getLIS(targetPositions));

        const misorderedIndices = properties
          .map((_, i) => i)
          .filter((i) => !lisIndices.has(i));

        if (misorderedIndices.length === 0) return;

        const match = sourceCode.getText(node).match(/^{\s*\n(\s*)/);
        const indent = match ? match[1] : '';
        const lineEnding = match ? '\n' : ' ';
        const closingIndentMatch = sourceCode.getText(node).match(/\n(\s*)}$/);
        const closingIndent = closingIndentMatch ? closingIndentMatch[1] : '';

        misorderedIndices.forEach((i) => {
          const prop = properties[i];
          context.report({
            node: prop,
            messageId: 'sortProperties',
            data: {
              position: String(sorted.indexOf(prop) + 1),
              property:
                prop.type === 'SpreadElement'
                  ? '...spread'
                  : getPropertyName(prop as Property),
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
                `${lineEnding}${newText}${lineEnding}${closingIndent}`,
              );
            },
          });
        });
      },
    };
  },
};
