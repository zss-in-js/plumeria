/**
 * @fileoverview Disallow unknown CSS properties
 */

import { all } from 'known-css-properties';
import { camelToKebabCase } from 'zss-engine';
import type { ObjectExpression, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';
import { styleObjectFromValue } from '../util/styleObject';

const knownProperties = new Set([
  ...all,
  'border-shape',
  'corner-shape',
  'corner-top-shape',
  'corner-right-shape',
  'corner-bottom-shape',
  'corner-left-shape',
  'corner-top-left-shape',
  'corner-top-right-shape',
  'corner-bottom-left-shape',
  'corner-bottom-right-shape',
  'corner-block-start-shape',
  'corner-block-end-shape',
  'corner-inline-start-shape',
  'corner-inline-end-shape',
  'corner-start-start-shape',
  'corner-start-end-shape',
  'corner-end-start-shape',
  'corner-end-end-shape',
  'flex-line-count',
  'flow-tolerance',
  'interest-delay',
  'interest-delay-start',
  'interest-delay-end',
  'rule-inset',
  'rule-inset-start',
  'rule-inset-end',
  'rule-inset-cap',
  'rule-inset-junction',
  'rule-overlap',
  'rule-visibility-items',
  'column-rule-inset',
  'column-rule-inset-start',
  'column-rule-inset-end',
  'column-rule-inset-cap',
  'column-rule-inset-cap-start',
  'column-rule-inset-cap-end',
  'column-rule-inset-junction',
  'column-rule-inset-junction-start',
  'column-rule-inset-junction-end',
  'column-rule-visibility-items',
  'row-rule-inset',
  'row-rule-inset-start',
  'row-rule-inset-end',
  'row-rule-inset-cap',
  'row-rule-inset-cap-start',
  'row-rule-inset-cap-end',
  'row-rule-inset-junction',
  'row-rule-inset-junction-start',
  'row-rule-inset-junction-end',
  'row-rule-visibility-items',
  'scroll-axis-lock',
  'text-decoration-inset',
  'text-fit',
  'timeline-trigger',
  'timeline-trigger-name',
  'timeline-trigger-source',
  'timeline-trigger-activation-range',
  'timeline-trigger-activation-range-start',
  'timeline-trigger-activation-range-end',
  'timeline-trigger-active-range',
  'timeline-trigger-active-range-start',
  'timeline-trigger-active-range-end',
  'trigger-scope',
  'view-transition-scope',
  'window-drag',
]);

export const noUnknownCssProperties: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow unknown CSS properties in camelCase within css.create, css.keyframes, and css.viewTransition',
    },
    messages: {
      unknownProperty: "Unknown CSS property '{{ name }}'.",
      unknownNestedProperty:
        "Unknown CSS property '{{ name }}'. Nested selectors start with ':', '[' or '@'.",
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
              propertyName === 'viewTransition'
            ) {
              isCssProperties = true;
              isCreate = propertyName === 'create';
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
            isCreate = alias === 'create';
          }
        }

        if (isCssProperties) {
          node.arguments.forEach((arg) => {
            if (arg.type === 'ObjectExpression') {
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
