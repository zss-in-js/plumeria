jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const env = (source: string, filePath: string) => ({
  source,
  moduleId: filePath,
  filePath,
  root: process.cwd(),
  styleProp: DEFAULT_STYLE_PROP,
  propertyPolicy: undefined,
  isDev: false,
  collectOndemandSheets: true,
  addDependency: () => {},
});

const HEAD = `
import * as css from '@plumeria/core';
const a = css.create({ a0: { color: 'red' }, a1: { color: 'blue' } });
const b = css.create({ b0: { color: 'teal' }, b1: { color: 'navy' } });
const c = css.create({ c0: { margin: 1 }, c1: { margin: 2 } });
const d = css.create({ d0: { margin: 3 }, d1: { margin: 4 } });
const bridge = css.create({
  e0: { color: 'gold', margin: 5 },
  e1: { color: 'gray', margin: 6 },
});
`;

const classExpr = async (styleExpr: string) => {
  const result = await transformSource(
    env(
      `${HEAD}export const A = ({ ka, kb, kc, kd, ke }: any) => <div classStyle={${styleExpr}} />;`,
      `${__dirname}/fixture.tsx`,
    ),
  );
  const code = typeof result === 'string' ? result : (result?.code ?? '');
  const found = code.match(/className=\{([\s\S]*?)\} \/>/);
  if (!found) throw new Error(`no className in:\n${code}`);
  return found[1];
};

const tableSizes = (expr: string) =>
  (expr.match(/\{(?:"[^"]*":"[^"]*",?)+\}/g) ?? [])
    .map((table) => (table.match(/":"/g) ?? []).length)
    .filter((size) => size > 2);

const norm = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).sort().join(' ');

const evaluate = (expr: string, vars: Record<string, unknown>) => {
  const names = Object.keys(vars);
  const fn = new Function(...names, `return (${expr});`);
  return norm(fn(...names.map((n) => vars[n])));
};

const literal = (styleExpr: string, combo: Record<string, string>) =>
  styleExpr
    .replace(/a\[ka\]/g, `a.${combo.ka}`)
    .replace(/b\[kb\]/g, `b.${combo.kb}`)
    .replace(/c\[kc\]/g, `c.${combo.kc}`)
    .replace(/d\[kd\]/g, `d.${combo.kd}`)
    .replace(/bridge\[ke\]/g, `bridge.${combo.ke}`);

const SPACES: Record<string, string[]> = {
  ka: ['a0', 'a1'],
  kb: ['b0', 'b1'],
  kc: ['c0', 'c1'],
  kd: ['d0', 'd1'],
  ke: ['e0', 'e1'],
};

const combosOf = (names: string[]) =>
  names.reduce<Array<Record<string, string>>>(
    (acc, name) =>
      acc.flatMap((base) =>
        SPACES[name].map((value) => ({ ...base, [name]: value })),
      ),
    [{}],
  );

describe('transform: the conflict product splits per connected component', () => {
  it('keeps one table when every group fights over the same property', async () => {
    expect(tableSizes(await classExpr('[a[ka], b[kb]]'))).toEqual([4]);
  });

  it('splits two unrelated pairs into two tables', async () => {
    expect(tableSizes(await classExpr('[a[ka], b[kb], c[kc], d[kd]]'))).toEqual(
      [4, 4],
    );
  });

  it('rejoins the pairs when a group bridges both properties', async () => {
    expect(
      tableSizes(await classExpr('[a[ka], b[kb], c[kc], d[kd], bridge[ke]]')),
    ).toEqual([32]);
  });

  it('leaves a lone boolean condition out of an unrelated product', async () => {
    expect(
      tableSizes(await classExpr('[a[ka], b[kb], kc && c.c0, d[kd]]')),
    ).toEqual([4, 4]);
  });

  it.each([
    [
      'unrelated pairs',
      '[a[ka], b[kb], c[kc], d[kd]]',
      ['ka', 'kb', 'kc', 'kd'],
    ],
    [
      'bridged pairs',
      '[a[ka], b[kb], c[kc], d[kd], bridge[ke]]',
      ['ka', 'kb', 'kc', 'kd', 'ke'],
    ],
    [
      'a bridge in the middle',
      '[a[ka], bridge[ke], d[kd]]',
      ['ka', 'ke', 'kd'],
    ],
    [
      'a base ahead of two pairs',
      '[a.a0, b[kb], c[kc], d[kd]]',
      ['kb', 'kc', 'kd'],
    ],
  ])(
    'matches the literal-key form for every input: %s',
    async (_label, styleExpr, names) => {
      const actual = await classExpr(styleExpr);
      for (const combo of combosOf(names as string[])) {
        const reference = await classExpr(literal(styleExpr, combo));
        expect(evaluate(actual, combo)).toBe(evaluate(reference, combo));
      }
    },
  );
});
