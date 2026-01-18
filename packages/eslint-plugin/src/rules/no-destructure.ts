/**
 * @fileoverview Restrict destructure css.create and css.global
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Rule } from 'eslint';

export const noDestructure: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow destructuring API',
    },
    messages: {
      noDestructure:
        'Do not destructure "{{property}}" from "{{object}}". Use dot notation instead.',
    },
    schema: [],
  },

  create(context) {
    const plumeriaAliases: Record<string, string> = {};

    return {
      ImportDeclaration(node) {
        if (node.source.value === '@plumeria/core') {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === 'ImportNamespaceSpecifier') {
              plumeriaAliases[specifier.local.name] = 'NAMESPACE';
            } else if (specifier.type === 'ImportDefaultSpecifier') {
              plumeriaAliases[specifier.local.name] = 'NAMESPACE';
            } else if (specifier.type === 'ImportSpecifier') {
              const importedName =
                specifier.imported.type === 'Identifier'
                  ? specifier.imported.name
                  : String(specifier.imported.value);
              plumeriaAliases[specifier.local.name] = importedName;
            }
          });
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'ObjectPattern' &&
          node.init &&
          node.init.type === 'Identifier'
        ) {
          const initName = node.init.name;
          const alias = plumeriaAliases[initName];

          if (alias === 'NAMESPACE') {
            for (const prop of node.id.properties) {
              if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                const keyName = prop.key.name;
                if (
                  keyName === 'create' ||
                  keyName === 'createStatic' ||
                  keyName === 'createTheme' ||
                  keyName === 'keyframes' ||
                  keyName === 'viewTransition' ||
                  keyName === 'variants' ||
                  keyName === 'props'
                ) {
                  context.report({
                    node: prop,
                    messageId: 'noDestructure',
                    data: { property: keyName, object: initName },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};
