import type { Rule } from 'eslint';
import type { ImportSpecifier, CallExpression } from 'estree';
import { JSXAttribute } from 'estree-jsx';

type PlumeriaMethod = 'use' | 'variants';

function isPlumeriaMemberCall(
  node: CallExpression,
  aliases: Record<string, string>,
  method: PlumeriaMethod,
): boolean {
  const callee = node.callee;

  if (callee.type === 'MemberExpression') {
    if (callee.object.type !== 'Identifier') return false;
    if (callee.property.type !== 'Identifier') return false;
    return (
      aliases[callee.object.name] === 'NAMESPACE' &&
      callee.property.name === method
    );
  }

  if (callee.type === 'Identifier') {
    return aliases[callee.name] === method;
  }

  return false;
}

export const noInlineObject: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow inline objects in styleName and css.use',
    },
    messages: {
      noInlineObjectInStyleName:
        'Do not pass inline objects to styleName. It only accepts compiled styles from css.create().',
      noInlineObjectInCssUse:
        'Do not pass inline objects to css.use(). It only accepts compiled styles from css.create().',
      noInlineObjectInCssVariants:
        'Do not pass inline objects to css.variants(). It only accepts compiled styles from css.create().',
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

      JSXAttribute(node: JSXAttribute & Rule.NodeParentExtension) {
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'styleName'
        ) {
          const value = node.value;
          if (value?.type === 'JSXExpressionContainer') {
            const expr = value.expression;
            if (expr.type === 'ObjectExpression') {
              context.report({
                node: expr as Rule.Node,
                messageId: 'noInlineObjectInStyleName',
              });
            } else if (expr.type === 'ArrayExpression') {
              expr.elements.forEach((el) => {
                if (el?.type === 'ObjectExpression') {
                  context.report({
                    node: el as Rule.Node,
                    messageId: 'noInlineObjectInStyleName',
                  });
                }
              });
            }
          }
        }
      },

      CallExpression(node: Rule.Node) {
        const callNode = node as CallExpression & Rule.Node;

        if (isPlumeriaMemberCall(callNode, plumeriaAliases, 'use')) {
          callNode.arguments.forEach((arg) => {
            if (arg.type === 'ObjectExpression') {
              context.report({
                node: arg as Rule.Node,
                messageId: 'noInlineObjectInCssUse',
              });
            }
          });
        }

        if (isPlumeriaMemberCall(callNode, plumeriaAliases, 'variants')) {
          const config = callNode.arguments[0];
          if (config?.type !== 'ObjectExpression') return;

          config.properties.forEach((prop) => {
            if (prop.type !== 'Property') return;
            if (prop.value.type !== 'ObjectExpression') return;
            prop.value.properties.forEach((nested) => {
              if (nested.type !== 'Property') return;
              if (nested.value.type === 'ObjectExpression') {
                context.report({
                  node: nested.value as Rule.Node,
                  messageId: 'noInlineObjectInCssVariants',
                });
              }
            });
          });
        }
      },
    };
  },
};
