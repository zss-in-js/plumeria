/**
 * @fileoverview Disallow className and style props when the styling prop is present
 */

import type { Rule } from 'eslint';
import { resolveStyleProp, stylePropSchema } from '../util/style-prop';

export const noMixedStylingProps: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow className and style props when the styling prop is present',
    },
    messages: {
      noMixedStylingProps:
        '"{{prop}}" handles both "className" and "style". Avoid mixing them.',
    },
    schema: stylePropSchema,
  },

  create(context) {
    const styleProp = resolveStyleProp(context);
    // A project that renamed the styling prop to `style` or `className` would
    // otherwise have the rule flag the prop against itself.
    const mixedProps = ['className', 'style'].filter(
      (name) => name !== styleProp,
    );

    return {
      JSXOpeningElement(node: any) {
        const attributes = node.attributes;
        const hasStyleProp = attributes.some(
          (attr: any) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === styleProp,
        );

        if (hasStyleProp) {
          for (const attr of attributes) {
            if (
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              mixedProps.includes(attr.name.name)
            ) {
              context.report({
                node: attr,
                messageId: 'noMixedStylingProps',
                data: { prop: styleProp },
              });
            }
          }
        }
      },
    };
  },
};
