/**
 * @fileoverview Expand a border shorthand that bundles width, style and color into the three declarations it sets
 */

import { BORDER_BUNDLES, splitBorderValue } from '../util/borderShorthand';
import { toCamelCase, toKebabCase } from '../util/logicalPhysical';
import type { ObjectExpression, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';

const BUNDLES = new Set(BORDER_BUNDLES);

export const expandBorderShorthands: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Expand a border shorthand that bundles width, style and color into the three declarations it sets',
    },
    fixable: 'code',
    messages: {
      expand:
        "'{{ name }}' sets a width, a style and a color at once. It crosses the axis shorthands without either containing the other, so write the three declarations it stands for.",
      opaque:
        "'{{ name }}' sets a width, a style and a color at once, and this value cannot be split. Write the three declarations yourself, or the ones this rule expands elsewhere will outrank it.",
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

    function checkStyleObject(node: ObjectExpression) {
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

        const kebab = toKebabCase(name);
        if (!BUNDLES.has(kebab)) return;

        const literal =
          prop.value.type === 'Literal' && typeof prop.value.value === 'string'
            ? prop.value.value
            : null;
        const parts = literal === null ? null : splitBorderValue(literal);

        if (!parts) {
          context.report({
            node: prop.key,
            messageId: 'opaque',
            data: { name },
          });
          return;
        }

        const quote = sourceCode.getText(prop.value).trim().startsWith('"')
          ? '"'
          : "'";
        const indent = ' '.repeat(prop.loc!.start.column);
        const declarations = (['width', 'style', 'color'] as const)
          .map(
            (part) =>
              `${toCamelCase(`${kebab}-${part}`)}: ${quote}${parts[part]}${quote}`,
          )
          .join(`,\n${indent}`);

        context.report({
          node: prop.key,
          messageId: 'expand',
          data: { name },
          fix: (fixer) => fixer.replaceText(prop, declarations),
        });
      });
    }
  },
};
