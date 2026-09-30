import { parseSync } from '@swc/core';
import type { ObjectExpression } from '@swc/core';
import { assertNoDroppedValues } from '../src/unresolvableValue';
import type { StyleContext } from '../src/unresolvableValue';

const object = (source: string) =>
  (parseSync(`(${source})`, { syntax: 'typescript' }).body[0] as any).expression
    .expression as ObjectExpression;

const context = (
  spreads: Record<
    string,
    { values: Record<string, unknown>; source?: string }
  > = {},
  options: { resolves?: boolean; sourceOf?: (node: unknown) => string } = {},
): StyleContext => ({
  spread: (prop) => {
    const name = (prop.arguments as any).value;
    const spread = spreads[name];
    if (!spread) return null;
    return {
      values: spread.values,
      source: spread.source ? object(spread.source) : undefined,
    };
  },
  resolvesValue: () => options.resolves ?? false,
  sourceOf: options.sourceOf,
});

const UNRESOLVABLE = /Cannot resolve the value of/;

describe('assertNoDroppedValues: how the unresolvable value is named', () => {
  it('shows the source the caller provides', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ color: read() }'),
        {},
        context({}, { sourceOf: () => 'read()' }),
      ),
    ).toThrow('Cannot resolve the value of "color" at build time (read()).');
  });

  it('falls back to the node type without a context', () => {
    expect(() =>
      assertNoDroppedValues(object('{ color: read() }'), {}),
    ).toThrow(
      'Cannot resolve the value of "color" at build time (CallExpression).',
    );
  });

  it('falls back to the node type when the context has no source', () => {
    expect(() =>
      assertNoDroppedValues(object('{ color: read() }'), {}, context()),
    ).toThrow('(CallExpression).');
  });

  it('names a numeric key by its number', () => {
    expect(() => assertNoDroppedValues(object('{ 1: read() }'), {})).toThrow(
      'Cannot resolve the value of "1"',
    );
  });

  it('skips a bigint key', () => {
    expect(() =>
      assertNoDroppedValues(object('{ 1n: read() }'), {}),
    ).not.toThrow();
  });

  it('names a quoted key by its text', () => {
    expect(() =>
      assertNoDroppedValues(object("{ 'color': read() }"), {}),
    ).toThrow('Cannot resolve the value of "color"');
  });
});

describe('assertNoDroppedValues: values it leaves alone', () => {
  it('returns without a resolved object', () => {
    expect(() =>
      assertNoDroppedValues(object('{ color: read() }'), null),
    ).not.toThrow();
    expect(() =>
      assertNoDroppedValues(object('{ color: read() }'), undefined),
    ).not.toThrow();
  });

  it('skips computed keys, null values and ignored keys', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ [key]: read(), width: null, color: read() }'),
        {},
        undefined,
        new Set(['color']),
      ),
    ).not.toThrow();
  });

  it('skips a method property', () => {
    expect(() =>
      assertNoDroppedValues(object('{ color() { return read(); } }'), {}),
    ).not.toThrow();
  });

  it('skips a value a later key replaces', () => {
    expect(() =>
      assertNoDroppedValues(object("{ color: read(), color: 'red' }"), {
        color: 'red',
      }),
    ).not.toThrow();
  });

  it('skips a value a later spread may replace when the spread is unknown', () => {
    expect(() =>
      assertNoDroppedValues(object('{ color: read(), ...rest }'), {}),
    ).not.toThrow();
    expect(() =>
      assertNoDroppedValues(
        object('{ color: read(), ...rest }'),
        {},
        context(),
      ),
    ).not.toThrow();
  });

  it('skips a value a later spread replaces', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ color: read(), ...rest }'),
        { color: 'red' },
        context({ rest: { values: { color: 'red' } } }),
      ),
    ).not.toThrow();
  });

  it('checks a value a later spread does not replace', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ color: read(), ...rest }'),
        { width: 1 },
        context({ rest: { values: { width: 1 } } }),
      ),
    ).toThrow(UNRESOLVABLE);
  });

  it('does not descend into a nested value that resolved to a primitive', () => {
    expect(() =>
      assertNoDroppedValues(object('{ hover: { color: read() } }'), {
        hover: 'red',
      }),
    ).not.toThrow();
  });

  it('checks a nested object', () => {
    expect(() =>
      assertNoDroppedValues(object('{ hover: { color: read() } }'), {
        hover: {},
      }),
    ).toThrow('Cannot resolve the value of "color"');
  });
});

describe('assertNoDroppedValues: spreads with a known source', () => {
  const base = { values: {}, source: '{ color: read() }' };

  it('checks the spread source', () => {
    expect(() =>
      assertNoDroppedValues(object('{ ...base }'), {}, context({ base })),
    ).toThrow('Cannot resolve the value of "color"');
  });

  it('skips a spread without a source', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ ...base }'),
        {},
        context({ base: { values: {} } }),
      ),
    ).not.toThrow();
  });

  it('skips a spread source key a later key replaces', () => {
    expect(() =>
      assertNoDroppedValues(
        object("{ ...base, color: 'red' }"),
        { color: 'red' },
        context({ base }),
      ),
    ).not.toThrow();
  });

  it('skips a spread source key a later known spread replaces', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ ...base, ...rest }'),
        { color: 'red' },
        context({ base, rest: { values: { color: 'red' } } }),
      ),
    ).not.toThrow();
  });

  it.each([
    ['a later unknown spread', '{ ...base, ...rest }'],
    ['a later computed key', "{ ...base, [key]: 'red' }"],
  ])('skips the spread source after %s', (_, source) => {
    expect(() =>
      assertNoDroppedValues(object(source), {}, context({ base })),
    ).not.toThrow();
  });

  it('checks the spread source past a later method property', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ ...base, color() {} }'),
        {},
        context({ base }),
      ),
    ).toThrow('Cannot resolve the value of "color"');
  });
});

