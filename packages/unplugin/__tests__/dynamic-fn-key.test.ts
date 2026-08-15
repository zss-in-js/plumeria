import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const LEAF = path.join(DIR, 'box.tsx');
const IMPORTED_STYLES = path.join(DIR, 'imported.styles.ts');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { unpluginFactory } from '../src/core';

const mockGlobSync = (
  jest.requireMock('@rust-gear/glob') as { globSync: jest.Mock }
).globSync;

fs.writeFileSync(
  LEAF,
  `import * as css from '@plumeria/core';
export const Box = ({ styleArray }: { styleArray?: css.Style }) => <div classStyle={styleArray} />;
`,
);
fs.writeFileSync(
  IMPORTED_STYLES,
  `import * as css from '@plumeria/core';
export const importedStyles = css.create({
  tone: (color: string) => ({ color, fontWeight: 700 }),
});
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
  it('resolves an imported function key', async () => {
    const file = path.join(DIR, 'imported-consumer.tsx');
    const source = `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const Imported = (p: any) => <p classStyle={importedStyles.tone(p.color)} />;`;
    fs.writeFileSync(file, source);
    mockGlobSync.mockReturnValue([IMPORTED_STYLES, file]);

    const plugin = unpluginFactory(undefined, {
      framework: 'vite',
    } as never) as any;
    const { code } = await plugin.transform.call(
      { addWatchFile: () => {} },
      source,
      file,
    );

    expect(code).toContain('className={');
    expect(code).toContain('p.color');
    expect(code).toMatch(/"--[^"}]+-color"/);
    mockGlobSync.mockReturnValue([]);
  });

  describe('a function key resolves its names where it was written', () => {
    // An imported call has to land on the same classes the identical
    // declaration produces inline, or the scope the body reads is the
    // consumer's rather than the one it was written in.
    const classesOf = (code: string) =>
      code.match(/className=\{"([^"]*)"\}/)?.[1];

    const compare = async (declaration: string, leadIn = '') => {
      const stylesFile = path.join(DIR, 'scoped.styles.ts');
      fs.writeFileSync(
        stylesFile,
        `import * as css from '@plumeria/core';
${leadIn}export const scoped = css.create(${declaration});
`,
      );
      const consumerFile = path.join(DIR, 'scoped-consumer.tsx');
      const consumer = `import '@plumeria/core';
import { scoped } from './scoped.styles';
export const A = (p: any) => <div classStyle={scoped.tone(p.c)} />;`;
      fs.writeFileSync(consumerFile, consumer);
      mockGlobSync.mockReturnValue([stylesFile, consumerFile]);
      const plugin = unpluginFactory(undefined, {
        framework: 'vite',
      } as never) as any;
      const imported = await plugin.transform.call(
        { addWatchFile: () => {} },
        consumer,
        consumerFile,
      );
      mockGlobSync.mockReturnValue([]);

      const inline = await run(
        `import * as css from '@plumeria/core';
${leadIn}const scoped = css.create(${declaration});
export const A = (p: any) => <div classStyle={scoped.tone(p.c)} />;`,
        'scoped-inline.tsx',
      );

      return [classesOf(imported.code), classesOf(inline.code)];
    };

    it('resolves a const declared in the defining file', async () => {
      const [imported, inline] = await compare(
        `{ tone: (color: string) => ({ color, fontWeight: weight }) }`,
        'const weight = 700;\n',
      );
      expect(imported).toBe(inline);
    });

    it('resolves a spread of a const declared in the defining file', async () => {
      const [imported, inline] = await compare(
        `{ tone: (color: string) => ({ color, ...base }) }`,
        'const base = { fontWeight: 700 };\n',
      );
      expect(imported).toBe(inline);
    });

    it('resolves a const the parameter shares an expression with', async () => {
      const [imported, inline] = await compare(
        '{ tone: (value: string) => ({ padding: `${value} ${gap}` }) }',
        "const gap = '4px';\n",
      );
      expect(imported).toBe(inline);
    });

    it('resolves a defining-file const behind a named parameter', async () => {
      const stylesFile = path.join(DIR, 'named.styles.ts');
      fs.writeFileSync(
        stylesFile,
        `import * as css from '@plumeria/core';
const weight = 700;
export const named = css.create({
  tone: ({ color }: { color: string }) => ({ color, fontWeight: weight }),
});
`,
      );
      const consumerFile = path.join(DIR, 'named-consumer.tsx');
      const consumer = `import '@plumeria/core';
import { named } from './named.styles';
export const A = (p: any) => <div classStyle={named.tone({ color: p.c })} />;`;
      fs.writeFileSync(consumerFile, consumer);
      mockGlobSync.mockReturnValue([stylesFile, consumerFile]);
      const plugin = unpluginFactory(undefined, {
        framework: 'vite',
      } as never) as any;
      const { code } = await plugin.transform.call(
        { addWatchFile: () => {} },
        consumer,
        consumerFile,
      );
      mockGlobSync.mockReturnValue([]);

      const inline = await run(
        `import * as css from '@plumeria/core';
const weight = 700;
const named = css.create({
  tone: ({ color }: { color: string }) => ({ color, fontWeight: weight }),
});
export const A = (p: any) => <div classStyle={named.tone({ color: p.c })} />;`,
        'named-inline.tsx',
      );

      expect(classesOf(code)).toBe(classesOf(inline.code));
    });
  });

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

  it('keeps a multi-word unitless property free of the px fallback', async () => {
    // The unitless list is kebab-case at the source, so a property that reads
    // the same either way (opacity) hides the ones that do not.
    const { code } = await run(
      `import * as css from '@plumeria/core';
const s = css.create({ grow: (n: number) => ({ flexGrow: n }), weight: (n: number) => ({ fontWeight: n }) });
export const F2 = (p: any) => (<div><i classStyle={s.grow(1)} /><b classStyle={s.weight(p.w)} /></div>);`,
      'unitless-multiword.tsx',
    );
    expect(code).toMatch(/"--[^"]+-n": "1"/);
    expect(code).toMatch(/"--[^"]+-n": p\.w/);
  });

  it('leaves a custom property number alone whichever way it is written', async () => {
    // A custom property carries no unit rule, and the literal and the runtime
    // argument have to agree on that.
    const { code } = await run(
      `import * as css from '@plumeria/core';
const s = css.create({ gap: (n: number) => ({ '--gap': n, gap: 'var(--gap)' }) });
export const F3 = (p: any) => (<div><i classStyle={s.gap(4)} /><b classStyle={s.gap(p.n)} /></div>);`,
      'custom-prop.tsx',
    );
    expect(code).toMatch(/"--[^"]+-n": "4"/);
    expect(code).toMatch(/"--[^"]+-n": p\.n/);
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

  it('takes named parameters from a destructured signature', async () => {
    // The call names the parameters, and a renamed binding is read under the
    // name the body uses, not the one the caller wrote.
    const { code } = await run(
      `import * as css from '@plumeria/core';
const s = css.create({
  named: ({ color, size }: { color: string; size: number }) => ({ color, fontSize: size }),
  renamed: ({ tone: t }: { tone: string }) => ({ backgroundColor: t }),
});
export const H = (p: any) => (<div>
  <i classStyle={s.named({ color: p.c, size: 12 })} />
  <b classStyle={s.renamed({ tone: p.t })} />
</div>);`,
      'named.tsx',
    );
    expect(code).toContain(
      `"--x4fa0uiv-color": (typeof (p.c) === 'number' ? (p.c) + 'px' : (p.c))`,
    );
    expect(code).toContain(
      `"--xs7d3nvt-t": (typeof (p.t) === 'number' ? (p.t) + 'px' : (p.t))`,
    );
  });

  it('folds a named value only when it is written out in full', async () => {
    // A template literal reads only in part, so baking it into the rule would
    // drop the interpolation.
    const { code } = await run(
      `import * as css from '@plumeria/core';
const GAP = 'blue';
const s = css.create({ tint: ({ color }: { color: string }) => ({ backgroundColor: color }) });
export const K = (p: any) => (<div>
  <i classStyle={s.tint({ color: "red" })} />
  <b classStyle={s.tint({ color: GAP })} />
  <u classStyle={s.tint({ color: \`rgb(\${p.r} 0 0)\` })} />
</div>);`,
      'folding.tsx',
    );
    expect(code).toContain('<i className={"xymr32dw"} />');
    expect(code).toContain('<b className={"x2x7bpc1"} />');
    expect(code).toContain(
      '"--xav007xm-color": (typeof (`rgb(${p.r} 0 0)`) === \'number\'',
    );
  });

  it('rejects a named call that leaves a parameter unset', async () => {
    await expect(
      run(
        `import * as css from '@plumeria/core';
const s = css.create({ named: ({ color, size }: { color: string; size: number }) => ({ color, fontSize: size }) });
export const I = (p: any) => <div classStyle={s.named({ color: p.c })} />;`,
        'unset.tsx',
      ),
    ).rejects.toThrow('leaves "size" unset');
  });

  it('rejects a positional call to a named signature', async () => {
    await expect(
      run(
        `import * as css from '@plumeria/core';
const s = css.create({ named: ({ color }: { color: string }) => ({ color }) });
export const J = (p: any) => <div classStyle={s.named(p.c)} />;`,
        'positional.tsx',
      ),
    ).rejects.toThrow('takes one object argument');
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
