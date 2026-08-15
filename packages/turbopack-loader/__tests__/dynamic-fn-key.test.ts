import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import loader from '../src/index';

const mockGlobSync = (
  jest.requireMock('@rust-gear/glob') as { globSync: jest.Mock }
).globSync;

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  stat: { color: 'red' },
  palette: (color: string) => ({ color }),
  link: (base: string, hovered: string) => ({
    color: base,
    ':hover': { color: hovered },
  }),
  boxed: ({ tone: t }: { tone: string }) => ({ backgroundColor: t }),
  layer: (z: number) => ({ zIndex: z }),
  gapped: (n: number) => ({ '--gap': n, gap: 'var(--gap)' }),
});

${body}
`;

const run = (body: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: `${__dirname}/fixture.tsx`,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, wrap(body));
  });

describe('turbopack-loader: dynamic function keys', () => {
  it('resolves an imported function key', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-loader-'));
    const stylesFile = path.join(dir, 'imported.styles.ts');
    const consumerFile = path.join(dir, 'consumer.tsx');
    const source = `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const Imported = (p: any) => <p classStyle={importedStyles.tone(p.color)} />;`;
    fs.writeFileSync(
      stylesFile,
      `import * as css from '@plumeria/core';
export const importedStyles = css.create({
  tone: (color: string) => ({ color, fontWeight: 700 }),
});`,
    );
    fs.writeFileSync(consumerFile, source);
    mockGlobSync.mockReturnValue([stylesFile, consumerFile]);

    try {
      const code = await new Promise<string>((resolve, reject) => {
        const ctx = {
          resourcePath: consumerFile,
          async: () => (err: Error | null, content?: string) =>
            err ? reject(err) : resolve(content as string),
          addDependency: () => {},
          clearDependencies: () => {},
        };
        (loader as any).call(ctx, source);
      });
      expect(code).toContain('className={');
      expect(code).toContain('p.color');
      expect(code).toMatch(/"--[^"}]+-color"/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      mockGlobSync.mockReturnValue([]);
    }
  });

  describe('a function key resolves its names where it was written', () => {
    // An imported call has to land on the same classes the identical
    // declaration produces inline, or the scope the body reads is the
    // consumer's rather than the one it was written in.
    const classesOf = (code: string) =>
      code.match(/className=\{"([^"]*)"\}/)?.[1];

    const transform = (source: string, resourcePath: string) =>
      new Promise<string>((resolve, reject) => {
        const ctx = {
          resourcePath,
          async: () => (err: Error | null, content?: string) =>
            err ? reject(err) : resolve(content as string),
          addDependency: () => {},
          clearDependencies: () => {},
        };
        (loader as any).call(ctx, source);
      });

    const compare = async (
      declaration: string,
      leadIn: string,
      call = 'scoped.tone(p.c)',
    ) => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-loader-'));
      const stylesFile = path.join(dir, 'scoped.styles.ts');
      const consumerFile = path.join(dir, 'consumer.tsx');
      const inlineFile = path.join(dir, 'inline.tsx');
      const usage = `export const A = (p: any) => <div classStyle={${call}} />;`;
      fs.writeFileSync(
        stylesFile,
        `import * as css from '@plumeria/core';
${leadIn}export const scoped = css.create(${declaration});
`,
      );
      const consumer = `import '@plumeria/core';
import { scoped } from './scoped.styles';
${usage}`;
      fs.writeFileSync(consumerFile, consumer);
      mockGlobSync.mockReturnValue([stylesFile, consumerFile]);

      try {
        const imported = await transform(consumer, consumerFile);
        mockGlobSync.mockReturnValue([]);
        const inline = await transform(
          `import * as css from '@plumeria/core';
${leadIn}const scoped = css.create(${declaration});
${usage}`,
          inlineFile,
        );
        return [classesOf(imported), classesOf(inline)];
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
        mockGlobSync.mockReturnValue([]);
      }
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

    it('resolves a defining-file const behind a named parameter', async () => {
      const [imported, inline] = await compare(
        `{ tone: ({ color }: { color: string }) => ({ color, fontWeight: weight }) }`,
        'const weight = 700;\n',
        'scoped.tone({ color: p.c })',
      );
      expect(imported).toBe(inline);
    });
  });

  it('resolves a prop argument into a class name and a CSS variable', async () => {
    const code = await run(
      'export const A = (p: any) => <div classStyle={s.palette(p.c)} />;',
    );
    expect(code).toContain('className={"xokp0532"}');
    expect(code).toContain('"--x80848wl-color"');
  });

  it('sets the variable for a parameter that only appears under nesting', async () => {
    const code = await run(
      'export const A = (p: any) => <a classStyle={s.link(p.b, p.h)} />;',
    );
    expect(code.match(/"--[^"]+"/g)).toHaveLength(2);
    expect(code).toContain(`(p.h) + 'px' : (p.h)`);
  });

  it('gives the variable of a call under a condition the same reach as its class', async () => {
    // Both branches share the declaration, so they share the variable and the
    // value has to carry the condition instead.
    const code = await run(
      'export const A = (p: any) => <div classStyle={p.on ? s.palette(p.a) : s.palette(p.b)} />;',
    );
    expect(code).toContain(
      `"--x80848wl-color": ((!(p.on)) ? (typeof (p.b) === 'number' ? (p.b) + 'px' : (p.b)) : (((p.on)) ? (typeof (p.a) === 'number' ? (p.a) + 'px' : (p.a)) : undefined))`,
    );
  });

  it('takes named parameters from a destructured signature', async () => {
    const code = await run(
      'export const A = (p: any) => <div classStyle={s.boxed({ tone: p.t })} />;',
    );
    expect(code).toContain(
      `"--xs7d3nvt-t": (typeof (p.t) === 'number' ? (p.t) + 'px' : (p.t))`,
    );
  });

  it('keeps a multi-word unitless property free of the px fallback', async () => {
    // The unitless list is kebab-case at the source, so a property that reads
    // the same either way hides the ones that do not.
    const code = await run(
      'export const A = (p: any) => (<div><i classStyle={s.layer(2)} /><b classStyle={s.layer(p.z)} /></div>);',
    );
    expect(code).toMatch(/"--[^"]+-z": "2"/);
    expect(code).toMatch(/"--[^"]+-z": p\.z/);
  });

  it('leaves a custom property number alone whichever way it is written', async () => {
    // A custom property carries no unit rule, and the literal and the runtime
    // argument have to agree on that.
    const code = await run(
      'export const A = (p: any) => (<div><i classStyle={s.gapped(4)} /><b classStyle={s.gapped(p.n)} /></div>);',
    );
    expect(code).toMatch(/"--[^"]+-n": "4"/);
    expect(code).toMatch(/"--[^"]+-n": p\.n/);
  });

  it('rejects a call handed to a component prop', async () => {
    // The create call is replaced by an object of static keys only, so the
    // call would survive into the output and throw at runtime.
    await expect(
      run('export const A = (p: any) => <Box styleArray={s.palette(p.c)} />;'),
    ).rejects.toThrow(
      'Plumeria: s.palette(p.c) is only supported in the classStyle prop.',
    );
  });
});