describe('assertNoDroppedValues: style functions', () => {
  it('rejects a runtime call that does not read a parameter', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ box: (w) => ({ width: w, color: read(1, 2) }) }'),
        {},
        context({}, { sourceOf: () => 'read()' }),
      ),
    ).toThrow('Cannot resolve the value of "color" at build time (read()).');
  });

  it('accepts a runtime call that reads a parameter', () => {
    expect(() =>
      assertNoDroppedValues(object('{ box: (w) => ({ width: calc(w) }) }'), {}),
    ).not.toThrow();
  });

  it.each([
    ['a destructured default', '({ w = 1 }) => ({ width: calc(w) })'],
    ['a renamed property', '({ size: w }) => ({ width: calc(w) })'],
    ['an array pattern', '([w]) => ({ width: calc(w) })'],
    ['a rest parameter', '(...w) => ({ width: calc(w) })'],
    ['a default parameter', '(w = 1) => ({ width: calc(w) })'],
    ['a function expression', 'function (w) { return { width: calc(w) }; }'],
  ])('reads parameters written as %s', (_, fn) => {
    expect(() =>
      assertNoDroppedValues(object(`{ box: ${fn} }`), {}),
    ).not.toThrow();
  });

  it('checks nested objects in the returned style', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ box: () => ({ hover: { color: read() } }) }'),
        {},
      ),
    ).toThrow('Cannot resolve the value of "color"');
  });

  it('names a computed key in the returned style as empty', () => {
    expect(() =>
      assertNoDroppedValues(object('{ box: () => ({ [key]: read() }) }'), {}),
    ).toThrow('Cannot resolve the value of ""');
  });

  it('skips spreads and replaced values in the returned style', () => {
    expect(() =>
      assertNoDroppedValues(
        object("{ box: () => ({ ...rest, color: read(), color: 'red' }) }"),
        {},
      ),
    ).not.toThrow();
  });

  it('checks an identifier only with a context that cannot resolve it', () => {
    const style = object('{ box: () => ({ color: theme.missing }) }');
    expect(() => assertNoDroppedValues(style, {})).not.toThrow();
    expect(() =>
      assertNoDroppedValues(style, {}, context({}, { resolves: true })),
    ).not.toThrow();
    expect(() =>
      assertNoDroppedValues(
        style,
        {},
        context({}, { sourceOf: () => 'theme.missing' }),
      ),
    ).toThrow('(theme.missing)');
  });

  it('names a computed key holding an unresolvable identifier as empty', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ box: () => ({ [key]: theme.missing }) }'),
        {},
        context(),
      ),
    ).toThrow('Cannot resolve the value of ""');
  });

  it('accepts an identifier that reads a parameter', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ box: (w) => ({ width: w.size }) }'),
        {},
        context(),
      ),
    ).not.toThrow();
  });

  it('skips a function with a block body', () => {
    expect(() =>
      assertNoDroppedValues(
        object('{ box: () => { return { color: read() }; } }'),
        {},
      ),
    ).not.toThrow();
  });
});

describe('assertNoDroppedValues: a node that leaves a part out', () => {
  const property = (name: string, value?: unknown) => ({
    type: 'KeyValueProperty',
    key: { type: 'Identifier', value: name },
    ...(value === undefined ? {} : { value }),
  });
  const source = (...properties: unknown[]) =>
    ({ type: 'ObjectExpression', properties }) as unknown as ObjectExpression;
  const arrow = (body: unknown) => ({ type: 'ArrowFunctionExpression', body });

  it('passes over a property without a value', () => {
    expect(() =>
      assertNoDroppedValues(source(property('color')), {}),
    ).not.toThrow();
  });

  it('reads a function without a parameter list whose body is the object', () => {
    expect(() =>
      assertNoDroppedValues(
        source(
          property(
            'box',
            arrow(source(property('color', { type: 'CallExpression' }))),
          ),
        ),
        {},
      ),
    ).toThrow(
      'Cannot resolve the value of "color" at build time (CallExpression).',
    );
  });

  it('passes over a returned object without a property list', () => {
    expect(() =>
      assertNoDroppedValues(
        source(property('box', arrow({ type: 'ObjectExpression' }))),
        {},
      ),
    ).not.toThrow();
  });

  it('passes over a returned property without a value', () => {
    expect(() =>
      assertNoDroppedValues(
        source(property('box', arrow(source(property('color'))))),
        {},
      ),
    ).not.toThrow();
  });
});

describe('assertNoDroppedValues: an object nested in a style function', () => {
  it('names the value it cannot resolve inside the nested object', () => {
    expect(() =>
      assertNoDroppedValues(
        object(`{ box: (w) => ({ width: w, ':hover': { color: read() } }) }`),
        {},
      ),
    ).toThrow(
      'Cannot resolve the value of "color" at build time (CallExpression).',
    );
  });

  it('goes on to the keys after the nested object', () => {
    expect(() =>
      assertNoDroppedValues(
        object(`{ box: (w) => ({ ':hover': { width: w }, color: read() }) }`),
        {},
      ),
    ).toThrow(
      'Cannot resolve the value of "color" at build time (CallExpression).',
    );
  });
});
