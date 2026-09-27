import type { Rule, Scope } from 'eslint';
import { resolveExportValue, resolveImportPath } from '@plumeria/utils';

const CORE = '@plumeria/core';

type Binding =
  | { kind: 'value'; node: any }
  | { kind: 'import'; source: string; importedName: string | null };

const unwrap = (node: any): any => {
  while (
    node &&
    (node.type === 'TSAsExpression' ||
      node.type === 'TSSatisfiesExpression' ||
      node.type === 'TSNonNullExpression' ||
      node.type === 'TSTypeAssertion')
  )
    node = node.expression;
  return node;
};

const findVariable = (scope: Scope.Scope | null, name: string) => {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) return variable;
  }
  return undefined;
};

const importedNameOf = (specifier: any): string | null => {
  if (specifier.type === 'ImportNamespaceSpecifier') return null;
  if (specifier.type === 'ImportDefaultSpecifier') return 'default';
  return specifier.imported.type === 'Identifier'
    ? specifier.imported.name
    : String(specifier.imported.value);
};

export function staticValueResolver(context: Rule.RuleContext) {
  const { sourceCode, filename } = context;
  const visiting = new Set<any>();

  const bindingOf = (node: any): Binding | undefined => {
    const definition = findVariable(sourceCode.getScope(node), node.name)
      ?.defs[0];
    if (!definition) return undefined;
    if (
      definition.type === 'Variable' &&
      definition.parent.kind === 'const' &&
      definition.node.init
    ) {
      return { kind: 'value', node: definition.node.init };
    }
    if (definition.type === 'ImportBinding') {
      return {
        kind: 'import',
        source: String((definition.parent as any).source.value),
        importedName: importedNameOf(definition.node),
      };
    }
    return undefined;
  };

  const importedValue = (source: string, exportName: string): unknown => {
    const actualPath = resolveImportPath(source, filename);
    if (!actualPath) return undefined;
    return resolveExportValue(actualPath, exportName);
  };

  const isCreateStatic = (callee: any): boolean => {
    callee = unwrap(callee);
    if (callee.type === 'Identifier') {
      const binding = bindingOf(callee);
      return (
        binding?.kind === 'import' &&
        binding.source === CORE &&
        binding.importedName === 'createStatic'
      );
    }
    if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 'createStatic' &&
      callee.object.type === 'Identifier'
    ) {
      const binding = bindingOf(callee.object);
      return (
        binding?.kind === 'import' &&
        binding.source === CORE &&
        (binding.importedName === null || binding.importedName === 'default')
      );
    }
    return false;
  };

  const memberKey = (node: any): string | undefined => {
    if (!node.computed && node.property.type === 'Identifier') {
      return node.property.name;
    }
    const key = resolve(node.property);
    return typeof key === 'string' ? key : undefined;
  };

  const resolve = (node: any): unknown => {
    node = unwrap(node);
    if (!node || visiting.has(node)) return undefined;
    visiting.add(node);
    try {
      switch (node.type) {
        case 'Literal':
          return typeof node.value === 'string' ||
            typeof node.value === 'number' ||
            typeof node.value === 'boolean'
            ? node.value
            : undefined;
        case 'BinaryExpression': {
          const left = resolve(node.left);
          const right = resolve(node.right);
          if (left === undefined || right === undefined) return undefined;
          if (node.operator === '+') {
            return typeof left === 'object' || typeof right === 'object'
              ? undefined
              : (left as any) + (right as any);
          }
          if (typeof left !== 'number' || typeof right !== 'number')
            return undefined;
          switch (node.operator) {
            case '-':
              return left - right;
            case '*':
              return left * right;
            case '/':
              return left / right;
            case '%':
              return left % right;
            case '**':
              return left ** right;
            default:
              return undefined;
          }
        }
        case 'TemplateLiteral':
          return node.expressions.length === 0
            ? node.quasis[0].value.cooked
            : undefined;
        case 'Identifier': {
          const binding = bindingOf(node);
          if (binding?.kind === 'value') return resolve(binding.node);
          if (binding?.kind === 'import' && binding.importedName) {
            return importedValue(binding.source, binding.importedName);
          }
          return undefined;
        }
        case 'MemberExpression': {
          const key = memberKey(node);
          if (key === undefined) return undefined;
          const object = unwrap(node.object);
          if (object.type === 'Identifier') {
            const binding = bindingOf(object);
            if (binding?.kind === 'import' && !binding.importedName) {
              return importedValue(binding.source, key);
            }
          }
          const value = resolve(object);
          return value && typeof value === 'object' && Object.hasOwn(value, key)
            ? (value as Record<string, unknown>)[key]
            : undefined;
        }
        case 'ObjectExpression': {
          const value: Record<string, unknown> = Object.create(null);
          for (const property of node.properties) {
            if (property.type !== 'Property' || property.kind !== 'init')
              continue;
            const key =
              !property.computed && property.key.type === 'Identifier'
                ? property.key.name
                : resolve(property.key);
            if (typeof key !== 'string') continue;
            value[key] = resolve(property.value);
          }
          return value;
        }
        case 'CallExpression':
          return isCreateStatic(node.callee)
            ? resolve(node.arguments[0])
            : undefined;
        default:
          return undefined;
      }
    } finally {
      visiting.delete(node);
    }
  };

  return (node: Rule.Node | any): unknown => resolve(node);
}
