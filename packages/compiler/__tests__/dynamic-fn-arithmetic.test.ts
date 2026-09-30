import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { transformSync } from '@swc/core';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource, compileCSS }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-fn-arithmetic-')),
  );
  let count = 0;

  const project = (files: Record<string, string>) => {
    const cwd = path.join(DIR, String(count++));
    for (const [name, source] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true });
      fs.writeFileSync(path.join(cwd, name), source);
    }
    return cwd;
  };

  const transform = async (files: Record<string, string>) => {
    const cwd = project(files);
    const filePath = path.join(cwd, 'app.tsx');
    const { code, sheets } = await transformSource({
      source: files['app.tsx'],
      moduleId: filePath,
      filePath,
      root: cwd,
      cwd,
      isDev: false,
      collectOndemandSheets: true,
    });
    return { code, css: sheets.join('') };
  };

  type Options = { call?: string; lead?: string; params?: string };

  const source = (
    body: string,
    {
      call = 'st.fn(p.n)',
      lead = 'const GAP = 4;',
      params = '(n: number)',
    }: Options = {},
  ) => `import * as css from '@plumeria/core';
${lead}
const st = css.create({ fn: ${params} => (${body}) });
export const A = (p: any) => <div classStyle={${call}} />;`;

  const local = (body: string, options?: Options) =>
    transform({ 'app.tsx': source(body, options) });

  const numeric = (expression: string) =>
    `(typeof (${expression}) === 'number' ? (${expression}) + 'px' : (${expression}))`;

  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const sets = (name: string, value: string) =>
    new RegExp(`"--[a-z0-9]+-${name}": ${escape(value)}[,\\s]`);

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  describe('function key arithmetic: the element computes it', () => {
    it.each([
      ['n + GAP', '(p.n) + 4'],
      ['GAP + n', '4 + (p.n)'],
      ['n - 4', '(p.n) - 4'],
      ['n * 2', '(p.n) * 2'],
      ['n / 2', '(p.n) / 2'],
      ['n % 3', '(p.n) % 3'],
      ['n ** 2', '(p.n) ** 2'],
      ['-n', '-((p.n))'],
      ['+n', '+((p.n))'],
      ['n + n', '(p.n) + (p.n)'],
      ['(n as number) + GAP', '(p.n) + 4'],
    ])('hands %s to the element as one variable', async (written, computed) => {
      const { code, css } = await local(`{ width: ${written} }`);
      expect(code).toMatch(sets('n-1', numeric(computed)));
      expect(css).toMatch(/\{ width: var\(--[a-z0-9]+-n-1\); \}/);
    });

    it.each([
      ['BASE ** n', '(-2) ** (p.n)'],
      ['n - BASE', '(p.n) - (-2)'],
      ['BASE * n', '(-2) * (p.n)'],
    ])(
      'keeps a negative constant in %s apart from the operator',
      async (written, computed) => {
        const { code } = await local(`{ width: ${written} }`, {
          lead: 'const BASE = -2;',
        });
        expect(code).toMatch(sets('n-1', numeric(computed)));
      },
    );

    it('resolves the constants around the parameter before handing it over', async () => {
      const { code } = await local('{ width: (n + T.gap) * 2 - -GAP }', {
        lead: 'const GAP = 4;\nconst T = { gap: 8 };',
      });
      expect(code).toMatch(sets('n-1', numeric('(((p.n) + 8) * 2) - (-(4))')));
    });

    it('leaves a unitless property without a unit', async () => {
      const { code, css } = await local(
        '{ lineHeight: n + GAP, opacity: n / 100 }',
      );
      expect(code).toMatch(sets('n-1', '(p.n) + 4'));
      expect(code).toMatch(sets('n-2', '(p.n) / 100'));
      expect(css).toMatch(/line-height: var\(--[a-z0-9]+-n-1\);/);
      expect(css).toMatch(/opacity: var\(--[a-z0-9]+-n-2\);/);
    });

    it('reaches a nested selector', async () => {
      const { code, css } = await local(`{ ':hover': { width: n + GAP } }`);
      expect(code).toMatch(sets('n-1', numeric('(p.n) + 4')));
      expect(css).toMatch(/:hover \{ width: var\(--[a-z0-9]+-n-1\); \}/);
    });
  });

  describe('function key arithmetic: a unit written after it', () => {
    it.each([
      ['a template literal', '`${n + GAP}px`'],
      ['a concatenation', `n + 4 + 'px'`],
    ])('joins the unit to the result in %s', async (_name, written) => {
      const { code, css } = await local(`{ width: ${written} }`);
      expect(code).toMatch(sets('n-1', `(((p.n) + 4) + 'px')`));
      expect(css).toMatch(/\{ width: var\(--[a-z0-9]+-n-1\); \}/);
    });

    it.each([
      ['a template literal', '`calc(${n * 2}px + ${GAP}px)`', '4px'],
      ['a concatenation', `'calc(' + (n * 2) + 'px + 1rem)'`, '1rem'],
    ])('keeps the result inside calc() in %s', async (_name, written, rest) => {
      const { code, css } = await local(`{ width: ${written} }`);
      expect(code).toMatch(sets('n-1', `(((p.n) * 2) + 'px')`));
      expect(css).toMatch(
        new RegExp(
          `\\{ width: calc\\(var\\(--[a-z0-9]+-n-1\\) \\+ ${rest}\\); \\}`,
        ),
      );
    });

    it.each([
      ['a string literal', `n + 'px'`, '', 'px'],
      ['a string constant', 'n + UNIT', `const UNIT = 'rem';`, 'rem'],
    ])(
      'still reads + beside %s as the unit of the parameter',
      async (_name, written, lead, unit) => {
        const { code, css } = await local(`{ width: ${written} }`, { lead });
        expect(code).toMatch(sets('n', `((p.n) + '${unit}')`));
        expect(css).toMatch(/\{ width: var\(--[a-z0-9]+-n\); \}/);
      },
    );
  });

  describe('function key arithmetic: how many variables it takes', () => {
    it('shares one variable between two uses of the same expression', async () => {
      const { code, css } = await local(
        '{ width: n + GAP, height: n + GAP, margin: n }',
      );
      expect(code).toMatch(sets('n', numeric('p.n')));
      expect(code).toMatch(sets('n-1', numeric('(p.n) + 4')));
      expect(code).not.toMatch(/-n-2"/);
      expect(css).toMatch(/width: var\(--[a-z0-9]+-n-1\);/);
      expect(css).toMatch(/height: var\(--[a-z0-9]+-n-1\);/);
      expect(css).toMatch(/margin: var\(--[a-z0-9]+-n\);/);
    });

    it('gives each expression its own variable', async () => {
      const { code } = await local('{ width: n + GAP, height: n * 2 }');
      expect(code).toMatch(sets('n-1', numeric('(p.n) + 4')));
      expect(code).toMatch(sets('n-2', numeric('(p.n) * 2')));
    });

    it('reads two parameters in one expression', async () => {
      const { code } = await local('{ width: a + b, height: a - GAP }', {
        call: 'st.fn(p.a, p.b)',
        params: '(a: number, b: number)',
      });
      expect(code).toMatch(sets('a-1', numeric('(p.a) + (p.b)')));
      expect(code).toMatch(sets('a-2', numeric('(p.a) - 4')));
    });
  });

  describe('function key arithmetic: an argument known at build time', () => {
    const NAMED = '({ size }: { size: number })';

    it('computes a named argument written as a literal', async () => {
      const { code, css } = await local('{ width: size + GAP }', {
        call: 'st.fn({ size: 3 })',
        params: NAMED,
      });
      expect(code).not.toContain('style=');
      expect(css).toMatch(/\{ width: 7px; \}/);
    });

    it('hands a named argument read at runtime to the element', async () => {
      const { code } = await local('{ width: size + GAP }', {
        call: 'st.fn({ size: p.n })',
        params: NAMED,
      });
      expect(code).toMatch(sets('size-1', numeric('(p.n) + 4')));
    });

    it('computes a parameter left to its default', async () => {
      const { code, css } = await local('{ width: size + GAP, height: size }', {
        call: 'st.fn({})',
        params: '({ size = 10 }: { size?: number })',
      });
      expect(code).not.toContain('style=');
      expect(css).toMatch(/\{ width: 14px; \}/);
      expect(css).toMatch(/\{ height: var\(--[a-z0-9]+-size, 10px\); \}/);
    });

    it('writes a default beside a runtime argument as a number', async () => {
      const { code } = await local('{ width: a + b }', {
        call: 'st.fn({ a: p.a })',
        lead: '',
        params: '({ a, b = 10 }: { a: number; b?: number })',
      });
      expect(code).toMatch(sets('a-1', numeric('(p.a) + 10')));
    });

    it.each([
      ['a number', '10', '10'],
      ['a negative number', '-10', '(-10)'],
      ['a string', `'10%'`, '"10%"'],
    ])(
      'falls back to a default written as %s when the argument is undefined',
      async (_name, written, fallback) => {
        const { code } = await local('{ width: n + GAP }', {
          params: `(n: number | string = ${written})`,
        });
        expect(code).toMatch(
          sets(
            'n-1',
            numeric(`((p.n) === undefined ? ${fallback} : (p.n)) + 4`),
          ),
        );
      },
    );

    it('falls back to the default of a named parameter read at runtime', async () => {
      const { code } = await local('{ width: size + GAP }', {
        call: 'st.fn({ size: p.n })',
        params: '({ size = 10 }: { size?: number })',
      });
      expect(code).toMatch(
        sets('size-1', numeric('((p.n) === undefined ? 10 : (p.n)) + 4')),
      );
    });

    it('writes a positional literal into the expression', async () => {
      const { code } = await local('{ width: n + GAP }', { call: 'st.fn(3)' });
      expect(code).toMatch(sets('n-1', numeric('(3) + 4')));
    });
  });

  describe('function key arithmetic: across files and components', () => {
    it('carries the constants of the defining file to the call site', async () => {
      const { code, css } = await transform({
        'styles.ts': `import * as css from '@plumeria/core';
const GAP = 4;
export const st = css.create({ fn: (n: number) => ({ width: (n + GAP) * 2, height: \`\${n / 2}%\` }) });`,
        'app.tsx': `import '@plumeria/core';
import { st } from './styles';
export const A = (p: any) => <div classStyle={st.fn(p.n)} />;`,
      });
      expect(code).toMatch(sets('n-1', numeric('((p.n) + 4) * 2')));
      expect(code).toMatch(sets('n-2', `(((p.n) / 2) + '%')`));
      expect(css).toMatch(/width: var\(--[a-z0-9]+-n-1\);/);
      expect(css).toMatch(/height: var\(--[a-z0-9]+-n-2\);/);
    });

    it('hands the expression to a component with the key', async () => {
      const { code } = await transform({
        'app.tsx': `import * as css from '@plumeria/core';
const GAP = 4;
const st = css.create({ fn: (n: number) => ({ width: n + GAP }) });
const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;
export const A = (p: any) => <Card cardStyle={st.fn(p.n)} />;`,
      });
      expect(code).toContain('style={{ ...(cardStyle && cardStyle.vars) }}');
      expect(code).toMatch(
        new RegExp(
          `<Card cardStyle=\\{\\{ key: "x[a-z0-9]+", vars: \\{ "--[a-z0-9]+-n-1": ${escape(numeric('(p.n) + 4'))} \\} \\}\\} />`,
        ),
      );
    });

    it('compiles the rule the transformed module refers to', async () => {
      const files = { 'app.tsx': source('{ width: n + GAP, height: n * 2 }') };
      const { css } = await transform(files);
      const compiled = compileCSS({
        include: ['app.tsx'],
        exclude: [],
        cwd: project(files),
      });
      for (const rule of css.trim().split('\n'))
        expect(compiled).toContain(rule.trim());
    });
  });

  describe('function key arithmetic: the value the element ends up with', () => {
    const render = (code: string, props: Record<string, unknown>) => {
      const compiled = transformSync(code, {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'classic' } },
        },
        module: { type: 'commonjs' },
      }).code;
      const exports: any = {};
      new Function('React', 'exports', compiled)(
        { createElement: (_type: unknown, props: unknown) => props },
        exports,
      );
      return Object.values(exports.A(props).style as object);
    };

    it.each([
      ['{ width: BASE ** n }', { n: 2 }, ['4px']],
      ['{ width: n - BASE }', { n: 10 }, ['12px']],
    ])('computes %s with a negative constant', async (body, props, values) => {
      const { code } = await local(body, { lead: 'const BASE = -2;' });
      expect(render(code, props)).toEqual(values);
    });

    it.each([
      ['undefined', {}, ['14px']],
      ['a number', { n: 1 }, ['5px']],
      ['null', { n: null }, ['4px']],
    ])(
      'applies the default of the parameter to an argument that is %s',
      async (_name, props, values) => {
        const { code } = await local('{ width: n + GAP }', {
          params: '(n: number = 10)',
        });
        expect(render(code, props)).toEqual(values);
      },
    );

    it.each([
      ['{ width: n + GAP }', ['14px']],
      ['{ width: GAP - n }', ['-6px']],
      ['{ width: n * 2, height: n / 4 }', ['20px', '2.5px']],
      ['{ width: -n }', ['-10px']],
      ['{ width: (n + T.gap) * 2 - -GAP }', ['40px']],
      ['{ width: `${n + GAP}%` }', ['14%']],
      ['{ width: `calc(${n * 2}px + 1rem)` }', ['20px']],
      ['{ lineHeight: n + GAP, opacity: n / 100 }', [14, 0.1]],
      ['{ width: n, height: n + GAP }', ['10px', '14px']],
    ])('computes %s for 10', async (body, values) => {
      const { code } = await local(body, {
        lead: 'const GAP = 4;\nconst T = { gap: 8 };',
      });
      expect(render(code, { n: 10 })).toEqual(values);
    });
  });

  describe('function key arithmetic: what it still rejects', () => {
    it.each([
      [
        'a name it cannot resolve',
        'n * missing',
        '[plumeria] Cannot resolve static value: missing.',
      ],
      [
        'a template beside the parameter that reads such a name',
        'n + `${missing}px`',
        '[plumeria] Cannot resolve static value: missing.',
      ],
      [
        'the parameter read through a template under such an operator',
        'n - `${n}`',
        '[plumeria] Binary operator - requires numeric operands; received string and string.',
      ],
      [
        'a string under an operator other than +',
        `n - 'a'`,
        '[plumeria] Binary operator - requires numeric operands; received string and string.',
      ],
    ])('rejects %s', async (_name, written, message) => {
      await expect(local(`{ width: ${written} }`)).rejects.toThrow(message);
    });
  });
});
