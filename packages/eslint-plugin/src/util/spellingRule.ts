import {
  counterpartOf,
  spellingOf,
  toCamelCase,
  toKebabCase,
} from './logicalPhysical';
import type { PropertySpelling } from './logicalPhysical';
import type { ObjectExpression, Property, ImportSpecifier } from 'estree';
import type { Rule } from 'eslint';
import { styleObjectFromValue } from './styleObject';

const DESCRIPTIONS: Record<PropertySpelling, string> = {
  physical:
    'Disallow the physical name of a property that also has a logical name',
  logical:
    'Disallow the logical name of a property that also has a physical name',
};

const MESSAGES: Record<PropertySpelling, string> = {
  physical:
    "'{{ name }}' is the physical name of this property. Write it as '{{ counterpart }}', which follows the writing mode.",
  logical:
    "'{{ name }}' is the logical name of this property. This project is written in physical properties; use '{{ counterpart }}'.",
};

export const createSpellingRule = (
  reject: PropertySpelling,
): Rule.RuleModule => ({
  meta: {
    type: 'suggestion',
    docs: { description: DESCRIPTIONS[reject] },
    hasSuggestions: true,
    messages: {
      rejected: MESSAGES[reject],
      rename: "Rename to '{{ counterpart }}'",
    },
    schema: [
      {
        type: 'object',
        properties: {
          sizes: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const includeAxes: boolean = context.options[0]?.sizes ?? false;
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
          const aliasName = plumeriaAliases[node.callee.name];
          if (
            aliasName === 'create' ||
            aliasName === 'keyframes' ||
            aliasName === 'viewTransition'
          ) {
            isCssProperties = true;
          }
        }

        if (isCssProperties) {
          node.arguments.forEach((arg) => {
            if (arg.type === 'ObjectExpression') {
              arg.properties.forEach((prop) => {
                if (prop.type !== 'Property') return;
                const style = styleObjectFromValue(prop.value);
                if (style) checkStyleObject(style);
              });
            }
          });
        }
      },
    };

    function checkStyleObject(node: ObjectExpression) {
      node.properties.forEach((prop) => {
        if (prop.type !== 'Property') return;

        if (prop.value.type === 'ObjectExpression') {
          checkStyleObject(prop.value);
          return;
        }

        let name = '';
        if (!prop.computed) {
          name =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : String((prop.key as { value: unknown }).value);
        } else if (
          prop.key.type === 'Literal' &&
          typeof prop.key.value === 'string'
        ) {
          name = prop.key.value;
        }

        if (!name) return;

        const kebab = toKebabCase(name);
        if (spellingOf(kebab, includeAxes) !== reject) return;

        report(prop, name, toCamelCase(counterpartOf(kebab)!));
      });
    }

    function report(prop: Property, name: string, counterpart: string) {
      context.report({
        node: prop.key,
        messageId: 'rejected',
        data: { name, counterpart },
        suggest: [
          {
            messageId: 'rename',
            data: { counterpart },
            fix: (fixer) => fixer.replaceText(prop.key, counterpart),
          },
        ],
      });
    }
  },
});
