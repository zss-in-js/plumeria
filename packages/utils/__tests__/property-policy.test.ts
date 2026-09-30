import { parseSync } from '@swc/core';
import {
  resolvePropertyPolicy,
  assertPropertyPolicy,
} from '../src/propertyPolicy';

const assertSource = (
  source: string,
  policy = resolvePropertyPolicy({ withoutLogicalProperties: true }),
) =>
  assertPropertyPolicy(
    parseSync(source, { syntax: 'typescript', tsx: true }),
    policy,
    '/project/source.tsx',
  );

describe('assertPropertyPolicy', () => {
  it('does nothing without a policy', () => {
    expect(() => assertSource('', undefined)).not.toThrow();
  });

  it.each([
    `import css from '@plumeria/core'; css.create({ a: { marginBlockStart: 0 } });`,
    `import { create } from '@plumeria/core'; create({ a: { marginBlockStart: 0 } });`,
    `import { create as make } from '@plumeria/core'; make({ a: { marginBlockStart: 0 } });`,
    `import { viewTransition as transition } from '@plumeria/core'; transition({ a: () => ({ marginBlockStart: 0 }) });`,
  ])('checks supported import and call form %#', (source) => {
    expect(() => assertSource(source)).toThrow(/marginBlockStart/);
  });

  it('checks string-keyed styles', () => {
    expect(() =>
      assertSource(
        `import { create } from '@plumeria/core'; create({
          direct: { 'marginBlockStart': 0 },
        });`,
      ),
    ).toThrow(/marginBlockStart/);
  });

  it('ignores unrelated calls and unsupported object entries', () => {
    expect(() =>
      assertSource(`
        import other from 'other';
        import * as css from '@plumeria/core';
        other.create({ a: { marginBlockStart: 0 } });
        css.unknown({ a: { marginBlockStart: 0 } });
        css.create(value, { ...styles, 1: 0, plain: 0, fn: function () {} });
        unknown();
        getApi()({});
      `),
    ).not.toThrow();
  });

  it('ignores non-properties and unnamed keys inside a style', () => {
    expect(() =>
      assertSource(`
        import * as css from '@plumeria/core';
        css.create({ a: { ...base, 1: 0, color: 'red' } });
      `),
    ).not.toThrow();
  });

  it('continues after checking an allowed nested style', () => {
    expect(() =>
      assertSource(`
        import * as css from '@plumeria/core';
        css.create({ a: { ':hover': { color: 'red' }, color: 'blue' } });
      `),
    ).not.toThrow();
  });

  it('accepts an already-unwrapped function body AST', () => {
    const ast = parseSync(
      `import * as css from '@plumeria/core'; css.create({ a: () => ({ color: 'red' }) });`,
      { syntax: 'typescript' },
    );
    const call = (ast.body[1] as any).expression;
    const arrow = call.arguments[0].expression.properties[0].value;
    arrow.body = arrow.body.expression;

    expect(() =>
      assertPropertyPolicy(
        ast,
        { reject: 'logical', includeAxes: false },
        '/project/source.ts',
      ),
    ).not.toThrow();
  });

  it('ignores an unknown import specifier AST', () => {
    const ast = parseSync(`import * as css from '@plumeria/core';`, {
      syntax: 'typescript',
    });
    (ast.body[0] as any).specifiers.push({ type: 'UnknownSpecifier' });

    expect(() =>
      assertPropertyPolicy(
        ast,
        { reject: 'logical', includeAxes: false },
        '/project/source.ts',
      ),
    ).not.toThrow();
  });
});
