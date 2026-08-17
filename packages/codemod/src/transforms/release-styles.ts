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
  functions?: Record<string, { params: string[]; variables: string[] }>;
}

export interface ReleaseStylesOptions {
  modules: Record<string, ReleaseModule>;
  themes?: Record<string, string[]>;
  animations?: Record<string, string[]>;
  statics?: Record<string, string[]>;
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
    const entry = declared?.definitionOnly ? undefined : declared;
    const themeBindings = raw.themes?.[context.filename] ?? [];
    const animationBindings = raw.animations?.[context.filename] ?? [];
    const styleProp = raw.styleProp ?? 'classStyle';
    const sourceCode = context.sourceCode;
    let active = Boolean(entry || raw.active);
    let activeModule = entry;

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

    const importedReleasedModule = (specifier: string) =>
      importedFrom(specifier, raw.modules);

    const importedThemeBindings = (specifier: string) =>
      importedFrom(specifier, raw.themes);

    const importedAnimationBindings = (specifier: string) =>
      importedFrom(specifier, raw.animations);

    const importedStaticBindings = (specifier: string) =>
      importedFrom(specifier, raw.statics);

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
            ? fixer.remove(node)
            : fixer.replaceText(node, importOf(retained, node.source)),
      });
      return true;
    };

    return {
      ImportDeclaration(node: any) {
        if (
          (entry || themeBindings.length > 0 || animationBindings.length > 0) &&
          node.source.value === '@plumeria/core'
        ) {
          context.report({
            node,
            messageId: 'core',
            fix: (fixer) => fixer.remove(node),
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
          active = true;
          const importedBinding = node.specifiers.find(
            (specifier: any) =>
              specifier.type === 'ImportSpecifier' &&
              (specifier.imported.name ?? specifier.imported.value) ===
                importedModule.binding,
          );
          const local = importedBinding?.local.name ?? importedModule.binding;
          activeModule = { ...importedModule, binding: local };
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
            fix: (fixer) => fixer.remove(target),
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
            fix: (fixer) => fixer.remove(aliased),
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
        context.report({
          node: target,
          messageId: 'definition',
          fix: (fixer) => fixer.replaceText(target, replacement),
        });
      },

      MemberExpression(node: any) {
        if (!entry?.aliases || node.object.type !== 'Identifier') return;
        const alias = entry.aliases[node.object.name];
        if (!alias) return;
        const key = node.computed
          ? node.property.type === 'Literal'
            ? String(node.property.value)
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

      JSXAttribute(node: any) {
        if (!active) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== styleProp)
          return;
        const expression =
          node.value?.type === 'JSXExpressionContainer'
            ? node.value.expression
            : undefined;
        const moduleInfo = activeModule;
        const readsModule = (callee: any): boolean =>
          Boolean(
            moduleInfo &&
            callee?.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            (callee.object.name === moduleInfo.binding ||
              moduleInfo.aliases?.[callee.object.name]),
          );
        const styleKey = (callee: any): string | undefined => {
          if (!readsModule(callee)) return undefined;
          const raw = callee.computed
            ? callee.property.type === 'Literal'
              ? String(callee.property.value)
              : undefined
            : callee.property.name;
          if (raw === undefined) return undefined;
          const alias = moduleInfo!.aliases?.[callee.object.name];
          return alias ? alias[raw] : raw;
        };
        const functionStyle = (value: any) => {
          if (!moduleInfo || value?.type !== 'CallExpression') return undefined;
          const key = styleKey(value.callee);
          const func = key ? moduleInfo.functions?.[key] : undefined;
          if (!key || !func || func.variables.length !== value.arguments.length)
            return undefined;
          const access = IDENTIFIER.test(key) ? `.${key}` : `['${key}']`;
          return {
            className: `${moduleInfo.binding}${access}`,
            declarations: func.variables.map((variable, index) => {
              const argument = sourceCode.getText(value.arguments[index]);
              return `'${variable}': ${argument}`;
            }),
          };
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
          readsModule(expression.callee)
        ) {
          context.report({
            node,
            messageId: 'unsupportedFunctionStyle',
          });
          return;
        }
        if (expression?.type === 'ArrayExpression') {
          const elements = expression.elements.filter(Boolean);
          if (elements.length > 0) {
            const declarations: string[] = [];
            const texts: string[] = elements.map((element: any) => {
              const resolved = functionStyle(element);
              if (!resolved) return sourceCode.getText(element);
              declarations.push(...resolved.declarations);
              return resolved.className;
            });
            const replacement = elements.some(needsFilter)
              ? `[${texts.join(', ')}].filter(Boolean).join(' ')`
              : `\`${texts.map((text) => `\${${text}}`).join(' ')}\``;
            if (declarations.length > 0) {
              replaceWithFunctionStyle(replacement, declarations);
              return;
            }
            context.report({
              node: expression,
              messageId: 'composition',
              fix: (fixer) => fixer.replaceText(expression, replacement),
            });
          }
        }
        context.report({
          node: node.name,
          messageId: 'prop',
          fix: (fixer) => fixer.replaceText(node.name, 'className'),
        });
      },
    };
  },
};
