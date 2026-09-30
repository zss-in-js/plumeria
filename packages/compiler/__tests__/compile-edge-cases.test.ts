import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ compileCSS }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-compile-edge-')),
  );
  let count = 0;

  const HEAD = `import * as css from '@plumeria/core';
const s = css.create({
  a: { color: 'red' },
  b: { padding: 4 },
  fn: (size: number) => ({ width: size }),
  named: ({ tone }: { tone: string }) => ({ color: tone }),
});
`;

  const compile = (files: Record<string, string>) => {
    const cwd = path.join(DIR, String(count++));
    for (const [name, source] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true });
      fs.writeFileSync(path.join(cwd, name), source);
    }
    return compileCSS({ include: ['**/*.{ts,tsx}'], exclude: [], cwd });
  };

  const app = (body: string) => compile({ 'app.tsx': HEAD + body });

  const RED = '.xq96bg3w { color: red; }';
  const PADDING = '.x8ti24uy { padding: 4px; }';

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  describe('compiler: a style array', () => {
    it('skips a hole', () => {
      const css = app(
        `export const A = () => <div classStyle={[s.a, , s.b]} />;`,
      );
      expect(css).toContain(RED);
      expect(css).toContain(PADDING);
    });

    it('keeps the entries it can read beside one it cannot', () => {
      const css = app(
        `export const A = ({ other }: any) => <div classStyle={[s.a, other]} />;`,
      );
      expect(css).toContain(RED);
    });

    it('reads a branch that is undefined as no style', () => {
      const css = app(
        `export const A = ({ on }: any) => <div classStyle={[on ? undefined : s.a, on && s.b]} />;`,
      );
      expect(css).toContain(RED);
      expect(css).toContain(PADDING);
    });
  });

  describe('compiler: a key the style object does not hold', () => {
    it.each([
      ['a static key', `export const A = () => <div classStyle={s.zzz} />;`],
      [
        'a function key',
        `export const A = () => <div classStyle={s.nope(1)} />;`,
      ],
      [
        'a function key called with a spread',
        `export const A = ({ args }: any) => <div classStyle={s.fn(...args)} />;`,
      ],
      [
        'a positional function key called with an unrelated object',
        `export const A = () => <div classStyle={s.fn({ other: 3 })} />;`,
      ],
    ])('emits nothing for %s', (_name, body) => {
      expect(app(body).trim()).toBe('');
    });

    it('rejects a computed key on something that is not a style object', () => {
      expect(() =>
        app(
          `const data: any = {}; export const A = ({ k }: any) => <div classStyle={data[k]} />;`,
        ),
      ).toThrow(
        '[plumeria] Dynamic or unresolvable style object "data[k]" is not supported. (app.tsx)',
      );
    });
  });

  describe('compiler: the arguments of a function key', () => {
    it('reads a shorthand property as the named parameter', () => {
      expect(
        app(
          `export const A = ({ tone }: any) => <div classStyle={s.named({ tone })} />;`,
        ),
      ).toMatch(/\{ color: var\(--[a-z0-9]+-tone\); \}/);
    });

    it('reads a quoted property as the named parameter', () => {
      expect(
        app(
          `export const A = () => <div classStyle={s.named({ 'tone': 'red' })} />;`,
        ),
      ).toContain(RED);
    });

    it.each([
      ['no argument', 's.named()'],
      ['a spread', 's.named({ ...rest })'],
      ['a computed key', `s.named({ [k]: 'red' })`],
    ])('rejects a named parameter left unset by %s', (_name, call) => {
      expect(() =>
        app(
          `export const A = ({ rest, k }: any) => <div classStyle={${call}} />;`,
        ),
      ).toThrow(
        `[plumeria] ${call} leaves "tone" unset, and a dynamic style function has no value to fall back on. (app.tsx)`,
      );
    });

    it('reads an object handed to a positional parameter by its name', () => {
      expect(
        app(`export const A = () => <div classStyle={s.fn({ size: 3 })} />;`),
      ).toContain('{ width: 3px; }');
    });

    it('ignores an argument past the last parameter', () => {
      expect(
        app(
          `export const A = ({ n }: any) => <div classStyle={s.fn(n, 2)} />;`,
        ),
      ).toMatch(/\{ width: var\(--[a-z0-9]+-size\); \}/);
    });
  });

  describe('compiler: how the core package is imported', () => {
    it('reads a named import that is not renamed', () => {
      expect(
        compile({
          'app.tsx': `import { create } from '@plumeria/core';
const s = create({ a: { color: 'red' } });
export const A = () => <div classStyle={s.a} />;`,
        }),
      ).toContain(RED);
    });

    it('reads a style object imported as a default export', () => {
      const css = compile({
        'styles.ts': `import * as css from '@plumeria/core';
const styles = css.create({ a: { color: 'teal' } });
export default styles;`,
        'app.tsx': `import '@plumeria/core';
import styles, { missing } from './styles';
export const A = () => <div classStyle={[styles.a, styles.zzz]} />;`,
      });
      expect(css).toContain('{ color: teal; }');
    });
  });

  describe('compiler: createTheme', () => {
    it.each([
      ['a default export', 'export default '],
      ['an expression statement', ''],
    ])('rejects a call written as %s', (_name, lead) => {
      expect(() =>
        app(`${lead}css.createTheme('.dark', { color: 'red' });`),
      ).toThrow(
        '[plumeria] css.createTheme must be assigned to a named top-level variable.',
      );
    });

    it('rejects a selector it cannot read', () => {
      expect(() =>
        app(`const theme = css.createTheme(missing, { color: 'red' });`),
      ).toThrow(
        '[plumeria] createTheme needs a selector it can read at build time.',
      );
    });

    it('rejects an at-rule that does not nest', () => {
      expect(() =>
        app(`const theme = css.createTheme('@font-face', { color: 'red' });`),
      ).toThrow('[plumeria] Unsupported at-rule: "@font-face".');
    });
  });

  describe('compiler: names that stand for a style', () => {
    it('follows a constant that names a style', () => {
      expect(
        app(
          `const local = s.a; export const A = () => <div classStyle={local} />;`,
        ),
      ).toContain(RED);
    });

    it('does not follow it into a scope that shadows the name', () => {
      const css = app(
        `const local = s.a;
export const A = ({ local }: any) => <div classStyle={local} />;
export const B = () => <div classStyle={local} />;`,
      );
      expect(css).toContain(RED);
    });

    it('leaves a constant that reads ordinary data alone', () => {
      expect(
        app(
          `const data = { v: 1 }; const n = data.v;
export const A = () => <div classStyle={s.a} data-n={n} />;`,
        ),
      ).toContain(RED);
    });

    it('reads an anonymous default component', () => {
      expect(
        app(`export default function () { return <div classStyle={s.b} />; }`),
      ).toContain(PADDING);
    });
  });

  describe('compiler: a style handed to a component', () => {
    const CARD = `const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;\n`;

    it('emits a style passed twice once', () => {
      const css = app(
        CARD +
          `export const A = () => <><Card cardStyle={s.a} /><Card cardStyle={s.a} /><Card other={1} /></>;`,
      );
      expect(css.match(/color: red/g)).toHaveLength(1);
    });

    it('reads a defaulted prop beside patterns it does not name', () => {
      const css = app(
        `const k = 'x';
const Card = ({ a: { b }, [k]: v, c: d = s.a }: any) => <div classStyle={d} />;
export const A = () => <Card c={s.b} />;`,
      );
      expect(css).toContain(RED);
      expect(css).toContain(PADDING);
    });

    it('keeps the components of each file apart', () => {
      const css = compile({
        'card.tsx': `import * as css from '@plumeria/core';
export const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;`,
        'app.tsx':
          HEAD +
          `import { Card } from './card';
const Local = ({ boxStyle }: { boxStyle?: css.Style }) => <div classStyle={boxStyle} />;
export const A = () => <><Card cardStyle={s.a} /><Local boxStyle={s.b} /></>;`,
      });
      expect(css).toContain(RED);
      expect(css).toContain(PADDING);
    });

    it.each([
      ['a quoted key', `s['b']`, [PADDING], [RED]],
      ['a computed key', 's[p.k]', [RED, PADDING], []],
      ['an array with a hole', '[s.a, , s.b]', [RED, PADDING], []],
      ['a key beside ordinary data', 's.a} data={p.data.a.b', [RED], [PADDING]],
    ])('emits the styles of %s', (_name, value, present, absent) => {
      const css = app(
        CARD + `export const A = (p: any) => <Card cardStyle={${value}} />;`,
      );
      for (const rule of present) expect(css).toContain(rule);
      for (const rule of absent) expect(css).not.toContain(rule);
    });

    it.each([
      ['a quoted key the style object does not hold', `s['zzz']`],
      ['a computed key on ordinary data', 'p.data[p.k]'],
      ['the whole style object', 's'],
      ['an empty style', 'e.empty'],
    ])('emits nothing for %s', (_name, value) => {
      expect(
        app(
          CARD +
            `const e = css.create({ empty: {} });
export const A = (p: any) => <Card cardStyle={${value}} />;`,
        ).trim(),
      ).toBe('');
    });

    it('rejects a spread in an array handed to a component', () => {
      expect(() =>
        app(
          CARD +
            `export const A = ({ list }: any) => <Card cardStyle={[s.a, ...list]} />;`,
        ),
      ).toThrow(
        '[plumeria] Spread elements in a style array are not supported: "...list". List each style explicitly. (app.tsx)',
      );
    });

    it('reads a prop destructured under its own name', () => {
      expect(
        app(
          `const Box = ({ boxStyle: boxStyle }: any) => <div classStyle={boxStyle} />;
export const A = () => <Box boxStyle={s.b} />;`,
        ),
      ).toContain(PADDING);
    });

    it('reads a component inside two wrapper calls', () => {
      expect(
        app(
          `const Wrapped = memo(forwardRef(({ wrapStyle }: any, ref: any) => <div ref={ref} classStyle={wrapStyle} />));
const Bare = memo();
export const A = () => <Wrapped wrapStyle={s.b} />;`,
        ),
      ).toContain(PADDING);
    });

    it('reads every form of key on an imported style object', () => {
      const css = compile({
        'styles.ts': `import * as css from '@plumeria/core';
export const styles = css.create({ a: { color: 'teal' }, b: { margin: 2 } });`,
        'app.tsx': `import '@plumeria/core';
import { styles } from './styles';
const Card = ({ cardStyle }: any) => <div classStyle={cardStyle} />;
export const A = ({ k }: any) => <><Card cardStyle={styles} /><Card cardStyle={styles[k]} /><Card cardStyle={styles['a']} /><Card cardStyle={styles['zzz']} /><Card cardStyle={styles.zzz} /></>;`,
      });
      expect(css).toContain('{ color: teal; }');
      expect(css).toContain('{ margin: 2px; }');
    });
  });

  describe('compiler: the style prop on an element', () => {
    it.each([
      ['a template literal without a placeholder', '`red`', RED],
      ['a template literal with one', '`${p.t}`', 'var(--'],
    ])('reads a named argument written as %s', (_name, tone, expected) => {
      expect(
        app(
          `export const A = (p: any) => <div classStyle={s.named({ tone: ${tone} })} />;`,
        ),
      ).toContain(expected);
    });

    it.each([
      ['a function expression', 'function () { return s.a; }'],
      ['an arrow function', '() => s.a'],
    ])('rejects %s', (_name, value) => {
      expect(() =>
        app(`export const A = () => <div classStyle={${value}} />;`),
      ).toThrow(
        `[plumeria] Dynamic or unresolvable style object "${value}" is not supported. (app.tsx)`,
      );
    });

    it('rejects a computed key on ordinary data under a condition', () => {
      expect(() =>
        app(
          `const data: any = {};
export const A = ({ on, k }: any) => <div classStyle={[on && data[k]]} />;`,
        ),
      ).toThrow(
        '[plumeria] Dynamic or unresolvable style object "data[k]" is not supported. (app.tsx)',
      );
    });

    it('keeps the branch it can read beside an array it cannot', () => {
      const css = app(
        `export const A = ({ on, other }: any) => <div classStyle={on ? [s.a, other] : s.b} />;`,
      );
      expect(css).toContain(RED);
      expect(css).toContain(PADDING);
    });

    it('emits nothing for an empty style under a condition', () => {
      const css = app(
        `const e = css.create({ empty: {} });
export const A = ({ on }: any) => <div classStyle={[on ? e.empty : s.a, on && e.empty]} />;`,
      );
      expect(css.trim()).toBe(RED);
    });
  });
});
