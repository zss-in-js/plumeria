import { TSESTree } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';

export const noMixedStylingProps: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow className and style props when styleName is present',
    },
    messages: {
      noMixedStylingProps:
        '"styleName" handles both "className" and "style". Avoid mixing them.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        const attributes = node.attributes;
        const hasStyleName = attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'styleName',
        );

        if (hasStyleName) {
          for (const attr of attributes) {
            if (
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'JSXIdentifier' &&
              (attr.name.name === 'className' || attr.name.name === 'style')
            ) {
              context.report({
                node: attr,
                messageId: 'noMixedStylingProps',
              });
            }
          }
        }
      },
    };
  },
};
