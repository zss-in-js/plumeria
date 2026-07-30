// The branches of one argument are mutually exclusive, so they compile to a
// single lookup rather than one dimension each. Whatever shape that takes, it
// must produce -- for every runtime input -- exactly the class list the
// equivalent literal-key form produces.
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const HEAD = `
import * as css from '@plumeria/core';
const s = css.create({
  p1: { color: 'green' },
  p2: { color: 'olive' },
  p3: { color: 'teal' },
});
const d = css.create({ w1: { width: 10 }, w3: { width: 30 } });
const both = css.create({
  b1: { color: 'red', padding: 1 },
  b2: { color: 'blue', margin: 2 },
});
`;

const compile = async (body: string) => {
  const code = await new Promise<string>((resolve, reject) => {
    const ctx = {
      resourcePath: `${__dirname}/fixture.tsx`,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, HEAD + body);
  });
  const found = code.match(/className=\{([\s\S]*?)\} \/>/);
  if (!found) throw new Error(`no className in:\n${code}`);
  return found[1];
};

const classExpr = (styleExpr: string) =>
  compile(
    `export const A = ({ a, b, c, k, j }: any) => <div classStyle={${styleExpr}} />;`,
  );

const norm = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).sort().join(' ');

const evaluate = (expr: string, vars: Record<string, unknown>) => {
  const names = Object.keys(vars);

  const fn = new Function(...names, `return (${expr});`);
  return norm(fn(...names.map((n) => vars[n])));
};

// Substituting the bracket for a literal key gives a form the compiler already
// handled before groups could sit under a condition -- the reference output.
const withKeys = (styleExpr: string, k: string, j: string) =>
  styleExpr.replace(/s\[k\]/g, `s.${k}`).replace(/d\[j\]/g, `d.${j}`);

const SPACES: Record<string, unknown[]> = {
  a: [true, false],
  b: [true, false],
  c: [true, false],
  k: ['p1', 'p2', 'p3'],
  j: ['w1', 'w3'],
};

const CASES: Array<[string, string, string[]]> = [
  ['ternary over a group', `a ? s[k] : s.p3`, ['a', 'k']],
  ['&& over a group', `a && s[k]`, ['a', 'k']],
  ['group merged with a conflicting base', `[s.p1, a && s[k]]`, ['a', 'k']],
  ['group merged with a disjoint base', `[d.w1, a && s[k]]`, ['a', 'k']],
  ['group in both branches', `a ? s[k] : d[j]`, ['a', 'k', 'j']],
  [
    'nested ternary reaching a group',
    `a ? (b ? s[k] : s.p1) : s.p3`,
    ['a', 'b', 'k'],
  ],
  [
    'group nested two levels deep',
    `a ? (b ? (c ? s[k] : s.p2) : s.p1) : s.p3`,
    ['a', 'b', 'c', 'k'],
  ],
  ['&& nested inside a ternary', `a ? (b && s[k]) : s.p3`, ['a', 'b', 'k']],
  [
    'plain nested ternary, no group',
    `a ? (b ? s.p2 : s.p1) : s.p3`,
    ['a', 'b'],
  ],
  [
    'deep plain ternary, no group',
    `a ? (b ? s.p2 : (c ? s.p1 : s.p3)) : s.p3`,
    ['a', 'b', 'c'],
  ],
  ['two independent arguments', `[a && s.p1, b && d.w1]`, ['a', 'b']],
  [
    'group beside an independent condition',
    `[a && d.w1, b ? s[k] : s.p3]`,
    ['a', 'b', 'k'],
  ],
  ['partially overlapping properties', `[both.b1, a && both.b2]`, ['a']],
  ['literal bracket keys stay literal', `a ? s['p1'] : s['p3']`, ['a']],
];

describe.each(CASES)('%s', (_label, styleExpr, varNames) => {
  it('matches the literal-key form for every input', async () => {
    const actual = await classExpr(styleExpr);

    const combos = varNames.reduce<Array<Record<string, unknown>>>(
      (acc, name) =>
        acc.flatMap((base) =>
          SPACES[name].map((value) => ({ ...base, [name]: value })),
        ),
      [{}],
    );

    for (const combo of combos) {
      const reference = await classExpr(
        withKeys(styleExpr, combo.k as string, combo.j as string),
      );
      expect(evaluate(actual, combo)).toBe(evaluate(reference, combo));
    }
  });
});
