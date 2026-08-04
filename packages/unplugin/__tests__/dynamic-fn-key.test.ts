import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const LEAF = path.join(DIR, 'box.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

fs.writeFileSync(
  LEAF,
  `import * as css from '@plumeria/core';
export const Box = ({ styleArray }: { styleArray?: css.Style }) => <div classStyle={styleArray} />;
`,
);

const run = (code: string, name: string): Promise<{ code: string }> => {
  const file = path.join(DIR, name);
  fs.writeFileSync(file, code);
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  return plugin.transform.call({ addWatchFile: () => {} }, code, file);
};

const header = `import * as css from '@plumeria/core';
import { Box } from './box';
const s = css.create({ stat: { color: 'red' }, palette: (color: string) => ({ color }) });
`;

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('dynamic function keys', () => {
  it('resolves a prop argument into a class name and a CSS variable', async () => {
    const { code } = await run(
      header +
        `export const A = (p: any) => <div classStyle={s.palette(p.c)} />;`,
      'a.tsx',
    );
    expect(code).toContain('className={"xokp0532"}');
    expect(code).toContain(
      `style={{ "--x80848wl-color": (typeof (p.c) === 'number' ? (p.c) + 'px' : (p.c)) }}`,
    );
  });

  it('names the variable after the declaration it lands in', async () => {
    // Two creates may share a key name and a parameter name. The variable
    // names must still differ, or the later entry in the inline style object
    // silently overwrites the earlier one.
    const { code } = await run(
      `import * as css from '@plumeria/core';
const a = css.create({ palette: (color: string) => ({ backgroundColor: color }) });
const b = css.create({ palette: (color: string) => ({ borderColor: color }) });
export const B = (p: any) => <div classStyle={[a.palette(p.x), b.palette(p.y)]} />;`,
      'b.tsx',
    );
    expect(code).toContain('"--xav007xm-color"');
    expect(code).toContain('"--xcf1maiq-color"');
  });

  it('keeps two files apart when both name the create the same', async () => {
    // The name is derived from the resolved body, so it does not depend on the
    // local identifier and cannot be shared by unrelated declarations.
    const one = await run(
      `import * as css from '@plumeria/core';
const styles = css.create({ box: (w: number) => ({ width: w }) });
export const C = (p: any) => <div classStyle={styles.box(p.w)} />;`,
      'c.tsx',
    );
    const two = await run(
      `import * as css from '@plumeria/core';
const styles = css.create({ box: (w: number) => ({ height: w }) });
export const D = (p: any) => <div classStyle={styles.box(p.w)} />;`,
      'd.tsx',
    );
    const nameOf = (code: string) => code.match(/"(--[^"]+-w)"/)?.[1];
    expect(nameOf(one.code)).toBeDefined();
    expect(nameOf(one.code)).not.toBe(nameOf(two.code));
  });

  it('sets the variable for a parameter that only appears under nesting', async () => {
    // The rule is emitted whatever the nesting is, so an inline variable that
    // only covers top-level declarations leaves the rule reading nothing.
    const { code } = await run(
      `import * as css from '@plumeria/core';
const s = css.create({
  link: (base: string, hovered: string) => ({ color: base, ':hover': { color: hovered } }),
  deep: (size: number) => ({ '@media (min-width: 600px)': { ':hover': { fontSize: size } } }),
});
export const E = (p: any) => (<div><a classStyle={s.link(p.b, p.h)} /><i classStyle={s.deep(p.s)} /></div>);`,
      'nested.tsx',
    );
    const vars = code.match(/"--[^"]+"/g) ?? [];
    expect(vars).toHaveLength(3);
    expect(code).toContain(`(p.h) + 'px' : (p.h)`);
    expect(code).toContain(`(p.s) + 'px' : (p.s)`);
  });

  it('keeps a unitless nested property free of the px fallback', async () => {
    const { code } = await run(
      `import * as css from '@plumeria/core';
const s = css.create({ fade: (o: number) => ({ ':hover': { opacity: o } }) });
export const F = (p: any) => <div classStyle={s.fade(p.o)} />;`,
      'unitless.tsx',
    );
    expect(code).toMatch(/"--[^"]+": p\.o }}/);
  });

  it('gives the variable of a call under a condition the same reach as its class', async () => {
    // lookup.test.ts pins the class list; what it cannot see is the value, and
    // one variable name serves every branch that shares the declaration.
    const { code } = await run(
      header +
        `export const G = (p: any) => (<div><i classStyle={p.on && s.palette(p.c)} /><b classStyle={p.on ? s.palette(p.a) : s.palette(p.b)} /></div>);`,
      'conditional.tsx',
    );
    expect(code).toContain(
      `"--x80848wl-color": (((p.on)) ? (typeof (p.c) === 'number' ? (p.c) + 'px' : (p.c)) : undefined)`,
    );
    expect(code).toContain(
      `"--x80848wl-color": ((!(p.on)) ? (typeof (p.b) === 'number' ? (p.b) + 'px' : (p.b)) : (((p.on)) ? (typeof (p.a) === 'number' ? (p.a) + 'px' : (p.a)) : undefined))`,
    );
  });

  it('rejects a call handed to a component prop instead of emitting a broken lookup', async () => {
    // The create call becomes a plain object holding only the static keys, so
    // leaving the call in place would throw "palette is not a function".
    await expect(
      run(
        header +
          `export const C = (p: any) => <Box styleArray={s.palette(p.c)} />;`,
        'c.tsx',
      ),
    ).rejects.toThrow(
      'Plumeria: s.palette(p.c) is only supported in the classStyle prop.',
    );
  });

  it('rejects a call whose result is never handed to the style prop', async () => {
    await expect(
      run(
        header +
          `export const D = (p: any) => { s.palette(p.c); return <div classStyle={s.stat} />; };`,
        'd.tsx',
      ),
    ).rejects.toThrow('is only supported in the classStyle prop.');
  });

  it('keeps static keys usable through component props', async () => {
    const { code } = await run(
      header + `export const E = () => <Box styleArray={s.stat} />;`,
      'e.tsx',
    );
    expect(code).toContain('styleArray={({"color":"xq96bg3w"})}');
  });
});
