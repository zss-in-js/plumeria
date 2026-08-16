// States that hold at once settle their intersection by composition order, so
// the atom of the source written further right is weighted and becomes a class
// of its own. Reversing the composition has to reverse which class is weighted.
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

const HEAD = `
import * as css from '@plumeria/core';
const a = css.create({ s: { ':focus': { color: 'red' } } });
const b = css.create({ s: { ':hover': { color: 'blue' } } });
const c = css.create({ s: { ':active': { color: 'lime' } } });
const wide = css.create({
  s: { '@media (min-width: 700px)': { ':hover': { color: 'teal' } } },
});
`;

const compile = async (styleExpr: string) => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    `${HEAD}export const B = ({ on }: any) => <div classStyle={${styleExpr}} />;`,
    `${__dirname}/fixture.tsx`,
  );
  const code = typeof result === 'string' ? result : (result?.code ?? '');
  const found = code.match(/className=\{([\s\S]*?)\} \/>/);
  if (!found) throw new Error(`no className in:\n${code}`);
  return found[1];
};

const classesOf = (expr: string, on = true) =>
  (new Function('on', `return (${expr});`)(on) as string)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

describe('state escalation through the plugin', () => {
  it('gives the right-hand state a class the left-hand one does not have', async () => {
    const forward = classesOf(await compile('[a.s, b.s]'));
    const reversed = classesOf(await compile('[b.s, a.s]'));

    expect(forward).toHaveLength(2);
    expect(reversed).toHaveLength(2);
    expect(forward.sort()).not.toEqual(reversed.sort());
  });

  it('keeps the unweighted atom shared with a lone use', async () => {
    const [focusAlone] = classesOf(await compile('[a.s]'));
    const [hoverAlone] = classesOf(await compile('[b.s]'));

    const forward = classesOf(await compile('[a.s, b.s]'));
    const reversed = classesOf(await compile('[b.s, a.s]'));

    expect(forward).toContain(focusAlone);
    expect(forward).not.toContain(hoverAlone);
    expect(reversed).toContain(hoverAlone);
    expect(reversed).not.toContain(focusAlone);
  });

  it('weights three states apart from each other', async () => {
    const classes = classesOf(await compile('[a.s, b.s, c.s]'));

    expect(new Set(classes).size).toBe(3);
    expect(classes).toContain(classesOf(await compile('[a.s]'))[0]);
    expect(classes).not.toContain(classesOf(await compile('[b.s]'))[0]);
    expect(classes).not.toContain(classesOf(await compile('[c.s]'))[0]);
  });

  it('leaves a state behind a differing at-rule unweighted', async () => {
    const classes = classesOf(await compile('[wide.s, a.s]'));

    expect(classes).toContain(classesOf(await compile('[a.s]'))[0]);
    expect(classes).toContain(classesOf(await compile('[wide.s]'))[0]);
  });

  it('weights a state contributed by a condition', async () => {
    const classes = classesOf(await compile('[a.s, on && b.s]'));

    expect(classes).toContain(classesOf(await compile('[a.s]'))[0]);
    expect(classes).not.toContain(classesOf(await compile('[b.s]'))[0]);
  });
});
