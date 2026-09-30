import type { Rule } from 'eslint';
import type { Node, Pattern } from 'estree';
import { resolveStyleProp, stylePropSchema } from '../util/style-prop';
import { scanTables } from '../util/scan';

type Component = { name: string; fn: Node & { params: Pattern[] } };

const isFunction = (node: Node | null | undefined) =>
  node?.type === 'FunctionDeclaration' ||
  node?.type === 'FunctionExpression' ||
  node?.type === 'ArrowFunctionExpression';

const componentFunctionOf = (
  node: Node | null | undefined,
): Component['fn'] | undefined => {
  if (!node) return undefined;
  if (isFunction(node)) return node as Component['fn'];
  if (node.type === 'CallExpression') {
    for (const argument of node.arguments) {
      const fn = componentFunctionOf(argument as Node);
      if (fn) return fn;
    }
  }
  return undefined;
};

const unwrapDefault = (pattern: Pattern | undefined) =>
  pattern?.type === 'AssignmentPattern' ? pattern.left : pattern;

const keyName = (key: Node) =>
  key.type === 'Identifier'
    ? key.name
    : key.type === 'Literal' && typeof key.value === 'string'
      ? key.value
      : null;

export const noStylePropRelay: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow passing a received style prop on without applying it',
    },
    schema: stylePropSchema,
    messages: {
      relay:
        "'{{prop}}' is never applied here. Apply it to {{styleProp}} or css.use() on an element this component renders.",
    },
  },
  create(context) {
    const styleProp = resolveStyleProp(context);

    function components(program: Node): Component[] {
      if (program.type !== 'Program') return [];
      const found: Component[] = [];
      for (const node of program.body) {
        const statement =
          node.type === 'ExportNamedDeclaration' ||
          node.type === 'ExportDefaultDeclaration'
            ? (node.declaration as Node | null)
            : node;
        if (!statement) continue;
        if (isFunction(statement)) {
          const id = (statement as { id?: { name: string } | null }).id;
          found.push({
            name: id?.name ?? 'default',
            fn: statement as Component['fn'],
          });
        } else if (statement.type === 'CallExpression') {
          const fn = componentFunctionOf(statement);
          if (fn) found.push({ name: 'default', fn });
        } else if (statement.type === 'VariableDeclaration') {
          for (const declarator of statement.declarations) {
            if (declarator.id.type !== 'Identifier') continue;
            const fn = componentFunctionOf(declarator.init as Node);
            if (fn) found.push({ name: declarator.id.name, fn });
          }
        }
      }
      return found;
    }

    function isUse(node: Node): boolean {
      if (node.type !== 'CallExpression') return false;
      const callee = node.callee;
      return (
        (callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'use') ||
        (callee.type === 'Identifier' && callee.name === 'use')
      );
    }

    function roots(node: Node | null | undefined, into: Node[]): Node[] {
      if (!node) return into;
      switch (node.type) {
        case 'Identifier':
        case 'MemberExpression':
          into.push(node);
          break;
        case 'ArrayExpression':
          node.elements.forEach((element) => roots(element as Node, into));
          break;
        case 'SpreadElement':
          roots(node.argument, into);
          break;
        case 'ConditionalExpression':
          roots(node.consequent, into);
          roots(node.alternate, into);
          break;
        case 'LogicalExpression':
          roots(node.left, into);
          roots(node.right, into);
          break;
        default: {
          const inner = (node as { expression?: Node }).expression;
          if (
            inner &&
            [
              'ChainExpression',
              'TSAsExpression',
              'TSNonNullExpression',
              'TSSatisfiesExpression',
            ].includes(node.type)
          )
            roots(inner, into);
        }
      }
      return into;
    }

    function applied(fn: Component['fn']): Node[] {
      const found: Node[] = [];
      const visit = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          node.forEach(visit);
          return;
        }
        const current = node as Node & { type: string };
        if (typeof current.type !== 'string') return;
        if (
          (current as { type: string }).type === 'JSXAttribute' &&
          (current as any).name?.name === styleProp &&
          (current as any).value?.type === 'JSXExpressionContainer'
        ) {
          roots((current as any).value.expression, found);
        }
        if (isUse(current) && current.type === 'CallExpression') {
          current.arguments.forEach((argument) =>
            roots(argument as Node, found),
          );
        }
        for (const key of Object.keys(current)) {
          if (key === 'parent') continue;
          visit((current as any)[key]);
        }
      };
      visit((fn as { body?: Node }).body);
      return found;
    }

    return {
      Program(program) {
        const tables = scanTables(context.cwd, styleProp);
        const table = tables.componentPropsTable ?? {};
        for (const { name, fn } of components(program as Node)) {
          const props = table[`${context.filename}-${name}`];
          if (!props) continue;

          const param = unwrapDefault(fn.params[0]);
          const locals = new Map<string, string>();
          const patterns = new Map<string, Node>();
          const paramName = param?.type === 'Identifier' ? param.name : null;
          if (param?.type === 'ObjectPattern') {
            for (const property of param.properties) {
              if (property.type !== 'Property') continue;
              const prop = keyName(property.key as Node);
              const local = unwrapDefault(property.value as Pattern);
              if (prop === null) continue;
              patterns.set(prop, property);
              if (local?.type === 'Identifier') locals.set(local.name, prop);
            }
          }

          const done = new Set<string>();
          for (const root of applied(fn)) {
            if (root.type === 'Identifier') {
              done.add(locals.get(root.name) ?? root.name);
            } else if (
              root.type === 'MemberExpression' &&
              root.object.type === 'Identifier' &&
              root.object.name === paramName &&
              !root.computed &&
              root.property.type === 'Identifier'
            ) {
              done.add(root.property.name);
            }
          }

          for (const prop of Object.keys(props)) {
            if (done.has(prop)) continue;
            context.report({
              node: patterns.get(prop) ?? fn,
              messageId: 'relay',
              data: { prop, styleProp },
            });
          }
        }
      },
    };
  },
};
