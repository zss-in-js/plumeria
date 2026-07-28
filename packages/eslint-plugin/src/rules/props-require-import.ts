/**
 * @fileoverview Disallow the styling prop in files that do not import @plumeria
 */

import type { Rule } from 'eslint';
import type { JSXAttribute } from 'estree-jsx';
import { resolveStyleProp, stylePropSchema } from '../util/style-prop';

export const propsRequireImport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow the styling prop in files without a @plumeria/core import',
    },
    fixable: 'code',
    messages: {
      requiresImport: '{{prop}} requires importing "@plumeria/core".',
    },
    schema: stylePropSchema,
  },

  create(context) {
    const styleProp = resolveStyleProp(context);
    let hasPlumeriaImport = false;
    const stylePropNodes: Rule.Node[] = [];

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source === 'string' && source.startsWith('@plumeria/core')) {
          hasPlumeriaImport = true;
        }
      },

      JSXAttribute(node: JSXAttribute & Rule.NodeParentExtension) {
        if (node.name && node.name.name === styleProp) {
          stylePropNodes.push(node);
        }
      },

      'Program:exit'() {
        if (!hasPlumeriaImport) {
          stylePropNodes.forEach((node, index) => {
            context.report({
              node,
              messageId: 'requiresImport',
              data: { prop: styleProp },
              fix(fixer) {
                if (index === 0) {
                  return fixer.insertTextBefore(
                    context.sourceCode.ast,
                    'import "@plumeria/core";\n',
                  );
                }
                return null;
              },
            });
          });
        }
      },
    };
  },
};
