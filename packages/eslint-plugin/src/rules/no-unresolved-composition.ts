import type { Rule } from 'eslint';
import type { Node, Identifier, MemberExpression } from 'estree';

const memberName = (node: MemberExpression) =>
  !node.computed && node.property.type === 'Identifier'
    ? node.property.name
    : node.computed && node.property.type === 'Literal'
      ? node.property.value
      : null;

export const noUnresolvedComposition: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Warn when class names are composed outside css.use()',
    },
    schema: [],
    messages: {
      merge:
        'Separate css.use() results cannot resolve conflicts with each other. Merge them into one css.use(a, b) call, passing conditional styles as css.use(a, active && b).',
      wrapped:
        'css.use() results cannot be passed to functions, including css.use() itself. Pass the styles directly to one css.use() call, e.g. css.use(a, active && b, [c, d]).',
      external:
        'css.use() cannot order external class names ({{values}}); their precedence is left to the CSS cascade. Rewrite them as styles with css.create() and pass them into the same css.use() call.',
    },
  },
  create(context) {
    const reported = new Set<Node>();

    function variableOf(node: Identifier) {
      let scope = context.sourceCode.getScope(node);
      while (scope) {
        const variable = scope.set.get(node.name);
        if (variable) return variable;
        if (!scope.upper) break;
        scope = scope.upper;
      }
      return null;
    }

    function imported(node: Node, name: string): boolean {
      if (node.type !== 'Identifier') return false;
      {
        const variable = variableOf(node);
        if (variable) {
          return variable.defs.some((def) => {
            if (
              def.type !== 'ImportBinding' ||
              def.parent.source.value !== '@plumeria/core'
            )
              return false;
            const specifier = def.node;
            return name === '*'
              ? specifier.type === 'ImportNamespaceSpecifier' ||
                  specifier.type === 'ImportDefaultSpecifier'
              : specifier.type === 'ImportSpecifier' &&
                  (specifier.imported.type === 'Identifier'
                    ? specifier.imported.name
                    : specifier.imported.value) === name;
          });
        }
      }
      return false;
    }

    function resolve(node: Node, seen: Set<Node>): Node[] {
      if (seen.has(node)) return [];
      seen.add(node);
      if (node.type === 'Identifier') {
        const variable = variableOf(node);
        if (!variable || variable.defs.some((def) => def.type !== 'Variable'))
          return [];
        const start = node.range?.[0] ?? 0;
        return variable.references.flatMap((reference) =>
          reference.writeExpr && (reference.writeExpr.range?.[1] ?? 0) <= start
            ? [reference.writeExpr, ...resolve(reference.writeExpr, seen)]
            : [],
        );
      }
      if (node.type === 'MemberExpression' && !isUse(node)) {
        const name = memberName(node);
        if (name === null) return [];
        return resolve(node.object, seen).flatMap((object) => {
          if (object.type !== 'ObjectExpression') return [];
          return object.properties.flatMap((property) =>
            property.type === 'Property' &&
            !property.computed &&
            (property.key.type === 'Identifier'
              ? property.key.name
              : property.key.type === 'Literal'
                ? property.key.value
                : null) === name
              ? [property.value, ...resolve(property.value, seen)]
              : [],
          );
        });
      }
      return [];
    }

    function stored(node: Node, seen: Set<Node>): boolean {
      return resolve(node, new Set(seen)).some(
        (value) =>
          value !== node && uses(value, new Set([...seen, node])).length > 0,
      );
    }

    function isUse(node: Node): boolean {
      if (node.type !== 'CallExpression') return false;
      const callee = node.callee;
      return callee.type === 'MemberExpression'
        ? memberName(callee) === 'use' && imported(callee.object, '*')
        : callee.type === 'Identifier' && imported(callee, 'use');
    }

    function parts(node: Node): Node[] | null {
      if (node.type === 'BinaryExpression' && node.operator === '+') {
        return [node.left, node.right];
      }
      if (node.type === 'TemplateLiteral') {
        return [...node.expressions, ...node.quasis];
      }
      if (node.type === 'AssignmentExpression' && node.operator === '+=') {
        return [node.left, node.right];
      }
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        memberName(node.callee) === 'join'
      ) {
        const object = node.callee.object;
        const arrays = [object, ...resolve(object, new Set())].filter(
          (value) => value.type === 'ArrayExpression',
        );
        if (arrays.length === 0) return null;
        return arrays.flatMap((array) =>
          array.elements.filter(
            (item): item is NonNullable<typeof item> => item !== null,
          ),
        );
      }
      return null;
    }

    function meaningful(node: Node): boolean {
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return node.value.trim().length > 0;
      }
      if (node.type === 'TemplateElement') {
        return (node.value.cooked ?? node.value.raw).trim().length > 0;
      }
      return true;
    }

    function uses(node: Node, seen = new Set<Node>()): Node[] {
      if (isUse(node)) return [node];
      if (
        (node.type === 'Identifier' || node.type === 'MemberExpression') &&
        stored(node, seen)
      )
        return [node];
      const children = parts(node);
      if (children) return children.flatMap((child) => uses(child, seen));
      if (node.type === 'ConditionalExpression') {
        return [...uses(node.consequent, seen), ...uses(node.alternate, seen)];
      }
      if (node.type === 'LogicalExpression') {
        return [...uses(node.left, seen), ...uses(node.right, seen)];
      }
      return [];
    }

    function passed(node: Node): Node[] {
      if (node.type === 'SpreadElement') return passed(node.argument);
      const arrays = [node, ...resolve(node, new Set())].filter(
        (value) => value.type === 'ArrayExpression',
      );
      if (arrays.length > 0) {
        return arrays.flatMap((array) =>
          array.elements.flatMap((element) =>
            element && passed(element).length > 0 ? [node] : [],
          ),
        );
      }
      return uses(node);
    }

    function check(node: Node) {
      if (node.type === 'CallExpression') {
        const calls = node.arguments.flatMap(passed);
        if (calls.some((call) => !reported.has(call))) {
          calls.forEach((call) => reported.add(call));
          context.report({ node, messageId: 'wrapped' });
          return;
        }
      }
      const children = parts(node);
      if (!children) return;
      const flatten = (child: Node): Node[] =>
        parts(child)?.flatMap(flatten) ?? [child];
      const values = children.flatMap(flatten).filter(meaningful);
      const calls = values.flatMap((value) => uses(value));
      if (values.length < 2 || !calls.some((call) => !reported.has(call)))
        return;
      calls.forEach((call) => reported.add(call));
      if (values.filter((value) => uses(value).length > 0).length > 1) {
        context.report({ node, messageId: 'merge' });
        return;
      }
      const label = (value: Node) => {
        const text =
          value.type === 'TemplateElement'
            ? JSON.stringify((value.value.cooked ?? value.value.raw).trim())
            : context.sourceCode.getText(value);
        return text.length > 40 ? `${text.slice(0, 39)}…` : text;
      };
      context.report({
        node,
        messageId: 'external',
        data: {
          values: values
            .filter((value) => uses(value).length === 0)
            .map(label)
            .join(', '),
        },
      });
    }

    return {
      BinaryExpression: check,
      TemplateLiteral: check,
      CallExpression: check,
      AssignmentExpression: check,
    };
  },
};
