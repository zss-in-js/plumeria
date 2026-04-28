import { all } from 'known-css-properties';
import type { ObjectExpression, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';

const knownProperties = new Set(all);

const kebabCache = new Map<string, string>();

function toKebabCase(str: string): string {
  if (kebabCache.has(str)) {
    return kebabCache.get(str)!;
  }
  const result = str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  kebabCache.set(str, result);
  return result;
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
          if (prop.value.type === 'ObjectExpression') {
            checkStyleObject(prop.value);
          }

          if (!prop.computed) {
            const keyName =
              prop.key.type === 'Identifier'
                ? prop.key.name
                : String((prop.key as any).value);

            if (
              !keyName.startsWith(':') &&
              !keyName.startsWith('[') &&
              !keyName.startsWith('@') &&
              !keyName.startsWith('--')
            ) {
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
      });
    }
  },
};
