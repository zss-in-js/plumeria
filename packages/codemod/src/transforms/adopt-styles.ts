/**
 * @fileoverview Point a CSS Modules consumer at the generated Plumeria module
 */

import type { Rule } from 'eslint';

export interface ModuleMap {
  /** module specifier the generated styles live at, e.g. `./Card.styles` */
  source: string;
  /** css class name -> create key */
  names: Record<string, string>;
  /** create key -> the keys it composes, call-site order */
  composes?: Record<string, string[]>;
}

export interface AdoptStylesOptions {
  /** keyed by the specifier as written in the import, e.g. `./Card.module.css` */
  modules: Record<string, ModuleMap>;
  /** the JSX prop that carries styles */
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
    /** local binding of the stylesheet -> what it becomes, and its module */
    const bindings = new Map<string, { entry: ModuleMap; local: string }>();
    let hasCore = false;
    let stylesTaken = false;

    return {
      Program(program: any) {
        hasCore = program.body.some(
          (n: any) => n.type === 'ImportDeclaration' && n.source.value === CORE,
        );
        // `styles` is the name the generated module exports, so it is only
        // borrowed when the file does not already spend it on something else.
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
        const entry =
          modules[specifier] ??
          Object.entries(modules).find(
            ([key]) =>
              key.includes('/') === false && specifier.endsWith(`/${key}`),
          )?.[1];
        if (!entry) return;

        const local = node.specifiers.find(
          (s: any) => s.type === 'ImportDefaultSpecifier',
        );
        if (!local) return;

        const name = local.local.name;
        const renamed = stylesTaken && name !== 'styles' ? name : 'styles';
        bindings.set(name, { entry, local: renamed });

        const imported =
          renamed === 'styles'
            ? `import { styles } from '${entry.source}';`
            : `import { styles as ${renamed} } from '${entry.source}';`;
        // The compiler collects a file only when it imports the package, so the
        // core import rides along with the first stylesheet it replaces.
        const replacement = hasCore
          ? imported
          : `import '${CORE}';\n${imported}`;
        if (!hasCore) hasCore = true;

        context.report({
          node,
          messageId: 'source',
          data: { source: entry.source },
          fix: (fixer) => fixer.replaceText(node, replacement),
        });
      },

      MemberExpression(node: any) {
        const binding =
          node.object.type === 'Identifier'
            ? bindings.get(node.object.name)
            : undefined;
        if (!binding) return;

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

      JSXAttribute(node: any) {
        if (node.name.type !== 'JSXIdentifier') return;
        if (node.name.name !== 'className') return;
        const value = node.value;
        if (!value || value.type !== 'JSXExpressionContainer') return;

        const expression = value.expression;
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
