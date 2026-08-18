/**
 * @fileoverview Replace Plumeria definitions and classStyle with CSS Modules
 */

import * as path from 'node:path';
import type { Rule } from 'eslint';
import { resolveSourcePath } from '../resolve';

export interface ReleaseModule {
  source: string;
  target?: string;
  binding: string;
  definitionOnly?: boolean;
  aliases?: Record<string, Record<string, string>>;
  functions?: Record<
    string,
    { params: string[]; variables: string[]; lengths?: boolean[] }
  >;
  merges?: Record<string, string>;
  overrides?: Record<string, Record<number, string>>;
}

export interface ReleaseStylesOptions {
  modules: Record<string, ReleaseModule>;
  themes?: Record<string, string[]>;
  animations?: Record<string, string[]>;
  statics?: Record<string, string[]>;
  values?: Record<string, Record<string, unknown>>;
  complete?: boolean;
  constants?: Record<string, Record<string, string>>;
  styleProp?: string;
  active?: boolean;
}

const memberPath = (node: any): string[] | undefined => {
  if (node?.type === 'Identifier') return [node.name];
  if (node?.type !== 'MemberExpression') return undefined;
  const parent = memberPath(node.object);
  const key = node.computed
    ? node.property.type === 'Literal'
      ? String(node.property.value)
      : undefined
    : node.property.name;
  return parent && key !== undefined ? [...parent, key] : undefined;
};

const isCreate = (node: any): boolean => {
  if (node?.type !== 'CallExpression') return false;
  const path = memberPath(node.callee);
  return path?.length === 2 && path[1] === 'create';
};

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const walk = (node: any, visit: (node: any) => void) => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue;
    walk(node[key], visit);
  }
};

const needsFilter = (node: any): boolean =>
  node.type === 'LogicalExpression' ||
  node.type === 'ConditionalExpression' ||
  node.type === 'SpreadElement';

export const __private = { memberPath, isCreate, needsFilter };

