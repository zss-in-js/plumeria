import type { ObjectExpression, SpreadElement } from '@swc/core';

type SourceProperty = ObjectExpression['properties'][number];
type SourceObject = ObjectExpression;

type StaticValues = Record<string, unknown>;

type SpreadInfo = { values: StaticValues; source?: SourceObject };

type ResolveSpread = (prop: SpreadElement) => SpreadInfo | null;

const keyValue = (key: unknown): string | number | undefined => {
  if (!key || typeof key !== 'object' || !('value' in key)) return;
  const value = key.value;
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined;
};

export type StyleContext = {
  spread: ResolveSpread;
  resolvesValue: (value: unknown) => boolean;
};

const unresolvableValue = (
  key: string | number,
  node: { type: string },
): Error =>
  new Error(
    `[plumeria] Cannot resolve the value of "${key}" at build time (${node.type}). ` +
      `Values in css.create must be statically known; pass a runtime value through the ` +
      `function form, css.create({ name: (value) => ({ ... }) }).`,
  );

const overwrittenLater = (
  properties: SourceProperty[],
  index: number,
  key: string | number,
  context: StyleContext | undefined,
): boolean => {
  for (let i = index + 1; i < properties.length; i++) {
    const later = properties[i];
    if (later.type === 'SpreadElement') {
      const provided = context?.spread(later);
      if (!provided) return true;
      if (String(key) in provided.values) return true;
      continue;
    }
    if (later.type === 'KeyValueProperty' && keyValue(later.key) === key)
      return true;
  }
  return false;
};

const RUNTIME_ONLY = new Set([
  'CallExpression',
  'NewExpression',
  'AwaitExpression',
  'TaggedTemplateExpression',
  'YieldExpression',
]);

const readsAnyOf = (node: unknown, names: Set<string>): boolean => {
  if (!node || typeof node !== 'object') return false;
  const value = node as Record<string, unknown>;
  if (value.type === 'Identifier' && typeof value.value === 'string')
    return names.has(value.value);
  for (const key of Object.keys(value)) {
    if (key === 'span') continue;
    const child = value[key];
    if (Array.isArray(child)) {
      for (const item of child) if (readsAnyOf(item, names)) return true;
    } else if (readsAnyOf(child, names)) return true;
  }
  return false;
};

const parameterNames = (func: any): Set<string> => {
  const names = new Set<string>();
  const add = (pattern: any) => {
    if (!pattern || typeof pattern !== 'object') return;
    if (pattern.type === 'Identifier' && typeof pattern.value === 'string')
      names.add(pattern.value);
    for (const key of ['pat', 'left', 'argument', 'value', 'key'])
      if (pattern[key]) add(pattern[key]);
    for (const key of ['properties', 'elements'])
      if (Array.isArray(pattern[key])) pattern[key].forEach(add);
  };
  (func.params ?? []).forEach((param: any) => add(param?.pat ?? param));
  return names;
};

const assertStyleFunction = (
  func: any,
  context: StyleContext | undefined,
): void => {
  const params = parameterNames(func);
  const body = func.body;
  const returned =
    body?.type === 'ObjectExpression'
      ? body
      : body?.type === 'ParenthesisExpression' &&
          body.expression?.type === 'ObjectExpression'
        ? body.expression
        : null;
  if (!returned) return;

  const walk = (object: any): void => {
    const properties = object.properties ?? [];
    for (let index = 0; index < properties.length; index++) {
      const prop = properties[index];
      if (prop.type !== 'KeyValueProperty') continue;
      const key = keyValue(prop.key);
      if (
        (typeof key === 'string' || typeof key === 'number') &&
        overwrittenLater(properties, index, key, context)
      )
        continue;
      const value = prop.value;
      if (!value) continue;
      if (value.type === 'ObjectExpression') {
        walk(value);
        continue;
      }
      if (RUNTIME_ONLY.has(value.type) && !readsAnyOf(value, params))
        throw unresolvableValue(key ?? '', value);
      if (
        (value.type === 'Identifier' || value.type === 'MemberExpression') &&
        context &&
        !readsAnyOf(value, params) &&
        !context.resolvesValue(value)
      )
        throw unresolvableValue(key ?? '', value);
    }
  };

  walk(returned);
};

const keysSuppliedAfter = (
  properties: SourceProperty[],
  index: number,
  context: StyleContext | undefined,
): Set<string> | null => {
  const keys = new Set<string>();
  for (let i = index + 1; i < properties.length; i++) {
    const later = properties[i];
    if (later.type === 'SpreadElement') {
      const provided = context?.spread(later);
      if (!provided) return null;
      for (const name of Object.keys(provided.values)) keys.add(name);
      continue;
    }
    if (later.type !== 'KeyValueProperty') continue;
    const key = keyValue(later.key);
    if (typeof key !== 'string' && typeof key !== 'number') return null;
    keys.add(String(key));
  }
  return keys;
};

export const assertNoDroppedValues = (
  node: SourceObject,
  resolved: StaticValues | null | undefined,
  context?: StyleContext,
  ignore?: Set<string>,
): void => {
  if (!resolved) return;

  for (let index = 0; index < node.properties.length; index++) {
    const prop = node.properties[index];

    if (prop.type === 'SpreadElement') {
      const provided = context?.spread(prop);
      if (!provided?.source) continue;
      const replaced = keysSuppliedAfter(node.properties, index, context);
      if (replaced)
        assertNoDroppedValues(
          provided.source,
          provided.values,
          context,
          replaced,
        );
      continue;
    }

    if (prop.type !== 'KeyValueProperty') continue;

    const key = keyValue(prop.key);
    if (typeof key !== 'string' && typeof key !== 'number') continue;
    if (ignore?.has(String(key))) continue;
    if (overwrittenLater(node.properties, index, key, context)) continue;

    const value = prop.value;
    if (!value) continue;
    if (
      value.type === 'ArrowFunctionExpression' ||
      value.type === 'FunctionExpression'
    ) {
      assertStyleFunction(value, context);
      continue;
    }
    if (value.type === 'NullLiteral') continue;

    if (!(key in resolved)) throw unresolvableValue(key, value);

    if (value.type === 'ObjectExpression') {
      const nested = resolved[key];
      if (nested && typeof nested === 'object')
        assertNoDroppedValues(
          value as SourceObject,
          nested as StaticValues,
          context,
        );
    }
  }
};
