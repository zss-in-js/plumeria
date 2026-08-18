/**
 * @fileoverview Point a CSS Modules consumer at the generated Plumeria module
 */

import * as path from 'node:path';
import type { Rule } from 'eslint';
import { resolveSourcePath } from '../resolve';

export interface ModuleMap {
  source: string;
  target?: string;
  names: Record<string, string>;
  composes?: Record<string, string[]>;
  functions?: Record<string, string[]>;
}

export interface AdoptStylesOptions {
  modules: Record<string, ModuleMap>;
  styleProp?: string;
}

const CORE = '@plumeria/core';

const readOptions = (context: Rule.RuleContext): AdoptStylesOptions => {
  const raw = (context.options[0] ?? {}) as Partial<AdoptStylesOptions>;
  return {
    modules: raw.modules ?? {},
    styleProp: raw.styleProp ?? 'classStyle',
  };
};

export const adoptStyles: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Rewrite a CSS Modules import and its usages onto a generated Plumeria module',
    },
    fixable: 'code',
    messages: {
      source:
        'Import the generated styles from "{{source}}" instead of the stylesheet.',
      core: `Add \`import '${CORE}';\` — the compiler collects a file only when it imports the package.`,
      key: 'The generated key for "{{from}}" is "{{to}}".',
      prop: 'Styles are carried by the "{{prop}}" prop.',
      composes: '"{{key}}" composed other classes; pass them as an array.',
      value: 'A style read as a value goes back through `css.use`.',
      joined: 'A joined class list is written as an array.',
      call: 'The custom properties are the arguments of a function style.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          modules: { type: 'object' },
          styleProp: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const { modules, styleProp } = readOptions(context);
    const bindings = new Map<string, { entry: ModuleMap; local: string }>();
    let hasCore = false;
    let stylesTaken = false;
    let coreLocal: string | undefined;
    let readsValue = false;
    let several = false;

    const stylingPosition = (node: any): boolean => {
      let current = node;
      while (
        current.parent &&
        (current.parent.type === 'ArrayExpression' ||
          current.parent.type === 'LogicalExpression' ||
          current.parent.type === 'ConditionalExpression' ||
          current.parent.type === 'JSXExpressionContainer')
      )
        current = current.parent;
      return (
        current.parent?.type === 'JSXAttribute' &&
        (current.parent.name?.name === 'className' ||
          current.parent.name?.name === styleProp)
      );
    };

    // `${a} ${b}` and `[a, cond && b].filter(Boolean).join(' ')` are the two
    // shapes the export writes a composition as.
    const joinedElements = (node: any): any[] | undefined => {
      if (node?.type === 'TemplateLiteral' && node.expressions.length > 1) {
        const spaced = node.quasis.every((quasi: any, index: number) =>
          index === 0 || index === node.quasis.length - 1
            ? quasi.value.cooked === ''
            : quasi.value.cooked === ' ',
        );
        return spaced ? node.expressions : undefined;
      }
      if (
        node?.type !== 'CallExpression' ||
        node.callee.type !== 'MemberExpression' ||
        node.callee.property?.name !== 'join' ||
        node.arguments.length !== 1 ||
        node.arguments[0].value !== ' '
      )
        return undefined;
      const joined = node.callee.object;
      if (joined?.type === 'ArrayExpression')
        return joined.elements.filter(Boolean);
      return joined?.type === 'CallExpression' &&
        joined.callee.type === 'MemberExpression' &&
        joined.callee.property?.name === 'filter' &&
        joined.callee.object?.type === 'ArrayExpression'
        ? joined.callee.object.elements.filter(Boolean)
        : undefined;
    };

    const intrinsic = (element: any): boolean => {
      const name = element?.name;
      return name?.type === 'JSXIdentifier' && /^[a-z]/.test(String(name.name));
    };

    const styleRead = (node: any): any =>
      node?.type === 'LogicalExpression'
        ? styleRead(node.right)
        : node?.type === 'MemberExpression'
          ? node
          : undefined;

    // `css.use(a, cond && b)` already carries `b`; a condition in between does
    // not put it back outside the call.
    const insideUse = (node: any): boolean => {
      let current = node;
      while (
        current.parent &&
        (current.parent.type === 'LogicalExpression' ||
          current.parent.type === 'ConditionalExpression' ||
          current.parent.type === 'ArrayExpression')
      )
        current = current.parent;
      return (
        current.parent?.type === 'CallExpression' &&
        current.parent.callee?.type === 'MemberExpression' &&
        current.parent.callee.property?.name === 'use'
      );
    };

    return {
      Program(program: any) {
        hasCore = program.body.some(
          (n: any) => n.type === 'ImportDeclaration' && n.source.value === CORE,
        );

        // A style read outside the styling prop is a class name today and a
        // style object again after the rewrite, so it needs `css.use` back.
        const locals = new Set<string>();
        let seen = 0;
        for (const statement of program.body) {
          if (statement.type !== 'ImportDeclaration') continue;
          if (statement.source.value === CORE) {
            for (const specifier of statement.specifiers)
              if (
                specifier.type === 'ImportNamespaceSpecifier' ||
                (specifier.type === 'ImportSpecifier' &&
                  (specifier.imported.name ?? specifier.imported.value) ===
                    'css')
              )
                coreLocal = specifier.local.name;
            continue;
          }
          const target = resolveSourcePath(
            String(statement.source.value),
            context.filename,
          );
          if (!target || !modules[target]) continue;
          for (const specifier of statement.specifiers)
            if (specifier.type === 'ImportDefaultSpecifier') {
              locals.add(specifier.local.name);
              seen += 1;
            }
        }
        several = seen > 1;
        const visit = (node: any, styling: boolean) => {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) {
            for (const child of node) visit(child, styling);
            return;
          }
          if (typeof node.type !== 'string') return;
          const inside =
            styling ||
            (node.type === 'JSXAttribute' &&
              (node.name?.name === 'className' ||
                node.name?.name === styleProp));
          if (
            !inside &&
            node.type === 'MemberExpression' &&
            locals.has(node.object?.name)
          )
            readsValue = true;
          if (
            node.type === 'JSXAttribute' &&
            node.name?.name === 'className' &&
            node.parent?.name?.type === 'JSXIdentifier' &&
            /^[A-Z]/.test(String(node.parent.name.name)) &&
            node.value?.type === 'JSXExpressionContainer' &&
            joinedElements(node.value.expression)
          )
            readsValue = true;
          for (const key of Object.keys(node)) {
            if (key === 'parent' || key === 'loc' || key === 'range') continue;
            visit(node[key], inside);
          }
        };
        visit(program.body, false);
        if (readsValue && !coreLocal) coreLocal = 'css';

        stylesTaken = program.body.some((n: any) => {
          if (n.type === 'VariableDeclaration') {
            return n.declarations.some((d: any) => d.id?.name === 'styles');
          }
          if (n.type === 'ImportDeclaration') {
            return n.specifiers.some((sp: any) => sp.local?.name === 'styles');
          }
          return (
            (n.type === 'FunctionDeclaration' ||
              n.type === 'ClassDeclaration') &&
            n.id?.name === 'styles'
          );
        });
      },

      ImportDeclaration(node: any) {
        const specifier = String(node.source.value);
        const resolved = resolveSourcePath(specifier, context.filename);
        const named = Object.entries(modules).filter(
          ([key]) =>
            key === specifier ||
            path.basename(key) === path.basename(specifier),
        );
        const entry =
          (resolved ? modules[resolved] : undefined) ??
          (named.length === 1 ? named[0][1] : undefined);
        if (!entry) {
          const adopted =
            resolved &&
            Object.values(modules).find(
              (candidate) => candidate.target === resolved,
            );
          if (!adopted) return;
          const already = node.specifiers.find(
            (specifier: any) =>
              specifier.type === 'ImportSpecifier' &&
              (specifier.imported.name ?? specifier.imported.value) ===
                'styles',
          );
          if (already)
            bindings.set(already.local.name, {
              entry: adopted,
              local: already.local.name,
            });
          return;
        }

        // The stylesheet does not have to sit beside the file reading it.
        const from =
          entry.target && path.isAbsolute(context.filename)
            ? (() => {
                const relative = path
                  .relative(path.dirname(context.filename), entry.target)
                  .split(path.sep)
                  .join('/')
                  .replace(/\.ts$/, '');
                return relative.startsWith('.') ? relative : `./${relative}`;
              })()
            : entry.source;

        const local = node.specifiers.find(
          (s: any) => s.type === 'ImportDefaultSpecifier',
        );
        if (!local) return;

        const name = local.local.name;
        const renamed =
          several || (stylesTaken && name !== 'styles') ? name : 'styles';
        bindings.set(name, { entry, local: renamed });

        const imported =
          renamed === 'styles'
            ? `import { styles } from '${from}';`
            : `import { styles as ${renamed} } from '${from}';`;
        const core = coreLocal
          ? `import * as ${coreLocal} from '${CORE}';`
          : `import '${CORE}';`;
        const replacement = hasCore ? imported : `${core}\n${imported}`;
        if (!hasCore) hasCore = true;

        context.report({
          node,
          messageId: 'source',
          data: { source: from },
          fix: (fixer) => fixer.replaceText(node, replacement),
        });
      },

      MemberExpression(node: any) {
        const binding =
          node.object.type === 'Identifier'
            ? bindings.get(node.object.name)
            : undefined;
        if (!binding) return;

        // Outside the styling prop the value has to be a class name again.
        if (coreLocal && !stylingPosition(node) && !insideUse(node)) {
          context.report({
            node,
            messageId: 'value',
            fix: (fixer) =>
              fixer.replaceText(
                node,
                `${coreLocal}.use(${context.sourceCode.getText(node)})`,
              ),
          });
          return;
        }

        const written =
          node.computed && node.property.type === 'Literal'
            ? String(node.property.value)
            : !node.computed && node.property.type === 'Identifier'
              ? node.property.name
              : null;
        if (written === null) return;

        const key = binding.entry.names[written] ?? written;
        const local = binding.local;
        if (key === written && local === node.object.name) return;

        context.report({
          node: node.property,
          messageId: 'key',
          data: { from: written, to: key },
          fix: (fixer) => fixer.replaceText(node, `${local}.${key}`),
        });
      },

      // Runs once the prop has been renamed, so the two fixes never share a
      // range: the arguments live in a `style` prop the class no longer needs.
      [`JSXAttribute[name.name='${styleProp}']`](node: any) {
        if (node.value?.type !== 'JSXExpressionContainer') return;
        const style = node.parent.attributes.find(
          (attribute: any) =>
            attribute.type === 'JSXAttribute' &&
            attribute.name?.name === 'style' &&
            attribute.value?.type === 'JSXExpressionContainer' &&
            attribute.value.expression.type === 'ObjectExpression',
        );
        if (!style) return;
        const properties = style.value.expression.properties;
        const named = new Map<string, any>();
        for (const property of properties) {
          if (property.type !== 'Property' || !property.computed) continue;
          const key =
            property.key.type === 'TSAsExpression'
              ? property.key.expression
              : property.key;
          if (key.type === 'Literal' && typeof key.value === 'string')
            named.set(key.value, property);
        }
        if (named.size === 0) return;

        const consumed = new Set<any>();
        const call = (read: any): string | undefined => {
          const binding =
            read?.type === 'MemberExpression' &&
            read.object.type === 'Identifier'
              ? bindings.get(read.object.name)
              : undefined;
          if (!binding) return undefined;
          const written =
            !read.computed && read.property.type === 'Identifier'
              ? read.property.name
              : read.computed && read.property.type === 'Literal'
                ? String(read.property.value)
                : undefined;
          const key = written && (binding.entry.names[written] ?? written);
          const variables = key ? binding.entry.functions?.[key] : undefined;
          if (!variables || variables.some((v) => !named.has(v)))
            return undefined;
          for (const variable of variables) consumed.add(named.get(variable));
          return `${binding.local}.${key}(${variables
            .map((variable) =>
              context.sourceCode.getText(named.get(variable).value),
            )
            .join(', ')})`;
        };

        const expression = node.value.expression;
        const elements =
          expression.type === 'ArrayExpression'
            ? expression.elements.filter(Boolean)
            : [expression];
        const texts = elements.map((element: any) => {
          const called = call(styleRead(element));
          if (!called) return context.sourceCode.getText(element);
          return element.type === 'LogicalExpression'
            ? `${context.sourceCode.getText(element.left)} ${element.operator} ${called}`
            : called;
        });
        if (consumed.size === 0) return;

        const kept = properties.filter(
          (property: any) => !consumed.has(property),
        );
        const replacement =
          expression.type === 'ArrayExpression'
            ? `[${texts.join(', ')}]`
            : texts[0];
        context.report({
          node,
          messageId: 'call',
          fix: (fixer) => [
            fixer.replaceText(expression, replacement),
            kept.length === 0
              ? fixer.removeRange([style.range[0] - 1, style.range[1]])
              : fixer.replaceText(
                  style.value.expression,
                  `{ ${kept
                    .map((property: any) =>
                      context.sourceCode.getText(property),
                    )
                    .join(', ')} }`,
                ),
          ],
        });
      },

      JSXAttribute(node: any) {
        if (node.name.type !== 'JSXIdentifier') return;
        if (node.name.name !== 'className') return;
        const value = node.value;
        if (!value || value.type !== 'JSXExpressionContainer') return;

        const expression = value.expression;
        // A joined class list is an array again — that is what the styling prop
        // takes, and the order it carries is the order the merge reads.
        const joined = joinedElements(expression);
        if (joined) {
          if (
            !joined.some((element: any) =>
              bindings.has(styleRead(element)?.object?.name),
            )
          )
            return;
          const list = joined
            .map((element: any) => context.sourceCode.getText(element))
            .join(', ');
          // A joined list on a component may have come from `css.use` rather
          // than the styling prop. `className` takes the string either way,
          // while `classStyle` is only carried by an element.
          if (!intrinsic(node.parent) && coreLocal) {
            context.report({
              node: expression,
              messageId: 'value',
              fix: (fixer) =>
                fixer.replaceText(expression, `${coreLocal}.use(${list})`),
            });
            return;
          }
          context.report({
            node: node.name,
            messageId: 'prop',
            data: { prop: styleProp as string },
            fix: (fixer) => fixer.replaceText(node.name, styleProp as string),
          });
          context.report({
            node: expression,
            messageId: 'joined',
            fix: (fixer) => fixer.replaceText(expression, `[${list}]`),
          });
          return;
        }
        const root =
          expression.type === 'MemberExpression' &&
          expression.object.type === 'Identifier'
            ? expression.object.name
            : null;
        if (!root) return;

        const binding = bindings.get(root);
        if (!binding) return;
        const { entry, local } = binding;

        context.report({
          node: node.name,
          messageId: 'prop',
          data: { prop: styleProp as string },
          fix: (fixer) => fixer.replaceText(node.name, styleProp as string),
        });

        const written =
          expression.computed && expression.property.type === 'Literal'
            ? String(expression.property.value)
            : !expression.computed && expression.property.type === 'Identifier'
              ? expression.property.name
              : null;
        const key = written === null ? null : (entry.names[written] ?? written);
        const composed = key ? entry.composes?.[key] : undefined;
        if (!composed || composed.length === 0) return;

        const parts = composed
          .concat(key as string)
          .map((k) => `${local}.${k}`)
          .join(', ');

        context.report({
          node: expression,
          messageId: 'composes',
          data: { key: key as string },
          fix: (fixer) => fixer.replaceText(expression, `[${parts}]`),
        });
      },
    };
  },
};