export const releaseStyles: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Replace Plumeria style definitions and usages with a generated CSS Module',
    },
    fixable: 'code',
    messages: {
      definition: 'Import the generated CSS Module.',
      static: '`createStatic` values were inlined into the generated CSS.',
      theme: '`createTheme` was written to the global stylesheet.',
      themeImport:
        'Remove the createTheme import after inlining its CSS variables.',
      animation: '`keyframes` or `viewTransition` was written globally.',
      animationImport:
        'Remove the animation import after replacing it with its generated name.',
      staticImport:
        'Remove the createStatic import after inlining its values into the CSS.',
      alias:
        'Read this style from the CSS Module the whole file was exported to.',
      core: 'Remove the Plumeria import after exporting the styles.',
      prop: 'Use className after exporting this style to CSS Modules.',
      composition: 'Join the composed CSS Module class names.',
      use: 'Read the class name straight from the CSS Module.',
      token: 'Inline the value this token resolved to.',
      styleType: 'A released style is a class name.',
      folded: 'This only named a style key, which the export has resolved.',
      functionStyle:
        'Use the CSS Module class and pass function arguments as custom properties.',
      unsupportedFunctionStyle:
        'This function style call cannot be converted without changing its behavior.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          modules: { type: 'object' },
          themes: { type: 'object' },
          animations: { type: 'object' },
          statics: { type: 'object' },
          values: { type: 'object' },
          complete: { type: 'boolean' },
          constants: { type: 'object' },
          styleProp: { type: 'string' },
          active: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const raw = (context.options[0] ?? {}) as Partial<ReleaseStylesOptions>;
    const declared = raw.modules?.[context.filename];
    const keptDefinition = declared?.definitionOnly === true;
    // Nothing was left in Plumeria, so a value that used to be a style object
    // is a class name everywhere — including where it arrives through a prop.
    const complete = raw.complete === true;
    const entry = keptDefinition ? undefined : declared;
    const themeBindings = keptDefinition
      ? []
      : (raw.themes?.[context.filename] ?? []);
    const animationBindings = keptDefinition
      ? []
      : (raw.animations?.[context.filename] ?? []);
    const styleProp = raw.styleProp ?? 'classStyle';
    const sourceCode = context.sourceCode;
    const moduleByLocal = new Map<string, ReleaseModule>();
    // `const myStyles = styles.card` — the local holds a class name once the
    // module is released, so a call site reading it resolves too.
    const styleLocals = new Set<string>();
    let active = Boolean(entry || raw.active || raw.complete);
    let coreImport: any;
    let coreLocal: string | undefined;
    let coreNeeded = true;

    const declarationOf = (statement: any): any =>
      statement.type === 'ExportNamedDeclaration'
        ? statement.declaration
        : statement;

    const removesDeclaration = (statement: any): boolean => {
      const declaration = declarationOf(statement);
      if (
        declaration?.type !== 'VariableDeclaration' ||
        declaration.declarations.length !== 1
      )
        return false;
      const only = declaration.declarations[0];
      if (only.id.type !== 'Identifier') return false;
      const called =
        only.init?.type === 'CallExpression'
          ? memberPath(only.init.callee)
          : undefined;
      if (called?.length !== 2) return false;
      if (called[1] === 'createStatic') return Boolean(entry);
      if (called[1] === 'createTheme')
        return themeBindings.includes(only.id.name);
      if (called[1] === 'keyframes' || called[1] === 'viewTransition')
        return animationBindings.includes(only.id.name);
      if (called[1] === 'create')
        return Boolean(
          entry &&
          (only.id.name === entry.binding || entry.aliases?.[only.id.name]),
        );
      return false;
    };

    const removesStatement = (statement: any): boolean => {
      if (keptDefinition) return false;
      if (statement.type !== 'ImportDeclaration')
        return removesDeclaration(statement);
      const specifier = String(statement.source.value);
      if (specifier === '@plumeria/core') return !coreNeeded;
      const bindings = [
        ...(importedAnimationBindings(specifier) ?? []),
        ...(importedThemeBindings(specifier) ?? []),
        ...(importedStaticBindings(specifier) ?? []),
      ];
      return (
        bindings.length > 0 &&
        statement.specifiers.length > 0 &&
        statement.specifiers.every(
          (candidate: any) =>
            candidate.type === 'ImportSpecifier' &&
            bindings.includes(
              candidate.imported.name ?? candidate.imported.value,
            ),
        )
      );
    };

    // Deleting a statement leaves its newline behind. Swallowing the gap is
    // only safe up to the next statement this pass keeps: ESLint drops fixes
    // whose ranges touch, so two neighbours cannot both claim the break.
    const removeStatement = (fixer: any, node: any) => {
      // Siblings come from whatever block holds the statement, not always the
      // program: a folded constant sits inside the component that read it.
      const body = (
        Array.isArray(node.parent?.body)
          ? node.parent.body
          : sourceCode.ast.body
      ) as any[];
      const next = body.find(
        (statement: any) => statement.range[0] >= node.range[1],
      );
      if (!next)
        return body === sourceCode.ast.body
          ? fixer.removeRange([node.range[0], sourceCode.text.length])
          : fixer.remove(node);
      if (removesStatement(next)) return fixer.remove(node);
      const anchor = importAnchor();
      if (node.range[1] <= anchor && next.range[0] >= anchor)
        return fixer.remove(node);
      return fixer.removeRange([node.range[0], next.range[0]]);
    };

    // A colocated `css.create` sits below the component, but its replacement is
    // an import and belongs with the others.
    // Just past the line the last import ends on. Sitting one character clear
    // of that import keeps the insertion from touching its removal, which
    // ESLint would read as a conflict and drop.
    const importAnchor = (): number => {
      const imports = (sourceCode.ast.body as any[]).filter(
        (statement: any) => statement.type === 'ImportDeclaration',
      );
      return imports.length > 0
        ? Math.min(
            imports[imports.length - 1].range[1] + 1,
            sourceCode.text.length,
          )
        : 0;
    };

    const specifierFor = (module: ReleaseModule): string => {
      if (!module.target) return module.source;
      const relative = path
        .relative(path.dirname(context.filename), module.target)
        .split(path.sep)
        .join('/');
      return relative.startsWith('.') ? relative : `./${relative}`;
    };

    const importOf = (specifiers: any[], source: any): string => {
      const defaultImport = specifiers.find(
        (specifier: any) => specifier.type === 'ImportDefaultSpecifier',
      );
      const namedImports = specifiers.filter(
        (specifier: any) => specifier.type === 'ImportSpecifier',
      );
      const clauses: string[] = [];
      if (defaultImport) clauses.push(sourceCode.getText(defaultImport));
      if (namedImports.length > 0) {
        clauses.push(
          `{ ${namedImports
            .map((specifier: any) => sourceCode.getText(specifier))
            .join(', ')} }`,
        );
      }
      return `import ${clauses.join(', ')} from ${sourceCode.getText(source)};`;
    };

    const importedFrom = <T>(
      specifier: string,
      table: Record<string, T> | undefined,
    ): T | undefined => {
      const resolved = resolveSourcePath(specifier, context.filename);
      return resolved ? table?.[resolved] : undefined;
    };

    // A module already pointed at its stylesheet still has to resolve: the fix
    // runs over its own output on every pass after the first.
    const byTarget = new Map<string, ReleaseModule>(
      Object.values(raw.modules ?? {}).flatMap((module) =>
        module.target ? [[module.target, module] as const] : [],
      ),
    );

    const importedReleasedModule = (specifier: string) => {
      const declared = importedFrom(specifier, raw.modules);
      if (declared) return declared;
      const resolved = resolveSourcePath(specifier, context.filename);
      return resolved ? byTarget.get(resolved) : undefined;
    };

    const importedThemeBindings = (specifier: string) =>
      importedFrom(specifier, raw.themes);

    const importedAnimationBindings = (specifier: string) =>
      importedFrom(specifier, raw.animations);

    const importedStaticBindings = (specifier: string) =>
      importedFrom(specifier, raw.statics);

    // A token read outside a style still has to work after its definition is
    // gone, and every one of them resolves to a plain string.
    const inlineByLocal = new Map<string, unknown>();
    const literalOf = (value: unknown): string | undefined =>
      typeof value === 'string'
        ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
        : typeof value === 'number'
          ? String(value)
          : undefined;

    const releasedRange = (): [number, number] | undefined => {
      if (!entry) return undefined;
      for (const statement of sourceCode.ast.body as any[]) {
        const declaration =
          statement.type === 'ExportNamedDeclaration'
            ? statement.declaration
            : statement;
        if (declaration?.type !== 'VariableDeclaration') continue;
        for (const candidate of declaration.declarations) {
          if (
            candidate.id.type === 'Identifier' &&
            candidate.id.name === entry.binding &&
            isCreate(candidate.init)
          )
            return statement.range;
        }
      }
      return undefined;
    };

    const onlyUsedByReleasedStyles = (local: string): boolean => {
      const range = releasedRange();
      if (!range) return false;
      const scope = sourceCode.getScope(sourceCode.ast);
      const moduleScope =
        scope.type === 'global' ? (scope.childScopes[0] ?? scope) : scope;
      const variable = moduleScope.variables.find(
        (candidate) => candidate.name === local,
      );
      if (!variable || variable.references.length === 0) return false;
      return variable.references.every(
        (reference) =>
          reference.identifier.range![0] >= range[0] &&
          reference.identifier.range![1] <= range[1],
      );
    };

    const removeImportedBindings = (
      node: any,
      bindings: string[],
      messageId: 'themeImport' | 'animationImport' | 'staticImport',
      dead?: (specifier: any) => boolean,
    ): boolean => {
      const removed = node.specifiers.filter((specifier: any) => {
        if (specifier.type !== 'ImportSpecifier') return false;
        const name = specifier.imported.name ?? specifier.imported.value;
        return bindings.includes(name) && (!dead || dead(specifier));
      });
      if (removed.length === 0) return false;
      const retained = node.specifiers.filter(
        (specifier: any) => !removed.includes(specifier),
      );
      context.report({
        node,
        messageId,
        fix: (fixer) =>
          retained.length === 0
            ? removeStatement(fixer, node)
            : fixer.replaceText(node, importOf(retained, node.source)),
      });
      return true;
    };

    const moduleOf = (node: any): ReleaseModule | undefined =>
      node?.type === 'MemberExpression' && node.object.type === 'Identifier'
        ? moduleByLocal.get(node.object.name)
        : undefined;

    const constants = raw.constants?.[context.filename] ?? {};

    const styleKey = (
      node: any,
    ): { module: ReleaseModule; key: string } | undefined => {
      const module = moduleOf(node);
      if (!module) return undefined;
      const written = node.computed
        ? node.property.type === 'Literal'
          ? String(node.property.value)
          : node.property.type === 'Identifier'
            ? constants[node.property.name]
            : undefined
        : node.property.name;
      if (written === undefined) return undefined;
      const alias = module.aliases?.[node.object.name];
      const key = alias ? alias[written] : written;
      return key === undefined ? undefined : { module, key };
    };

    const accessOf = (module: ReleaseModule, key: string): string =>
      `${module.binding}${IDENTIFIER.test(key) ? `.${key}` : `['${key}']`}`;

    const classText = (node: any): string | undefined => {
      const resolved = styleKey(node);
      return resolved ? accessOf(resolved.module, resolved.key) : undefined;
    };

    const releasedUse = (node: any, parent: any): boolean =>
      parent?.type === 'CallExpression' &&
      parent.callee === node &&
      parent.arguments.length > 0 &&
      parent.arguments.every(
        (argument: any) => classText(argument) !== undefined,
      );

    const removesCall = (method: string): boolean =>
      method === 'create' || method === 'createStatic'
        ? Boolean(entry)
        : method === 'createTheme'
          ? themeBindings.length > 0
          : method === 'keyframes' || method === 'viewTransition'
            ? animationBindings.length > 0
            : false;

    // `css` keeps earning its import while a call this pass does not rewrite
    // still reads it — a definition left in place, or an unresolved `css.use`.
    const survivesCore = (program: any): boolean => {
      if (!coreLocal) return false;
      let survives = false;
      const visit = (node: any, parent: any) => {
        if (survives || !node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          for (const child of node) visit(child, parent);
          return;
        }
        if (typeof node.type !== 'string') return;
        if (
          node.type === 'MemberExpression' &&
          node.object.type === 'Identifier' &&
          node.object.name === coreLocal
        ) {
          const method = node.computed
            ? node.property.type === 'Literal'
              ? String(node.property.value)
              : ''
            : node.property.name;
          survives =
            method === 'use'
              ? !releasedUse(node, parent)
              : !removesCall(method);
          return;
        }
        for (const key of Object.keys(node)) {
          if (key === 'parent' || key === 'loc' || key === 'range') continue;
          visit(node[key], node);
        }
      };
      visit(program.body, undefined);
      return survives;
    };

    const functionStyle = (value: any) => {
      if (value?.type !== 'CallExpression') return undefined;
      const resolved = styleKey(value.callee);
      if (!resolved) return undefined;
      const func = resolved.module.functions?.[resolved.key];
      if (!func || func.variables.length !== value.arguments.length)
        return undefined;
      return {
        className: accessOf(resolved.module, resolved.key),
        // React's CSSProperties has no room for a custom property, and a
        // computed key widens the literal to an index signature.
        // A bare number has to carry the unit Plumeria would have added to it;
        // a string is already a length or a keyword and passes through.
        declarations: func.variables.map((variable, index) => {
          const argument = sourceCode.getText(value.arguments[index]);
          const written = func.lengths?.[index]
            ? `typeof ${argument} === 'number' ? \`\${${argument}}px\` : ${argument}`
            : argument;
          return `['${variable}' as string]: ${written}`;
        }),
      };
    };
    // Anything the plan did not release keeps its Plumeria call site: a
    // half-rewritten file compiles as neither one thing nor the other.
    const resolveText = (value: any): string | undefined => {
      if (!value) return undefined;
      const called = functionStyle(value);
      if (called) return called.className;
      if (value.type === 'LogicalExpression') {
        const right = resolveText(value.right);
        return right === undefined
          ? undefined
          : `${sourceCode.getText(value.left)} ${value.operator} ${right}`;
      }
      if (value.type === 'ConditionalExpression') {
        const consequent = resolveText(value.consequent);
        const alternate = resolveText(value.alternate);
        return consequent === undefined || alternate === undefined
          ? undefined
          : `${sourceCode.getText(value.test)} ? ${consequent} : ${alternate}`;
      }
      if (value.type === 'Literal' && !value.value)
        return sourceCode.getText(value);
      if (value.type === 'Identifier' && styleLocals.has(value.name))
        return sourceCode.getText(value);
      return classText(value);
    };
    const declarationsOf = (value: any): string[] => {
      if (!value) return [];
      const called = functionStyle(value);
      if (called) return called.declarations;
      if (value.type === 'LogicalExpression')
        return declarationsOf(value.right);
      if (value.type === 'ConditionalExpression')
        return [
          ...declarationsOf(value.consequent),
          ...declarationsOf(value.alternate),
        ];
      return [];
    };
    return {
      Program(program: any) {
        if (entry) {
          moduleByLocal.set(entry.binding, entry);
          for (const owner of Object.keys(entry.aliases ?? {}))
            moduleByLocal.set(owner, entry);
        }
        for (const node of program.body as any[]) {
          if (node.type !== 'ImportDeclaration') continue;
          const specifier = String(node.source.value);
          if (specifier === '@plumeria/core') {
            coreImport = node;
            for (const candidate of node.specifiers) {
              if (candidate.type === 'ImportNamespaceSpecifier')
                coreLocal = candidate.local.name;
              else if (
                candidate.type === 'ImportSpecifier' &&
                (candidate.imported.name ?? candidate.imported.value) === 'css'
              )
                coreLocal = candidate.local.name;
            }
            continue;
          }
          const table = importedFrom(specifier, raw.values);
          if (table)
            for (const candidate of node.specifiers) {
              if (candidate.type !== 'ImportSpecifier') continue;
              const imported =
                candidate.imported.name ?? candidate.imported.value;
              if (imported in table)
                inlineByLocal.set(candidate.local.name, table[imported]);
            }
          const module = importedReleasedModule(specifier);
          if (!module) continue;
          // Importing something else from a file that happens to be a module
          // must not claim that module's binding name here.
          const importedBinding = node.specifiers.find(
            (candidate: any) =>
              (candidate.type === 'ImportSpecifier' &&
                (candidate.imported.name ?? candidate.imported.value) ===
                  module.binding) ||
              (candidate.type === 'ImportDefaultSpecifier' &&
                specifier.endsWith('.css')),
          );
          if (!importedBinding) continue;
          const local = importedBinding.local.name;
          moduleByLocal.set(local, { ...module, binding: local });
          active = true;
        }
        walk(program.body, (node: any) => {
          if (
            node.type !== 'VariableDeclarator' ||
            node.id.type !== 'Identifier' ||
            !styleKey(node.init)
          )
            return;
          styleLocals.add(node.id.name);
        });

        const migrating =
          active || themeBindings.length > 0 || animationBindings.length > 0;
        coreNeeded = keptDefinition || !migrating || survivesCore(program);
        if (
          coreImport &&
          !coreNeeded &&
          !entry &&
          themeBindings.length === 0 &&
          animationBindings.length === 0
        ) {
          context.report({
            node: coreImport,
            messageId: 'core',
            fix: (fixer) => removeStatement(fixer, coreImport),
          });
        }
      },

      ImportDeclaration(node: any) {
        if (
          !coreNeeded &&
          (entry || themeBindings.length > 0 || animationBindings.length > 0) &&
          node.source.value === '@plumeria/core'
        ) {
          context.report({
            node,
            messageId: 'core',
            fix: (fixer) => removeStatement(fixer, node),
          });
          return;
        }
        const importedAnimations = importedAnimationBindings(
          String(node.source.value),
        );
        if (importedAnimations) {
          if (
            removeImportedBindings(node, importedAnimations, 'animationImport')
          )
            return;
        }
        const importedThemes = importedThemeBindings(String(node.source.value));
        if (importedThemes) {
          if (removeImportedBindings(node, importedThemes, 'themeImport'))
            return;
        }
        const importedStatics = importedStaticBindings(
          String(node.source.value),
        );
        if (importedStatics) {
          if (
            removeImportedBindings(
              node,
              importedStatics,
              'staticImport',
              (specifier: any) =>
                onlyUsedByReleasedStyles(specifier.local.name),
            )
          )
            return;
        }
        const importedModule = importedReleasedModule(
          String(node.source.value),
        );
        if (importedModule) {
          const importedBinding = node.specifiers.find(
            (specifier: any) =>
              specifier.type === 'ImportSpecifier' &&
              (specifier.imported.name ?? specifier.imported.value) ===
                importedModule.binding,
          );
          const local = importedBinding?.local.name ?? importedModule.binding;
          if (importedModule.definitionOnly && importedBinding) {
            const retained = node.specifiers.filter(
              (specifier: any) => specifier !== importedBinding,
            );
            const released = `import ${local} from '${specifierFor(importedModule)}';`;
            context.report({
              node,
              messageId: 'definition',
              fix: (fixer) =>
                fixer.replaceText(
                  node,
                  retained.length === 0
                    ? released
                    : `${released}\n${importOf(retained, node.source)}`,
                ),
            });
          }
        }
      },

      VariableDeclaration(node: any) {
        if (node.declarations.length !== 1) return;
        const declaration = node.declarations[0];
        if (declaration.id.type !== 'Identifier') return;
        const path =
          declaration.init?.type === 'CallExpression'
            ? memberPath(declaration.init.callee)
            : undefined;
        if (
          path?.length === 2 &&
          ((entry && path[1] === 'createStatic') ||
            (path[1] === 'createTheme' &&
              themeBindings.includes(declaration.id.name)) ||
            ((path[1] === 'keyframes' || path[1] === 'viewTransition') &&
              animationBindings.includes(declaration.id.name)))
        ) {
          const target =
            node.parent?.type === 'ExportNamedDeclaration' ? node.parent : node;
          context.report({
            node: target,
            messageId:
              path[1] === 'createTheme'
                ? 'theme'
                : path[1] === 'keyframes' || path[1] === 'viewTransition'
                  ? 'animation'
                  : 'static',
            fix: (fixer) => removeStatement(fixer, target),
          });
          return;
        }
        if (!entry) return;
        if (!isCreate(declaration.init)) return;
        if (entry.aliases?.[declaration.id.name]) {
          const aliased =
            node.parent?.type === 'ExportNamedDeclaration' ? node.parent : node;
          context.report({
            node: aliased,
            messageId: 'definition',
            fix: (fixer) => removeStatement(fixer, aliased),
          });
          return;
        }
        if (declaration.id.name !== entry.binding) return;

        const exported = node.parent?.type === 'ExportNamedDeclaration';
        const target = exported ? node.parent : node;
        const imported = `import ${entry.binding} from '${entry.source}';`;
        const replacement = exported
          ? `${imported}\nexport { ${entry.binding} };`
          : imported;
        const anchor = importAnchor();
        context.report({
          node: target,
          messageId: 'definition',
          fix: (fixer) =>
            anchor >= target.range[0] && anchor <= target.range[1]
              ? fixer.replaceText(target, replacement)
              : [
                  fixer.insertTextBeforeRange(
                    [anchor, anchor],
                    `${replacement}\n`,
                  ),
                  removeStatement(fixer, target),
                ],
        });
      },

      Identifier(node: any) {
        const value = inlineByLocal.get(node.name);
        const literal = literalOf(value);
        if (literal === undefined) return;
        const parent = node.parent;
        if (
          parent?.type === 'ImportSpecifier' ||
          parent?.type === 'ExportSpecifier' ||
          (parent?.type === 'MemberExpression' && parent.property === node) ||
          (parent?.type === 'Property' &&
            parent.key === node &&
            !parent.computed)
        )
          return;
        context.report({
          node,
          messageId: 'token',
          fix: (fixer) => fixer.replaceText(node, literal),
        });
      },

      VariableDeclarator(node: any) {
        if (
          !active ||
          keptDefinition ||
          node.id.type !== 'Identifier' ||
          node.init?.type !== 'Literal' ||
          constants[node.id.name] !== node.init.value ||
          node.parent.declarations.length !== 1 ||
          // An exported constant is read by files this pass cannot see.
          node.parent.parent?.type === 'ExportNamedDeclaration'
        )
          return;
        const scope = sourceCode.getScope(node);
        const variable = scope.variables.find(
          (candidate) => candidate.name === node.id.name,
        );
        if (!variable || variable.references.length === 0) return;
        const onlyNamesKeys = variable.references.every((reference) => {
          if (reference.init) return true;
          const parent = (reference.identifier as any).parent;
          return (
            parent?.type === 'MemberExpression' &&
            parent.computed &&
            parent.property === reference.identifier &&
            Boolean(moduleOf(parent))
          );
        });
        if (!onlyNamesKeys) return;
        const target = node.parent;
        context.report({
          node: target,
          messageId: 'folded',
          fix: (fixer) => removeStatement(fixer, target),
        });
      },

      TSTypeReference(node: any) {
        if (!complete || keptDefinition) return;
        const name =
          node.typeName.type === 'TSQualifiedName'
            ? node.typeName.right.name
            : node.typeName.name;
        if (name !== 'Style') return;
        context.report({
          node,
          messageId: 'styleType',
          fix: (fixer) => fixer.replaceText(node, 'string'),
        });
      },

      MemberExpression(node: any) {
        if (node.object.type === 'Identifier') {
          const table = inlineByLocal.get(node.object.name);
          if (table && typeof table === 'object') {
            const key = node.computed
              ? node.property.type === 'Literal'
                ? String(node.property.value)
                : undefined
              : node.property.name;
            const literal =
              key === undefined
                ? undefined
                : literalOf((table as Record<string, unknown>)[key]);
            if (literal !== undefined) {
              context.report({
                node,
                messageId: 'token',
                fix: (fixer) => fixer.replaceText(node, literal),
              });
              return;
            }
          }
        }
        if (!entry?.aliases || node.object.type !== 'Identifier') return;
        const alias = entry.aliases[node.object.name];
        if (!alias) return;
        const key = node.computed
          ? node.property.type === 'Literal'
            ? String(node.property.value)
            : node.property.type === 'Identifier'
              ? constants[node.property.name]
              : undefined
          : node.property.name;
        const className = key ? alias[key] : undefined;
        if (!className) return;
        const access = IDENTIFIER.test(className)
          ? `.${className}`
          : `['${className}']`;
        context.report({
          node,
          messageId: 'alias',
          fix: (fixer) => fixer.replaceText(node, `${entry.binding}${access}`),
        });
      },

      // Not gated on the `css` import: the pass that retires the import and the
      // pass that rewrites this call are not guaranteed to be the same one.
      CallExpression(node: any) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.object.type !== 'Identifier' ||
          node.callee.property.name !== 'use'
        )
          return;
        const reader = node.callee.object.name;
        if (coreLocal ? reader !== coreLocal : moduleByLocal.has(reader))
          return;
        const texts = node.arguments.map(resolveText);
        if (texts.length === 0 || texts.some((text: any) => text === undefined))
          return;
        const replacement =
          texts.length === 1 && !node.arguments.some(needsFilter)
            ? (texts[0] as string)
            : node.arguments.some(needsFilter)
              ? `[${texts.join(', ')}].filter(Boolean).join(' ')`
              : `[${texts.join(', ')}].join(' ')`;
        context.report({
          node,
          messageId: 'use',
          fix: (fixer) => fixer.replaceText(node, replacement),
        });
      },

      JSXAttribute(node: any) {
        if (!active) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== styleProp)
          return;
        const expression =
          node.value?.type === 'JSXExpressionContainer'
            ? node.value.expression
            : undefined;
        const carried = node.parent.attributes.find(
          (attribute: any) =>
            attribute !== node &&
            attribute.type === 'JSXAttribute' &&
            attribute.name?.type === 'JSXIdentifier' &&
            attribute.name.name === 'className',
        );
        const takeProp = (valueText?: string) => {
          if (!carried) {
            context.report({
              node: node.name,
              messageId: 'prop',
              fix: (fixer) => fixer.replaceText(node.name, 'className'),
            });
            return;
          }
          const ours =
            valueText ??
            (node.value ? sourceCode.getText(node.value).slice(1, -1) : '');
          const theirs =
            carried.value?.type === 'JSXExpressionContainer'
              ? sourceCode.getText(carried.value.expression)
              : carried.value
                ? sourceCode.getText(carried.value)
                : "''";
          context.report({
            node,
            messageId: 'prop',
            fix: (fixer) => [
              fixer.replaceText(
                carried,
                `className={[${theirs}, ${ours}].filter(Boolean).join(' ')}`,
              ),
              fixer.removeRange([
                Math.min(node.range[0], carried.range[1]),
                node.range[1],
              ]),
            ],
          });
        };
        // A composition the plan already collapsed reads as one class.
        // Members may come from several modules; the one that folded them is
        // the first, and the key names where each of them landed.
        const mergedClass = (elements: any[]): string | undefined => {
          if (elements.length < 2) return undefined;
          const resolved = elements.map(styleKey);
          if (resolved.some((part) => !part?.module.target)) return undefined;
          const host = resolved[0]!.module;
          const signature = resolved
            .map((part) => `${part!.module.target}#${part!.key}`)
            .join('|');
          const name = host.merges?.[signature];
          return name ? accessOf(host, name) : undefined;
        };
        const replaceWithFunctionStyle = (
          className: string,
          declarations: string[],
        ) => {
          const styleAttribute = node.parent.attributes.find(
            (attribute: any) =>
              attribute.type === 'JSXAttribute' &&
              attribute.name.type === 'JSXIdentifier' &&
              attribute.name.name === 'style',
          );
          const classReplacement = `className={${className}}`;
          if (
            styleAttribute?.value?.type === 'JSXExpressionContainer' &&
            styleAttribute.value.expression.type !== 'JSXEmptyExpression'
          ) {
            const existing = sourceCode.getText(
              styleAttribute.value.expression,
            );
            const merged =
              styleAttribute.value.expression.type === 'ObjectExpression'
                ? `{ ...${existing}, ${declarations.join(', ')} }`
                : `{ ...(${existing}), ${declarations.join(', ')} }`;
            context.report({
              node,
              messageId: 'functionStyle',
              fix: (fixer) => [
                fixer.replaceText(node, classReplacement),
                fixer.replaceText(styleAttribute.value.expression, merged),
              ],
            });
          } else {
            context.report({
              node,
              messageId: 'functionStyle',
              fix: (fixer) =>
                fixer.replaceText(
                  node,
                  `${classReplacement} style={{ ${declarations.join(', ')} }}`,
                ),
            });
          }
        };
        const directFunction = functionStyle(expression);
        if (directFunction) {
          replaceWithFunctionStyle(
            directFunction.className,
            directFunction.declarations,
          );
          return;
        }
        if (
          expression?.type === 'CallExpression' &&
          moduleOf(expression.callee)
        ) {
          context.report({
            node,
            messageId: 'unsupportedFunctionStyle',
          });
          return;
        }
        if (expression?.type === 'ArrayExpression') {
          const elements = expression.elements.filter(Boolean);
          const merged = mergedClass(elements);
          if (merged) {
            if (carried) {
              takeProp(merged);
              return;
            }
            context.report({
              node: expression,
              messageId: 'composition',
              fix: (fixer) => fixer.replaceText(expression, merged),
            });
            takeProp();
            return;
          }
          if (elements.length === 0) {
            takeProp();
            return;
          }
          const texts = elements.map(resolveText);
          if (texts.some((text: any) => text === undefined)) return;
          // A slot the stylesheet cannot rank high enough carries its own
          // override alongside it, under the same condition.
          const ranked = elements.map((element: any) =>
            element.type === 'LogicalExpression'
              ? styleKey(element.right)
              : styleKey(element),
          );
          const module = ranked[0]?.module;
          const perSlot =
            module && ranked.every((part: any) => part?.module === module)
              ? module.overrides?.[
                  ranked.map((part: any) => part!.key).join('|')
                ]
              : undefined;
          if (perSlot) {
            for (let slot = elements.length - 1; slot >= 0; slot--) {
              const name = perSlot[slot];
              if (!name) continue;
              const element = elements[slot];
              const access = accessOf(module as ReleaseModule, name);
              texts.splice(
                slot + 1,
                0,
                element.type === 'LogicalExpression'
                  ? `${sourceCode.getText(element.left)} ${element.operator} ${access}`
                  : access,
              );
              elements.splice(slot + 1, 0, element);
            }
          }
          const declarations = elements.flatMap(declarationsOf);
          // One shape for every composition: the array the call site already
          // wrote, joined. `filter` only earns its place when a member can
          // turn out falsy.
          const replacement = elements.some(needsFilter)
            ? `[${texts.join(', ')}].filter(Boolean).join(' ')`
            : `[${texts.join(', ')}].join(' ')`;
          if (declarations.length > 0) {
            replaceWithFunctionStyle(replacement, declarations);
            return;
          }
          if (carried) {
            takeProp(replacement);
            return;
          }
          context.report({
            node: expression,
            messageId: 'composition',
            fix: (fixer) => fixer.replaceText(expression, replacement),
          });
          takeProp();
          return;
        }
        if (!complete && expression && resolveText(expression) === undefined)
          return;
        takeProp();
      },
    };
  },
};
