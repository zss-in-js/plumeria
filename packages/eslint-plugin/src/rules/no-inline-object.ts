/**
 * @fileoverview Disallow inline objects in styleName and css.use
 * Compatible with eslint 8 and below or 9 and above
 */

import type { Rule } from 'eslint';

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
    },
    schema: [],
  },

  create(context) {
    function isInsideOtherCall(node: Rule.Node) {
      let current = node.parent;
      while (current && (current.type as string) !== 'JSXAttribute') {
        if (current.type === 'CallExpression') {
          const callee = current.callee;
          if (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'css' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'use'
          ) {
            return false;
          }
          return true;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      'JSXAttribute[name.name="styleName"] ObjectExpression'(node: Rule.Node) {
        if (isInsideOtherCall(node)) return;
        context.report({
          node,
          messageId: 'noInlineObjectInStyleName',
        });
      },

      'CallExpression[callee.object.name="css"][callee.property.name="use"] ObjectExpression'(
        node: Rule.Node,
      ) {
        if (isInsideOtherCall(node)) return;
        context.report({
          node,
          messageId: 'noInlineObjectInCssUse',
        });
      },
    };
  },
};
