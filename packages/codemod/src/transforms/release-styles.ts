/**
 * @fileoverview Replace Plumeria definitions and classStyle with CSS Modules
 */

import type { Rule } from 'eslint';
import * as path from 'node:path';

export interface ReleaseModule {
  source: string;
  binding: string;
  functions?: Record<string, { params: string[]; variables: string[] }>;
}

export interface ReleaseStylesOptions {
  modules: Record<string, ReleaseModule>;
  themes?: Record<string, string[]>;
  animations?: Record<string, string[]>;
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
          styleProp: { type: 'string' },
          active: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const raw = (context.options[0] ?? {}) as Partial<ReleaseStylesOptions>;
    const entry = raw.modules?.[context.filename];
    const themeBindings = raw.themes?.[context.filename] ?? [];
    const animationBindings = raw.animations?.[context.filename] ?? [];
    const styleProp = raw.styleProp ?? 'classStyle';
    const sourceCode = context.sourceCode;
    let active = Boolean(entry || raw.active);
    let activeModule = entry;

    const importedReleasedModule = (
      specifier: string,
    ): ReleaseModule | undefined => {
      if (!specifier.startsWith('.')) return undefined;
      const resolved = path.resolve(path.dirname(context.filename), specifier);
      const withoutExtension = resolved.replace(/\.[^.]+$/, '');
      const source = Object.keys(raw.modules ?? {}).find(
        (candidate) => candidate.replace(/\.[^.]+$/, '') === withoutExtension,
      );
      return source ? raw.modules?.[source] : undefined;
    };

    const importedThemeBindings = (specifier: string): string[] | undefined => {
      if (!specifier.startsWith('.')) return undefined;
      const resolved = path.resolve(path.dirname(context.filename), specifier);
      const withoutExtension = resolved.replace(/\.[^.]+$/, '');
      const source = Object.keys(raw.themes ?? {}).find(
        (candidate) => candidate.replace(/\.[^.]+$/, '') === withoutExtension,
      );
      return source ? raw.themes?.[source] : undefined;
    };

    const importedAnimationBindings = (
      specifier: string,
    ): string[] | undefined => {
      if (!specifier.startsWith('.')) return undefined;
      const resolved = path.resolve(path.dirname(context.filename), specifier);
      const withoutExtension = resolved.replace(/\.[^.]+$/, '');
      const source = Object.keys(raw.animations ?? {}).find(
        (candidate) => candidate.replace(/\.[^.]+$/, '') === withoutExtension,
      );
      return source ? raw.animations?.[source] : undefined;
    };

    const removeImportedBindings = (
      node: any,
      bindings: string[],
      messageId: 'themeImport' | 'animationImport',
    ): boolean => {
      const removed = node.specifiers.filter((specifier: any) => {
        if (specifier.type !== 'ImportSpecifier') return false;
        const name = specifier.imported.name ?? specifier.imported.value;
        return bindings.includes(name);
      });
      if (removed.length === 0) return false;
      const retained = node.specifiers.filter(
        (specifier: any) => !removed.includes(specifier),
      );
      context.report({
        node,
        messageId,
        fix: (fixer) => {
          if (retained.length === 0) return fixer.remove(node);
          const defaultImport = retained.find(
            (specifier: any) => specifier.type === 'ImportDefaultSpecifier',
          );
          const namedImports = retained.filter(
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
          return fixer.replaceText(
            node,
            `import ${clauses.join(', ')} from ${sourceCode.getText(node.source)};`,
          );
        },
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
          activeModule = {
            ...importedModule,
            binding: importedBinding?.local.name ?? importedModule.binding,
          };
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
        if (
          declaration.id.name !== entry.binding ||
          !isCreate(declaration.init)
        )
          return;

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

      JSXAttribute(node: any) {
        if (!active) return;
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== styleProp)
          return;
        const expression =
          node.value?.type === 'JSXExpressionContainer'
            ? node.value.expression
            : undefined;
        const moduleInfo = activeModule;
        const functionStyle = (value: any) => {
          if (
            !moduleInfo ||
            value?.type !== 'CallExpression' ||
            value.callee.type !== 'MemberExpression' ||
            value.callee.object.type !== 'Identifier' ||
            value.callee.object.name !== moduleInfo.binding
          )
            return undefined;
          const key = value.callee.computed
            ? value.callee.property.type === 'Literal'
              ? String(value.callee.property.value)
              : undefined
            : value.callee.property.name;
          const func = key ? moduleInfo.functions?.[key] : undefined;
          if (!key || !func || func.variables.length !== value.arguments.length)
            return undefined;
          return {
            className: `${moduleInfo.binding}.${key}`,
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
          expression.callee.type === 'MemberExpression' &&
          expression.callee.object.type === 'Identifier' &&
          expression.callee.object.name === moduleInfo?.binding
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
