import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource, compileCSS }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-fn-defaults-')),
  );
  let count = 0;

  const source = (params: string, body: string, call: string) =>
    `import * as css from '@plumeria/core';
const GAP = 4;
const FLAG = true;
const T = { gap: 8 };
const st = css.create({ fn: ${params}: any => (${body}) });
export const A = (p: any) => <div classStyle={${call}} />;`;

  const project = (code: string) => {
    const cwd = path.join(DIR, String(count++));
    fs.mkdirSync(cwd);
    fs.writeFileSync(path.join(cwd, 'app.tsx'), code);
    return cwd;
  };

  const transformCode = async (code: string) => {
    const cwd = project(code);
    const filePath = path.join(cwd, 'app.tsx');
    const { code: output, sheets } = await transformSource({
      source: code,
      moduleId: filePath,
      filePath,
      root: cwd,
      cwd,
      isDev: false,
      collectOndemandSheets: true,
    });
    return { code: output, css: sheets.join('') };
  };

  const transform = (params: string, body: string, call: string) =>
    transformCode(source(params, body, call));

  const compile = (params: string, body: string, call: string) =>
    compileCSS({
      include: ['app.tsx'],
      exclude: [],
      cwd: project(source(params, body, call)),
    });

  const unresolved = (param: string, label: string) =>
    `[plumeria] Cannot resolve the default of "${param}" at build time (${label}). A dynamic style function falls back on it when the argument is undefined, so it has to be a string or a number plumeria can read. Pass the value from the call instead.`;

  const unsupported = (param: string, kind: string) =>
    `[plumeria] The default of "${param}" is ${kind}, which a dynamic style function cannot fall back on. Use a string or a number, or pass the value from the call.`;

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  describe('function key default: one it cannot reproduce', () => {
    it.each([
      ['a value read at runtime', '{ width: n }', 'st.fn(p.n)'],
      ['an omitted argument', '{ width: n }', 'st.fn()'],
      [
        'a value read at runtime, under arithmetic',
        '{ width: n + 4 }',
        'st.fn(p.n)',
      ],
      ['an omitted argument, under arithmetic', '{ width: n + 4 }', 'st.fn()'],
    ])('rejects the default behind %s', async (_name, body, call) => {
      await expect(transform('(n = DEFAULT)', body, call)).rejects.toThrow(
        unresolved('n', 'DEFAULT'),
      );
      expect(() => compile('(n = DEFAULT)', body, call)).toThrow(
        unresolved('n', 'DEFAULT'),
      );
    });

    it.each([
      ['a member it cannot read', 'theme.spacing.md', 'theme.spacing.md'],
      ['a function call', 'make()', 'a function call'],
    ])('names %s in the error', async (_name, written, label) => {
      await expect(
        transform(`(n = ${written})`, '{ width: n }', 'st.fn(p.n)'),
      ).rejects.toThrow(unresolved('n', label));
    });

    it.each([
      ['null', 'null', 'null'],
      ['a boolean', 'true', 'a boolean'],
      ['a constant that holds a boolean', 'FLAG', 'a boolean'],
      ['an object', '{}', 'an object'],
      ['a constant that holds an object', 'T', 'an object'],
    ])(
      'rejects %s as a kind it does not support',
      async (_name, written, kind) => {
        await expect(
          transform(`(n = ${written})`, '{ width: n }', 'st.fn(p.n)'),
        ).rejects.toThrow(unsupported('n', kind));
      },
    );

    it.each([
      ['read at runtime', 'st.fn({ size: p.n })'],
      ['left out', 'st.fn({})'],
    ])('rejects the default of a named parameter %s', async (_name, call) => {
      await expect(
        transform('({ size = DEFAULT })', '{ width: size }', call),
      ).rejects.toThrow(unresolved('size', 'DEFAULT'));
    });

    it('rejects it for a style handed to a component', async () => {
      await expect(
        transformCode(`import * as css from '@plumeria/core';
const st = css.create({ fn: (n = DEFAULT): any => ({ width: n }) });
const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;
export const A = (p: any) => <Card cardStyle={st.fn(p.n)} />;`),
      ).rejects.toThrow(unresolved('n', 'DEFAULT'));
    });
  });

  describe('function key default: one that is never used', () => {
    it.each([
      ['a positional number', 'st.fn(3)', '"3px"'],
      ['a positional negative number', 'st.fn(-3)', '"-3px"'],
      ['a positional string', `st.fn('3rem')`, '"3rem"'],
    ])('accepts %s in its place', async (_name, call, value) => {
      const { code, css } = await transform(
        '(n = DEFAULT)',
        '{ width: n }',
        call,
      );
      expect(code).toMatch(new RegExp(`"--[a-z0-9]+-n": ${value} \\}\\}`));
      expect(css).toMatch(/\{ width: var\(--[a-z0-9]+-n\); \}/);
      expect(compile('(n = DEFAULT)', '{ width: n }', call)).toBe(css);
    });

    it('accepts a named argument written as a literal', async () => {
      const { code, css } = await transform(
        '({ size = DEFAULT })',
        '{ width: size }',
        'st.fn({ size: 3 })',
      );
      expect(code).not.toContain('style=');
      expect(css).toBe('.x4uz9ojo { width: 3px; }\n');
    });

    it('writes a positional literal into arithmetic without the default', async () => {
      const { code } = await transform(
        '(n = DEFAULT)',
        '{ width: n + 4 }',
        'st.fn(3)',
      );
      expect(code).toContain(
        `(typeof ((3) + 4) === 'number' ? ((3) + 4) + 'px' : ((3) + 4))`,
      );
    });

    it('accepts it on a parameter the body never reads', async () => {
      const { code, css } = await transform(
        '(n, flag = DEFAULT)',
        '{ width: n }',
        'st.fn(p.n)',
      );
      expect(code).toContain(
        `(typeof (p.n) === 'number' ? (p.n) + 'px' : (p.n))`,
      );
      expect(compile('(n, flag = DEFAULT)', '{ width: n }', 'st.fn(p.n)')).toBe(
        css,
      );
    });

    it('reads a default written as undefined as no default', async () => {
      const { code, css } = await transform(
        '(n = undefined)',
        '{ width: n }',
        'st.fn(p.n)',
      );
      expect(code).toContain(
        `(typeof (p.n) === 'number' ? (p.n) + 'px' : (p.n))`,
      );
      expect(css).toMatch(/\{ width: var\(--[a-z0-9]+-n\); \}/);
    });
  });

  describe('function key default: one it can reproduce', () => {
    it.each([
      ['a value read at runtime', 'st.fn(p.n)'],
      ['a literal', 'st.fn(3)'],
      ['an omitted argument', 'st.fn()'],
    ])('writes the same fallback into the rule for %s', async (_name, call) => {
      const { css } = await transform('(n = GAP)', '{ width: n }', call);
      expect(css).toBe('.xmkz4ovz { width: var(--xkvwfgqc-n, 4px); }\n');
    });
  });
});
