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
    return {
      'JSXAttribute[name.name="styleName"] ObjectExpression'(node: Rule.Node) {
        context.report({
          node,
          messageId: 'noInlineObjectInStyleName',
        });
      },

      'CallExpression[callee.object.name="css"][callee.property.name="use"] ObjectExpression'(
        node: Rule.Node,
      ) {
        context.report({
          node,
          messageId: 'noInlineObjectInCssUse',
        });
      },
    };
  },
};
