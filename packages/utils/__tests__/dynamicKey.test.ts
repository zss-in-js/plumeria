import { parseSync, type ObjectExpression } from '@swc/core';
import type { CSSValue } from '../src/types';
import {
  styleFunctionsOf,
  isUnitlessProp,
  splitVarByUnit,
  applyVarFallback,
  resolveDynamicStyle,
  type DynamicStyleTables,
} from '../src/dynamicKey';

const object = (code: string): ObjectExpression =>
  (parseSync(`const styles = ${code}`, { syntax: 'typescript' }).body[0] as any)
    .declarations[0].init;
const tables: DynamicStyleTables = {
  keyframesHashTable: {},
  viewTransitionHashTable: {},
  createThemeHashTable: {},
  createThemeObjectTable: {},
  createHashTable: {},
  createStaticHashTable: {},
  createStaticObjectTable: {},
  variantsHashTable: {},
};

describe('styleFunctionsOf', () => {
  test('extracts arrow and regular functions, parameters and literal defaults', () => {
    const result = styleFunctionsOf(
      object(`{
      arrow: (size, opacity = 1) => ({ width: size, opacity }),
      regular: function(size = 2) { return { width: size }; },
      wrapped: function(size) { return ({ width: size }); },
      named: ({ width, color = 'red', opacity: alpha, height: size = 4 }) => ({ width, color, opacity: alpha, height: size }),
      empty: () => ({}),
      array: ([size]) => ({ width: size }),
      rest: (...size) => ({ width: 1 }),
      emptyNamed: ({}) => ({}),
      unsupported: ({ ...rest }) => ({}),
      quoted: ({ 'width': size }) => ({}),
      static: { color: 'red' },
      'ignored': () => ({}),
      method() {},
      noReturn: () => {},
      bareReturn: () => { return; },
      number: () => 1,
      ...other
    }`),
    );
    expect(Object.keys(result)).toEqual([
      'arrow',
      'regular',
      'wrapped',
      'named',
      'empty',
      'array',
      'rest',
      'emptyNamed',
      'unsupported',
      'quoted',
    ]);
    expect(result.arrow.params).toEqual(['size', 'opacity']);
    expect(result.arrow.defaults?.opacity).toMatchObject({
      type: 'NumericLiteral',
      value: 1,
    });
    expect(result.regular.defaults?.size).toMatchObject({ value: 2 });
    expect(result.named.named).toEqual([
      { key: 'width', local: 'width' },
      { key: 'color', local: 'color' },
      { key: 'opacity', local: 'alpha' },
      { key: 'height', local: 'size' },
    ]);
    expect(result.named.defaults).toMatchObject({
      color: { value: 'red' },
      size: { value: 4 },
    });
    for (const key of ['array', 'rest', 'emptyNamed', 'unsupported', 'quoted'])
      expect(result[key].named).toBeUndefined();
    expect(result.array.params).toEqual(['arg']);
    expect(result.wrapped.body.type).toBe('ObjectExpression');
  });

  test('handles incomplete AST nodes without inventing parameters or bodies', () => {
    const ast = object('{ named: ({ x }) => ({}), regular: function() {} }');
    const fn = (ast.properties[0] as any).value;
    delete fn.params[0].properties;
    expect(styleFunctionsOf(ast).named.named).toBeUndefined();
    fn.params = [null];
    expect(styleFunctionsOf(ast).named.params).toEqual(['arg']);
    const regular = (ast.properties[1] as any).value;
    delete regular.body.stmts;
    expect(styleFunctionsOf(ast).regular).toBeUndefined();
    delete regular.body;
    expect(styleFunctionsOf(ast).regular).toBeUndefined();
  });
});

describe('CSS variable unit rules', () => {
  test.each([
    ['opacity', true],
    ['--custom', true],
    ['width', false],
  ])('%s unitless = %s', (prop, expected) => {
    expect(isUnitlessProp(prop)).toBe(expected);
  });

  test('leaves unused variables and variables sharing one unit rule alone', () => {
    expect(
      splitVarByUnit({ color: 'red', ':hover': { width: 1 } }, '--size'),
    ).toEqual([]);
    expect(
      splitVarByUnit({ width: 'var(--size)', height: 'var(--size)' }, '--size'),
    ).toEqual([{ cssVar: '--size', prop: 'width' }]);
  });

  test('splits nested declarations by units and replaces every occurrence', () => {
    const style = {
      width: 'var(--size)',
      ':hover': {
        opacity: 'calc(var(--size) + var(--size))',
        height: 'var(--size)',
        color: 'red',
        nested: { '--custom': 'var(--size)' },
      },
      // Exercise the runtime guard for a null declaration.
      other: null as unknown as CSSValue,
    };
    expect(splitVarByUnit(style, '--size')).toEqual([
      { cssVar: '--size', prop: 'width' },
      { cssVar: '--size-opacity', prop: 'opacity' },
    ]);
    expect(style[':hover']).toEqual({
      opacity: 'calc(var(--size-opacity) + var(--size-opacity))',
      height: 'var(--size)',
      color: 'red',
      nested: { '--custom': 'var(--size-opacity)' },
    });
    applyVarFallback(style, '--size', 4);
    applyVarFallback(style, '--size-opacity', 4);
    expect(style.width).toBe('var(--size, 4px)');
    expect(style[':hover'].opacity).toBe(
      'calc(var(--size-opacity, 4) + var(--size-opacity, 4))',
    );
    expect(style[':hover'].nested['--custom']).toBe('var(--size-opacity, 4)');
    const reverse = { opacity: 'var(--x)', marginTop: 'var(--x)' };
    expect(splitVarByUnit(reverse, '--x')[1]).toEqual({
      cssVar: '--x-margin-top',
      prop: 'marginTop',
    });
  });
});

describe('resolveDynamicStyle', () => {
  test('resolves static values without mutating the caller table', () => {
    const func = styleFunctionsOf(
      object('{ root: (size = 2) => ({ width: size }) }'),
    ).root;
    const staticTable = { size: 10 };
    expect(resolveDynamicStyle(func, [], staticTable, tables)).toEqual({
      style: { width: 10 },
      varGroups: new Map(),
    });
    expect(staticTable).toEqual({ size: 10 });
    const plain = { params: [], body: object('{ color: "red" }') };
    expect(resolveDynamicStyle(plain, [], {}, tables)?.style).toEqual({
      color: 'red',
    });
  });

  test('deduplicates runtime parameters and adds unit-specific default fallbacks', () => {
    const func = styleFunctionsOf(
      object(
        '{ root: (size = 4, color = "red", unused = true) => ({ width: size, opacity: size, color }) }',
      ),
    ).root;
    const result = resolveDynamicStyle(
      func,
      ['size', 'size', 'missing'],
      {},
      tables,
    )!;
    expect([...result.varGroups.keys()]).toEqual([
      'size',
      'missing',
      'color',
      'unused',
    ]);
    const [length, unitless] = result.varGroups.get('size')!;
    expect(result.style).toEqual({
      width: `var(${length.cssVar}, 4px)`,
      opacity: `var(${unitless.cssVar}, 4)`,
      color: `var(${result.varGroups.get('color')![0].cssVar}, red)`,
    });
    expect(result.varGroups.get('missing')).toEqual([]);
    expect(result.varGroups.get('unused')).toEqual([]);
    expect(resolveDynamicStyle(func, ['size'], {}, tables)?.style).toEqual(
      resolveDynamicStyle(func, [], {}, tables)?.style,
    );
  });
});
