/**
 * @fileoverview Expand a border shorthand that bundles width, style and color into the three declarations it sets
 */

import {
  BORDER_BUNDLES,
  EXPRESSION_MARKER,
  splitBorderValue,
} from '../util/borderShorthand';
import { toCamelCase, toKebabCase } from '../util/logicalPhysical';
import type { ObjectExpression, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';
import { styleObjectFromValue } from '../util/styleObject';

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
                if (prop.type !== 'Property') return;
                const style = styleObjectFromValue(prop.value);
                if (style) checkStyleObject(style);
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

        let literal: string | null = null;
        let expressions: string[] = [];
        if (
          prop.value.type === 'Literal' &&
          typeof prop.value.value === 'string'
        ) {
          literal = prop.value.value;
        } else if (prop.value.type === 'TemplateLiteral') {
          const template = prop.value;
          expressions = template.expressions.map((expression) =>
            sourceCode.getText(expression),
          );
          literal = template.quasis
            .map((quasi, index) =>
              index < expressions.length
                ? quasi.value.raw +
                  EXPRESSION_MARKER +
                  index +
                  EXPRESSION_MARKER
                : quasi.value.raw,
            )
            .join('');
        }
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
        const marker = new RegExp(
          `${EXPRESSION_MARKER}(\\d+)${EXPRESSION_MARKER}`,
          'g',
        );
        const render = (value: string): string => {
          if (!value.includes(EXPRESSION_MARKER)) {
            return `${quote}${value}${quote}`;
          }
          const restored = value.replace(
            marker,
            (_, index) => `\${${expressions[Number(index)]}}`,
          );
          const alone = /^\$\{([\s\S]*)\}$/.exec(restored);
          return alone && !alone[1].includes('${')
            ? alone[1]
            : `\`${restored}\``;
        };
        const indent = ' '.repeat(prop.loc!.start.column);
        const declarations = (['width', 'style', 'color'] as const)
          .map(
            (part) =>
              `${toCamelCase(`${kebab}-${part}`)}: ${render(parts[part])}`,
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
