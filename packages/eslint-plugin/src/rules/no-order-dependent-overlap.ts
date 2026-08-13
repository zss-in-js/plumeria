/**
 * @fileoverview Disallow two properties that overlap without either one outranking the other
 */

import { DIRECT_LONGHANDS, impliesCondition } from 'zss-engine';
import { canonicalProperty, toKebabCase } from '../util/logicalPhysical';
import type { ObjectExpression, Property, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';

const DIRECT_SHORTHANDS: Record<string, string[]> = {};
for (const [shorthand, longhands] of Object.entries(DIRECT_LONGHANDS)) {
  for (const longhand of longhands) {
    if (!DIRECT_SHORTHANDS[longhand]) DIRECT_SHORTHANDS[longhand] = [];
    DIRECT_SHORTHANDS[longhand].push(shorthand);
  }
}

const depths = new Map<string, number>();
const depthOf = (property: string): number => {
  const cached = depths.get(property);
  if (cached !== undefined) return cached;
  depths.set(property, 0);

  let depth = 0;
  for (const shorthand of DIRECT_SHORTHANDS[property] || []) {
    depth = Math.max(depth, depthOf(shorthand) + 1);
  }

  depths.set(property, depth);
  return depth;
};

const coverages = new Map<string, Set<string>>();
const coverageOf = (property: string): Set<string> => {
  const cached = coverages.get(property);
  if (cached) return cached;

  const longhands = DIRECT_LONGHANDS[property];
  const coverage = longhands
    ? new Set(longhands.flatMap((longhand) => [...coverageOf(longhand)]))
    : new Set([canonicalProperty(property)]);

  coverages.set(property, coverage);
  return coverage;
};

type Overlap = 'alias' | 'crossing' | null;

const overlapOf = (first: string, second: string): Overlap => {
  if (canonicalProperty(first) === canonicalProperty(second)) return 'alias';

  const left = coverageOf(first);
  const right = coverageOf(second);
  if (![...left].some((leaf) => right.has(leaf))) return null;

  const contains = (a: Set<string>, b: Set<string>) =>
    [...b].every((leaf) => a.has(leaf));
  if (contains(left, right) || contains(right, left)) return null;

  return depthOf(first) === depthOf(second) ? 'crossing' : null;
};

export const noOrderDependentOverlap: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow two properties that overlap without either one outranking the other',
    },
    hasSuggestions: true,
    messages: {
      alias:
        "'{{ first }}' and '{{ second }}' are the same property under two names, so neither outranks the other. The one written last wins.",
      crossing:
        "'{{ first }}' and '{{ second }}' overlap, but neither property outranks the other. The result depends on the order they are written.",
      condition:
        "'{{ narrow }}' matches only where '{{ broad }}' also matches, so it is the more specific of the two, and both set '{{ property }}'. Written first, it reads as though the broader one wins, which is the opposite of what the stylesheet does.",
      keep: "Keep '{{ keep }}'",
      swap: "Write '{{ narrow }}' after '{{ broad }}'",
    },
    schema: [],
  },

  create(context) {
    const plumeriaAliases: Record<string, string> = {};
    const sourceCode = context.sourceCode;

    return {
      ImportDeclaration(node) {
        if (node.source.value === '@plumeria/core') {
          node.specifiers.forEach((specifier) => {
            if (
              specifier.type === 'ImportNamespaceSpecifier' ||
              specifier.type === 'ImportDefaultSpecifier'
            ) {
              plumeriaAliases[specifier.local.name] = 'NAMESPACE';
            } else {
              const spec = specifier as ImportSpecifier;
              const importedName =
                spec.imported.type === 'Identifier'
                  ? spec.imported.name
                  : String(spec.imported.value);
              plumeriaAliases[specifier.local.name] = importedName;
            }
          });
        }
      },
      CallExpression(node) {
        let isCssProperties = false;
        if (node.callee.type === 'MemberExpression') {
          if (
            node.callee.object.type === 'Identifier' &&
            plumeriaAliases[node.callee.object.name] === 'NAMESPACE'
          ) {
            const propertyName =
              node.callee.property.type === 'Identifier'
                ? node.callee.property.name
                : null;
            if (
              propertyName === 'create' ||
              propertyName === 'keyframes' ||
              propertyName === 'viewTransition'
            ) {
              isCssProperties = true;
            }
          }
        } else if (node.callee.type === 'Identifier') {
          const aliasName = plumeriaAliases[node.callee.name];
          if (
            aliasName === 'create' ||
            aliasName === 'keyframes' ||
            aliasName === 'viewTransition'
          ) {
            isCssProperties = true;
          }
        }

        if (isCssProperties) {
          node.arguments.forEach((arg) => {
            if (arg.type === 'ObjectExpression') {
              arg.properties.forEach((prop) => {
                if (
                  prop.type === 'Property' &&
                  prop.value.type === 'ObjectExpression'
                ) {
                  checkStyleObject(prop.value);
                }
              });
            }
          });
        }
      },
    };

    function keyNameOf(prop: Property): string {
      if (!prop.computed) {
        return prop.key.type === 'Identifier'
          ? prop.key.name
          : String((prop.key as { value: unknown }).value);
      }
      return prop.key.type === 'Literal' && typeof prop.key.value === 'string'
        ? prop.key.value
        : '';
    }

    function declaredNames(node: ObjectExpression): Set<string> {
      const names = new Set<string>();
      node.properties.forEach((prop) => {
        if (prop.type !== 'Property' || prop.value.type === 'ObjectExpression')
          return;
        const name = keyNameOf(prop);
        if (name && !name.startsWith('--')) names.add(name);
      });
      return names;
    }

    function swapProperties(
      fixer: Rule.RuleFixer,
      first: Property,
      second: Property,
    ) {
      return [
        fixer.replaceText(first, sourceCode.getText(second)),
        fixer.replaceText(second, sourceCode.getText(first)),
      ];
    }

    function removeProperty(fixer: Rule.RuleFixer, prop: Property) {
      const after = sourceCode.getTokenAfter(prop);
      if (after && after.value === ',') {
        const next = sourceCode.getTokenAfter(after);
        const end = next && next.value !== '}' ? next.range[0] : after.range[1];
        return fixer.removeRange([prop.range![0], end]);
      }

      // An alias report always involves two properties in the same object, so
      // a property without a following comma necessarily has a preceding one.
      const before = sourceCode.getTokenBefore(prop);
      return fixer.removeRange([before!.range![0], prop.range![1]]);
    }

    function checkStyleObject(node: ObjectExpression) {
      const declarations: { prop: Property; name: string; kebab: string }[] =
        [];
      const conditions: { prop: Property; name: string; sets: Set<string> }[] =
        [];

      node.properties.forEach((prop) => {
        if (prop.type !== 'Property') return;

        if (prop.value.type === 'ObjectExpression') {
          const condition = keyNameOf(prop);
          if (
            condition.startsWith('@media') ||
            condition.startsWith('@container')
          ) {
            conditions.push({
              prop,
              name: condition,
              sets: declaredNames(prop.value),
            });
          }
          checkStyleObject(prop.value);
          return;
        }

        const name = keyNameOf(prop);

        if (
          !name ||
          name.startsWith(':') ||
          name.startsWith('[') ||
          name.startsWith('@') ||
          name.startsWith('--')
        ) {
          return;
        }

        declarations.push({ prop, name, kebab: toKebabCase(name) });
      });

      for (let i = 0; i < conditions.length; i++) {
        for (let j = i + 1; j < conditions.length; j++) {
          const first = conditions[i];
          const second = conditions[j];
          if (!impliesCondition(first.name, second.name)) continue;

          const shared = [...first.sets].filter((name) =>
            second.sets.has(name),
          );
          if (shared.length === 0) continue;

          context.report({
            node: first.prop.key,
            messageId: 'condition',
            data: {
              narrow: first.name,
              broad: second.name,
              property: shared[0],
            },
            suggest: [
              {
                messageId: 'swap',
                data: { narrow: first.name, broad: second.name },
                fix: (fixer) => swapProperties(fixer, first.prop, second.prop),
              },
            ],
          });
        }
      }

      for (let i = 0; i < declarations.length; i++) {
        for (let j = i + 1; j < declarations.length; j++) {
          const first = declarations[i];
          const second = declarations[j];
          const overlap = overlapOf(first.kebab, second.kebab);
          if (!overlap) continue;

          context.report({
            node: second.prop.key,
            messageId: overlap,
            data: { first: first.name, second: second.name },
            suggest:
              overlap === 'alias'
                ? [
                    {
                      messageId: 'keep',
                      data: { keep: second.name },
                      fix: (fixer) => removeProperty(fixer, first.prop),
                    },
                    {
                      messageId: 'keep',
                      data: { keep: first.name },
                      fix: (fixer) => removeProperty(fixer, second.prop),
                    },
                  ]
                : null,
          });
        }
      }
    }
  },
};
