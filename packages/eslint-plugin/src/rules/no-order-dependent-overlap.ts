/**
 * @fileoverview Disallow two properties that overlap without either one outranking the other
 */

import { DIRECT_LONGHANDS } from 'zss-engine';
import type { ObjectExpression, Property, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';

const BOX_FAMILIES = ['margin', 'padding', 'scroll-margin', 'scroll-padding'];
const LOGICAL_PHYSICAL_EDGES: [string, string][] = [
  ['block-start', 'top'],
  ['block-end', 'bottom'],
  ['inline-start', 'left'],
  ['inline-end', 'right'],
];
const BORDER_VALUES = ['width', 'style', 'color'];
const CORNERS: [string, string][] = [
  ['start-start', 'top-left'],
  ['start-end', 'top-right'],
  ['end-start', 'bottom-left'],
  ['end-end', 'bottom-right'],
];
const SIZES = ['', 'min-', 'max-'];

const LOGICAL_PHYSICAL_PAIRS: [string, string][] = [
  ...BOX_FAMILIES.flatMap((family): [string, string][] =>
    LOGICAL_PHYSICAL_EDGES.map(([logical, physical]) => [
      `${family}-${logical}`,
      `${family}-${physical}`,
    ]),
  ),
  ...LOGICAL_PHYSICAL_EDGES.map(([logical, physical]): [string, string] => [
    `inset-${logical}`,
    physical,
  ]),
  ...LOGICAL_PHYSICAL_EDGES.flatMap(
    ([logical, physical]): [string, string][] => [
      [`border-${logical}`, `border-${physical}`],
      ...BORDER_VALUES.map((value): [string, string] => [
        `border-${logical}-${value}`,
        `border-${physical}-${value}`,
      ]),
    ],
  ),
  ...CORNERS.flatMap(([logical, physical]): [string, string][] => [
    [`border-${logical}-radius`, `border-${physical}-radius`],
    [`corner-${logical}-shape`, `corner-${physical}-shape`],
  ]),
  ...SIZES.flatMap((size): [string, string][] => [
    [`${size}block-size`, `${size}height`],
    [`${size}inline-size`, `${size}width`],
  ]),
  ['overflow-block', 'overflow-y'],
  ['overflow-inline', 'overflow-x'],
  ['overscroll-behavior-block', 'overscroll-behavior-y'],
  ['overscroll-behavior-inline', 'overscroll-behavior-x'],
  ['contain-intrinsic-block-size', 'contain-intrinsic-height'],
  ['contain-intrinsic-inline-size', 'contain-intrinsic-width'],
];

const alias = new Map(LOGICAL_PHYSICAL_PAIRS);
const canonical = (property: string): string => alias.get(property) ?? property;

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
    : new Set([canonical(property)]);

  coverages.set(property, coverage);
  return coverage;
};

const kebabCache = new Map<string, string>();
const toKebabCase = (name: string): string => {
  const cached = kebabCache.get(name);
  if (cached !== undefined) return cached;

  const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  kebabCache.set(name, kebab);
  return kebab;
};

type Overlap = 'alias' | 'crossing' | null;

const overlapOf = (first: string, second: string): Overlap => {
  if (canonical(first) === canonical(second)) return 'alias';

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
      keep: "Keep '{{ keep }}'",
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

      node.properties.forEach((prop) => {
        if (prop.type !== 'Property') return;

        if (prop.value.type === 'ObjectExpression') {
          checkStyleObject(prop.value);
          return;
        }

        let name = '';
        if (!prop.computed) {
          name =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : String((prop.key as { value: unknown }).value);
        } else if (
          prop.key.type === 'Literal' &&
          typeof prop.key.value === 'string'
        ) {
          name = prop.key.value;
        }

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
