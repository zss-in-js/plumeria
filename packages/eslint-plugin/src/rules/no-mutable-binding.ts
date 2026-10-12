/**
 * @fileoverview Disallow let and var bindings in Plumeria style definitions
 */

import type { Rule, Scope } from 'eslint';
import type { CallExpression, ImportSpecifier, Node } from 'estree';

const STYLE_APIS = new Set([
  'create',
  'createStatic',
  'createTheme',
  'keyframes',
  'viewTransition',
]);

const isReference = (node: Node, parent: Node | undefined): boolean => {
  if (!parent) return true;
  if (parent.type === 'Property' && parent.key === node && !parent.computed)
    return false;
  if (
    parent.type === 'MemberExpression' &&
    parent.property === node &&
    !parent.computed
  )
    return false;
  return true;
};

const findVariable = (
  scope: Scope.Scope | null,
  name: string,
): Scope.Variable | undefined => {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) return variable;
  }
  return undefined;
};

export const noMutableBinding: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow let and var bindings in Plumeria style definitions',
    },
    messages: {
      mutable:
        "'{{ name }}' is declared with '{{ kind }}', but the build reads only the value it starts with. Declare it with 'const'.",
    },
    schema: [],
  },

  create(context) {
    const plumeriaAliases: Record<string, string> = {};
    const sourceCode = context.sourceCode;

    const isStyleCall = (node: CallExpression): boolean => {
      const callee = node.callee;
      if (callee.type === 'Identifier') {
        return STYLE_APIS.has(plumeriaAliases[callee.name] ?? '');
      }
      return (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        plumeriaAliases[callee.object.name] === 'NAMESPACE' &&
        callee.property.type === 'Identifier' &&
        STYLE_APIS.has(callee.property.name)
      );
    };

    const check = (node: Node, parent: Node | undefined): void => {
      if (node.type === 'Identifier' && isReference(node, parent)) {
        const variable = findVariable(
          sourceCode.getScope(node as Rule.Node),
          node.name,
        );
        const definition = variable?.defs[0];
        if (
          definition?.type === 'Variable' &&
          definition.parent.kind !== 'const'
        ) {
          context.report({
            node,
            messageId: 'mutable',
            data: { name: node.name, kind: definition.parent.kind },
          });
        }
      }
      for (const [key, value] of Object.entries(node)) {
        if (key === 'parent') continue;
        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child.type === 'string') check(child, node);
          }
        } else if (value && typeof (value as Node).type === 'string') {
          check(value as Node, node);
        }
      }
    };

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@plumeria/core') return;
        node.specifiers.forEach((specifier) => {
          if (
            specifier.type === 'ImportNamespaceSpecifier' ||
            specifier.type === 'ImportDefaultSpecifier'
          ) {
            plumeriaAliases[specifier.local.name] = 'NAMESPACE';
          } else {
            const spec = specifier as ImportSpecifier;
            plumeriaAliases[specifier.local.name] =
              spec.imported.type === 'Identifier'
                ? spec.imported.name
                : String(spec.imported.value);
          }
        });
      },
      CallExpression(node) {
        if (!isStyleCall(node)) return;
        for (const argument of node.arguments) check(argument, node);
      },
    };
  },
};
