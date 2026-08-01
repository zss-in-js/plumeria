// Sources of one styling prop merge in the order they were written -- the last
// one to set a property wins. Mixing kinds must not change that: an
// unconditional style written after a condition still wins, and so does a
// condition written after a bracket group.
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

const HEAD = `
import * as css from '@plumeria/core';
const base = css.create({ b: { display: 'inline-flex', color: 'white' } });
const size = css.create({
  sm: { color: 'red', fontSize: 12 },
  md: { color: 'blue', fontSize: 18 },
});
const tone = css.create({ x: { color: 'teal' }, y: { color: 'olive' } });
// Nested blocks merge per property too, so they have to follow the same order.
const deepBase = css.create({
  b: {
    color: 'white',
    ':hover': { color: 'silver', textDecoration: 'underline' },
    '@media (min-width: 700px)': { color: 'ivory' },
  },
});
const deepTone = css.create({
  x: {
    color: 'teal',
    ':hover': { color: 'aqua' },
    '@media (min-width: 700px)': { color: 'navy' },
  },
});
`;

const compile = async (styleExpr: string) => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    `${HEAD}export const B = ({ s, on }: any) => <div classStyle={${styleExpr}} />;`,
    `${__dirname}/fixture.tsx`,
  );
  const code = typeof result === 'string' ? result : (result?.code ?? '');
  const found = code.match(/className=\{([\s\S]*?)\} \/>/);
  if (!found) throw new Error(`no className in:\n${code}`);
  return found[1];
};

const evaluate = (expr: string, vars: Record<string, unknown>) => {
  const names = Object.keys(vars);
  const fn = new Function(...names, `return (${expr});`);
  return (fn(...names.map((n) => vars[n])) as string)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
};

type Vars = { s: string; on: boolean };
// `src` is what the author writes; `resolve` is the same element with every
// branch already taken, which merges by plain array order.
type Part = { src: string; resolve: (v: Vars) => string | null };

const BASE: Part = { src: 'base.b', resolve: () => 'base.b' };
const GROUP: Part = { src: 'size[s]', resolve: ({ s }) => `size.${s}` };
const STATIC: Part = { src: 'size.sm', resolve: () => 'size.sm' };
const AND: Part = {
  src: 'on && tone.x',
  resolve: ({ on }) => (on ? 'tone.x' : null),
};
const TERNARY: Part = {
  src: 'on ? tone.x : tone.y',
  resolve: ({ on }) => (on ? 'tone.x' : 'tone.y'),
};

const DEEP_BASE: Part = { src: 'deepBase.b', resolve: () => 'deepBase.b' };
const DEEP_AND: Part = {
  src: 'on && deepTone.x',
  resolve: ({ on }) => (on ? 'deepTone.x' : null),
};

const CASES: Array<[string, Part[]]> = [
  ['static, static', [BASE, STATIC]],
  ['static, &&', [BASE, AND]],
  ['&&, static', [BASE, AND, STATIC]],
  ['static after a group', [BASE, GROUP, STATIC]],
  ['group, &&', [BASE, GROUP, AND]],
  ['&&, group', [BASE, AND, GROUP]],
  ['group, ternary', [BASE, GROUP, TERNARY]],
  ['ternary, group', [BASE, TERNARY, GROUP]],
  ['&& before the base style', [AND, BASE]],
  ['group before the base style', [GROUP, BASE]],
  ['two conditions around a group', [BASE, AND, GROUP, TERNARY]],
  ['nested blocks, condition last', [DEEP_BASE, DEEP_AND]],
  ['nested blocks, static last', [DEEP_BASE, DEEP_AND, STATIC]],
];

describe.each(CASES)('%s', (_label, parts) => {
  it('merges in written order for every input', async () => {
    const actual = await compile(`[${parts.map((p) => p.src).join(', ')}]`);

    for (const s of ['sm', 'md']) {
      for (const on of [true, false]) {
        const resolved = parts
          .map((p) => p.resolve({ s, on }))
          .filter((x): x is string => x !== null);
        const reference = await compile(`[${resolved.join(', ')}]`);
        expect(evaluate(actual, { s, on })).toBe(
          evaluate(reference, { s, on }),
        );
      }
    }
  });
});
