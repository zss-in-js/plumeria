import { all } from 'known-css-properties';
import type { Rule } from 'eslint';
import type { ObjectExpression } from 'estree';

const knownProperties = new Set(all);

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

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
            } else if (
              specifier.type === 'ImportSpecifier' &&
              specifier.imported.type === 'Identifier'
            ) {
              plumeriaAliases[specifier.local.name] = specifier.imported.name;
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
        if (prop.type === 'Property') {
          let keyName = '';
          if (prop.key.type === 'Identifier') {
            keyName = prop.key.name;
          } else if (prop.key.type === 'Literal') {
            keyName = String(prop.key.value);
          }

          if (keyName) {
            if (
              !keyName.startsWith(':') &&
              !keyName.startsWith('[') &&
              !keyName.startsWith('@')
            ) {
              if (!keyName.startsWith('--')) {
                const kebabName = toKebabCase(keyName);
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

          if (prop.value.type === 'ObjectExpression') {
            checkStyleObject(prop.value);
          }
        }
      });
    }
  },
};
