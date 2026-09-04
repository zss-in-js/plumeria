/**
 * @fileoverview Disallow unknown CSS properties
 */

import { all } from 'known-css-properties';
import { camelToKebabCase } from 'zss-engine';
import type { ObjectExpression, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';
import { styleObjectFromValue } from '../util/styleObject';

const knownProperties = new Set(all);

export const noUnknownCssProperties: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unknown CSS properties in camelCase within css.create, css.keyframes, and css.viewTransition',
    },
    messages: {
      unknownProperty: "Unknown CSS property '{{ name }}'.",
    },
    schema: [],
  },

  create(context) {
    const plumeriaAliases: Record<string, string> = {};

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
          const alias = plumeriaAliases[node.callee.name];
          if (
            alias === 'create' ||
            alias === 'keyframes' ||
            alias === 'viewTransition'
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
        if (prop.type === 'Property') {
          if (prop.value.type === 'ObjectExpression') {
            checkStyleObject(prop.value);
          }

          let isCheckable = false;
          let keyName = '';

          if (!prop.computed) {
            isCheckable = true;
            keyName =
              prop.key.type === 'Identifier'
                ? prop.key.name
                : String((prop.key as any).value);
          } else if (
            prop.key.type === 'Literal' &&
            typeof prop.key.value === 'string'
          ) {
            isCheckable = true;
            keyName = prop.key.value;
          }

          if (isCheckable) {
            if (
              !keyName.startsWith(':') &&
              !keyName.startsWith('[') &&
              !keyName.startsWith('@') &&
              !keyName.startsWith('--')
            ) {
              const kebabName = camelToKebabCase(keyName);
              if (!knownProperties.has(kebabName)) {
                context.report({
                  node: prop.key,
                  messageId: 'unknownProperty',
                  data: {
                    name: keyName,
                  },
                });
              }
            }
          }
        }
      });
    }
  },
};
