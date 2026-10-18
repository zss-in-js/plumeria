/**
 * @fileoverview Disallow unknown CSS properties
 */

import { camelToKebabCase } from 'zss-engine';
import type { ObjectExpression, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';
import { styleObjectFromValue } from '../util/styleObject';
import { cssPropertyData } from '../util/cssPropertyData';

const knownProperties = new Set(cssPropertyData);

const positionTryProperties = new Set([
  'position-anchor',
  'position-area',
  'inset',
  'inset-block',
  'inset-block-start',
  'inset-block-end',
  'inset-inline',
  'inset-inline-start',
  'inset-inline-end',
  'top',
  'right',
  'bottom',
  'left',
  'place-self',
  'align-self',
  'justify-self',
  'inline-size',
  'min-inline-size',
  'max-inline-size',
  'width',
  'min-width',
  'max-width',
  'block-size',
  'min-block-size',
  'max-block-size',
  'height',
  'min-height',
  'max-height',
  'margin',
  'margin-block',
  'margin-block-start',
  'margin-block-end',
  'margin-inline',
  'margin-inline-start',
  'margin-inline-end',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
]);

export const noUnknownCssProperties: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unknown CSS properties in camelCase within css.create, css.keyframes, css.viewTransition, and css.positionTry',
    },
    messages: {
      unknownProperty: "Unknown CSS property '{{ name }}'.",
      unknownNestedProperty:
        "Unknown CSS property '{{ name }}'. Nested selectors start with ':', '[' or '@'.",
      positionTryProperty:
        "'{{ name }}' cannot be used in css.positionTry. @position-try only accepts inset, margin, sizing and self-alignment properties, positionAnchor and positionArea.",
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
        let isPositionTry = false;
        let isCreate = false;
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
              propertyName === 'viewTransition' ||
              propertyName === 'positionTry'
            ) {
              isCssProperties = true;
              isPositionTry = propertyName === 'positionTry';
              isCreate = propertyName === 'create';
            }
          }
        } else if (node.callee.type === 'Identifier') {
          const alias = plumeriaAliases[node.callee.name];
          if (
            alias === 'create' ||
            alias === 'keyframes' ||
            alias === 'viewTransition' ||
            alias === 'positionTry'
          ) {
            isCssProperties = true;
            isPositionTry = alias === 'positionTry';
            isCreate = alias === 'create';
          }
        }

        if (isCssProperties) {
          node.arguments.forEach((arg) => {
            if (arg.type === 'ObjectExpression') {
              if (isPositionTry) {
                checkPositionTry(arg);
                return;
              }
              arg.properties.forEach((prop) => {
                if (prop.type !== 'Property') return;
                const style = styleObjectFromValue(prop.value);
                if (style) checkStyleObject(style, isCreate);
              });
            }
          });
        }
      },
    };

    function checkPositionTry(node: ObjectExpression) {
      node.properties.forEach((prop) => {
        if (prop.type !== 'Property') return;
        let keyName: string;
        if (!prop.computed) {
          keyName =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : String((prop.key as any).value);
        } else if (
          prop.key.type === 'Literal' &&
          typeof prop.key.value === 'string'
        ) {
          keyName = prop.key.value;
        } else {
          return;
        }
        const kebabName = camelToKebabCase(keyName);
        if (positionTryProperties.has(kebabName)) return;
        context.report({
          node: prop.key,
          messageId:
            /^[:[@]|^--/.test(keyName) || knownProperties.has(kebabName)
              ? 'positionTryProperty'
              : 'unknownProperty',
          data: {
            name: keyName,
          },
        });
      });
    }

    function checkStyleObject(node: ObjectExpression, isCreate: boolean) {
      node.properties.forEach((prop) => {
        if (prop.type === 'Property') {
          if (prop.value.type === 'ObjectExpression') {
            checkStyleObject(prop.value, isCreate);
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
                  messageId:
                    isCreate && prop.value.type === 'ObjectExpression'
                      ? 'unknownNestedProperty'
                      : 'unknownProperty',
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
