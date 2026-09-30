import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-transform-edge-')),
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

  const transform = async (files: Record<string, string>) => {
    const cwd = path.join(DIR, String(count++));
    for (const [name, source] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true });
      fs.writeFileSync(path.join(cwd, name), source);
    }
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

  const app = (body: string) => transform({ 'app.tsx': HEAD + body });

  const RED = 'xq96bg3w';
  const PADDING = 'x8ti24uy';

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  describe('transform: how the core package is imported', () => {
    it('leaves a type-only import in place', async () => {
      const { code, css } = await transform({
        'app.tsx': `import type { Style } from '@plumeria/core';
export const A = ({ x }: { x?: Style }) => <div classStyle={x} />;`,
      });
      expect(code).toContain(`import type { Style } from '@plumeria/core';`);
      expect(code).toContain('<div className={""} />');
      expect(css).toBe('');
    });

    it('keeps only the types of an import that mixes them with values', async () => {
      const { code } = await transform({
        'app.tsx': `import { type Style, type CSSProperties as P, create as make } from '@plumeria/core';
const s = make({ a: { color: 'red' } });
export const A = ({ x }: { x?: Style; p?: P }) => <div classStyle={s.a} />;`,
      });
      expect(code).toContain(
        `import type { Style, CSSProperties as P } from '@plumeria/core'`,
      );
      expect(code).not.toContain('make');
      expect(code).toContain(`<div className={"${RED}"} />`);
    });

    it('reads a style object imported under another name', async () => {
      const { code, css } = await transform({
        'styles.ts': `import * as css from '@plumeria/core';
export const styles = css.create({ a: { color: 'teal' } });`,
        'app.tsx': `import '@plumeria/core';
import { styles as st, missing } from './styles';
export const A = () => <div classStyle={st.a} />;`,
      });
      expect(code).toMatch(/<div className=\{"x[a-z0-9]+"\} \/>/);
      expect(css).toContain('color: teal');
    });

    it('leaves a create call on another object alone', async () => {
      const { code } = await app(
        `const other: any = { create: (x: any) => x };
const o = other.create({ a: { color: 'blue' } });
export const A = () => <div classStyle={s.a} />;`,
      );
      expect(code).toContain(`other.create({ a: { color: 'blue' } })`);
      expect(code).toContain(`<div className={"${RED}"} />`);
    });
  });

  describe('transform: a style that is not there', () => {
    it('reads undefined as no class', async () => {
      const { code } = await app(
        `export const A = () => <div classStyle={undefined} />;`,
      );
      expect(code).toContain('<div className={""} />');
    });

    it('reads undefined in an array as no entry', async () => {
      const { code } = await app(
        `export const A = () => <div classStyle={[s.a, undefined]} />;`,
      );
      expect(code).toContain(`<div className={"${RED}"} />`);
    });

    it('skips a hole in an array under a condition', async () => {
      const { code } = await app(
        `export const A = ({ on }: any) => <div classStyle={[on && [s.a, , s.b]]} />;`,
      );
      expect(code).toContain(
        `className={((on) ? "${RED}" : "") + " " + ((on) ? "${PADDING}" : "")}`,
      );
    });

    it('leaves a keyframes call without an object alone', async () => {
      const { code, css } = await app(
        `const frames: any = {}; const k = css.keyframes(frames);`,
      );
      expect(code).toContain('const k = css.keyframes(frames);');
      expect(css).toBe('');
    });
  });

  describe('transform: what it rejects', () => {
    it.each([
      [
        'a destructured create call',
        `const { a } = css.create({ a: { color: 'blue' } });`,
        '[plumeria] css.create must be assigned to a named top-level variable.',
      ],
      [
        'a function key the style object does not hold',
        `export const A = () => <div classStyle={s.nope(1)} />;`,
        '[plumeria] Dynamic or unresolvable style object "s.nope(1)" is not supported.',
      ],
      [
        'a function key called with a spread',
        `export const A = ({ args }: any) => <div classStyle={s.fn(...args)} />;`,
        '[plumeria] Dynamic or unresolvable style object "s.fn(...args)" is not supported.',
      ],
      [
        'a spread in an array under a condition',
        `export const A = ({ on, list }: any) => <div classStyle={[on && [...list]]} />;`,
        '[plumeria] Spread elements in a style array are not supported: "...list".',
      ],
      [
        'a constant that names another constant',
        `const x = s.a; const y = x; export const A = () => <div classStyle={y} />;`,
        '[plumeria] Dynamic or unresolvable style object "y" is not supported.',
      ],
    ])('rejects %s', async (_name, body, message) => {
      await expect(app(body)).rejects.toThrow(message);
    });
  });

  describe('transform: the arguments of a function key', () => {
    it('ignores an argument past the last parameter', async () => {
      const { code } = await app(
        `export const A = ({ n }: any) => <div classStyle={s.fn(n, 2)} />;`,
      );
      expect(code).toMatch(
        /style=\{\{ "--[a-z0-9]+-size": \(typeof \(n\) === 'number' \? \(n\) \+ 'px' : \(n\)\) \}\}/,
      );
    });

    it.each([`s.fn("3")`, `s.fn('3')`])(
      'passes the string literal of %s through as written',
      async (call) => {
        const { code } = await app(
          `export const A = () => <div classStyle={${call}} />;`,
        );
        expect(code).toMatch(/style=\{\{ "--[a-z0-9]+-size": "3" \}\}/);
      },
    );

    it('joins the unit a declaration writes onto each kind of argument', async () => {
      const { code } = await transform({
        'app.tsx': `import * as css from '@plumeria/core';
const s = css.create({ fn: (size: number) => ({ width: \`\${size}px\`, height: size }) });
export const A = ({ n }: any) => <><i classStyle={s.fn("3")} /><b classStyle={s.fn(n)} /><u classStyle={s.fn(4)} /></>;`,
      });
      expect(code).toMatch(/<i [^>]*"--[a-z0-9]+-size": "3px"/);
      expect(code).toMatch(/<b [^>]*"--[a-z0-9]+-size": \(\(n\) \+ 'px'\)/);
    });

    it('emits no class for an object handed to a positional parameter at runtime', async () => {
      const { code } = await app(
        `export const A = ({ n }: any) => <div classStyle={s.fn({ size: n })} />;`,
      );
      expect(code).toContain('<div className={""} />');
    });

    it('hands a function key to a component as a key and its variables', async () => {
      const { code } = await app(
        `const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;
export const A = ({ n }: any) => <Card cardStyle={s.fn(n)} />;`,
      );
      expect(code).toContain('[((cardStyle && cardStyle.key) || cardStyle)]');
      expect(code).toContain('style={{ ...(cardStyle && cardStyle.vars) }}');
      expect(code).toMatch(/<Card cardStyle=\{\{ key: "x[a-z0-9]+", vars: \{/);
    });
  });

  describe('transform: conditions', () => {
    it('keys a conditional nested in another by its path', async () => {
      const { code } = await app(
        `export const A = ({ a, b }: any) => <div classStyle={a ? (b ? s.a : s.b) : s.b} />;`,
      );
      expect(code).toContain(
        `({"#0":"${RED}","#1":"${PADDING}","#2":"${PADDING}"}[((a) ? ((b) ? "#0" : "#1") : "#2")] || "")`,
      );
    });

    it('reads through parentheses', async () => {
      const { code } = await app(
        `export const A = ({ on }: any) => <div classStyle={[(on && s.a), (s.b)]} />;`,
      );
      expect(code).toContain(
        `className={"${PADDING}" + " " + ((on) ? "${RED}" : "")}`,
      );
    });
  });

  describe('transform: names and components', () => {
    it('does not follow a constant into a scope that shadows its name', async () => {
      const { code } = await app(
        `const local = s.a;
export const A = ({ local }: any) => <div classStyle={local} />;
export const B = () => <div classStyle={local} />;`,
      );
      expect(code).toContain(
        'export const A = ({ local }: any) => <div className={""} />;',
      );
      expect(code).toContain(
        `export const B = () => <div className={"${RED}"} />;`,
      );
    });

    it('reads an anonymous default component that receives a style', async () => {
      const { code } = await app(
        `export default function ({ boxStyle }: { boxStyle?: css.Style }) { return <div classStyle={boxStyle} />; }`,
      );
      expect(code).toContain('return <div className={""} />;');
    });

    it('reads a defaulted prop beside patterns it does not name', async () => {
      const { code } = await app(
        `const k = 'x';
const Card = ({ a: { b }, [k]: v, 'q': quoted, c: d = s.a }: any) => <div classStyle={d} />;
export const A = () => <Card c={s.b} />;`,
      );
      expect(code).toMatch(
        new RegExp(
          `\\(\\{"x[a-z0-9]+":"${PADDING}","x[a-z0-9]+":"${RED}"\\}\\[d\\] \\|\\| ""\\)`,
        ),
      );
    });

    it('passes over a wrapper call that holds no component', async () => {
      const { code } = await app(
        `const Card = memo(config);
export const A = () => <div classStyle={s.a} />;`,
      );
      expect(code).toContain('const Card = memo(config);');
      expect(code).toContain(`<div className={"${RED}"} />`);
    });

    it('empties a style object exported through a specifier list', async () => {
      const { code } = await app(
        `const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;
export { Card, s as styles };
export const A = () => <Card cardStyle={s.a} />;`,
      );
      expect(code).toContain('const s = "";');
      expect(code).toContain('export { Card, s as styles };');
    });
  });

  describe('transform: the attributes beside the style prop', () => {
    const FN = `const d = css.create({ fn: (size: number) => ({ width: size }) });\n`;
    const SIZE = `"--[a-z0-9]+-size": \\(typeof \\(n\\) === 'number' \\? \\(n\\) \\+ 'px' : \\(n\\)\\)`;

    it.each([
      [
        'a namespaced attribute',
        `<svg xlink:href="x" classStyle={s.a} />`,
        `<svg xlink:href="x" className={"${RED}"} />`,
      ],
      [
        'a spread attribute',
        `<div {...p} classStyle={s.a} />`,
        `<div {...p} className={"${RED}"} />`,
      ],
      [
        'a className without a value',
        `<div className classStyle={s.a} />`,
        `<div  className={"${RED}"} />`,
      ],
      [
        'a className string',
        `<div className="x" classStyle={s.a} />`,
        `<div  className={"x" + " " + "${RED}"} />`,
      ],
      [
        'a className expression',
        `<div className={p.c} classStyle={s.a} />`,
        `<div  className={(p.c) + " " + "${RED}"} />`,
      ],
      [
        'a className beside a style that is not there',
        `<div className="x" classStyle={undefined} />`,
        `<div  className={"x"} />`,
      ],
    ])('keeps %s', async (_name, element, expected) => {
      const { code } = await app(`export const A = (p: any) => ${element};`);
      expect(code).toContain(expected);
    });

    it.each([
      ['a string', `classStyle="x"`],
      ['no value', `classStyle`],
    ])(
      'leaves a style prop written with %s alone',
      async (_name, attribute) => {
        const { code, css } = await app(
          `export const A = () => <div ${attribute} />;`,
        );
        expect(code).toContain(`<div ${attribute} />`);
        expect(css).toBe('');
      },
    );

    it.each([
      ['a string', `style="color:red"`, ''],
      ['an object', `style={{ top: 1, ...rest }}`, 'top: 1, \\.\\.\\.rest, '],
      ['a name', `style={st}`, '\\.\\.\\.\\(st\\), '],
    ])(
      'merges the variables of a function key into a style attribute written as %s',
      async (_name, attribute, kept) => {
        const { code } = await app(
          FN +
            `export const A = ({ n, rest, st }: any) => <div ${attribute} classStyle={d.fn(n)} />;`,
        );
        expect(code).toMatch(new RegExp(`style=\\{\\{ ${kept}${SIZE} \\}\\}`));
      },
    );
  });

  describe('transform: a definition read as a value', () => {
    const DEFINITIONS = `const statics = css.createStatic({ gap: 4 });
const theme = css.createTheme('.dark', { color: { default: 'black', theme: 'white' } });
const k = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const vt = css.viewTransition({ old: { opacity: 0 } });
`;

    it.each([
      ['a createStatic object', 'statics', '({"gap":4})'],
      ['a createStatic key', 'statics.gap', '(4)'],
      ['a createStatic key it does not hold', 'statics.zzz', '({"gap":4}).zzz'],
      ['a createTheme object', 'theme', '({"color":"var(--x2etbn17-color)"})'],
      ['a createTheme key', 'theme.color', '("var(--x2etbn17-color)")'],
      ['a style key', 's.a', `({"color":"${RED}"})`],
    ])('writes out %s', async (_name, read, written) => {
      const { code } = await app(DEFINITIONS + `export const value = ${read};`);
      expect(code).toContain(`export const value = ${written};`);
    });

    it('names a keyframes and a viewTransition by their hashes', async () => {
      const { code } = await app(DEFINITIONS + `export const all = [k, vt];`);
      expect(code).toMatch(/const k = "kf-x[a-z0-9]+";/);
      expect(code).toMatch(/const vt = "vt-x[a-z0-9]+";/);
    });

    it('writes out definitions imported from another file', async () => {
      const { code } = await transform({
        'tokens.ts': `import * as css from '@plumeria/core';
export const statics = css.createStatic({ gap: 4 });
export const theme = css.createTheme('.dark', { color: { default: 'black', theme: 'white' } });
export const styles = css.create({ a: { color: 'red' } });`,
        'app.tsx': `import '@plumeria/core';
import { statics, theme, styles } from './tokens';
export const all = [statics, statics.gap, statics.zzz, theme, theme.color, styles, styles.a, styles.zzz];`,
      });
      expect(code).toContain(
        `[({"gap":4}), (4), ({"gap":4}).zzz, ({"color":"var(--x2etbn17-color)"}), ("var(--x2etbn17-color)"), ({"a":{"color":"${RED}"}}), ({"color":"${RED}"}), ({"a":{"color":"${RED}"}}).zzz]`,
      );
    });

    it('reads a whole style object in the style prop as no class', async () => {
      const { code } = await app(
        `export const A = () => <div classStyle={s} />;`,
      );
      expect(code).toContain('<div className={""} />');
    });
  });

  describe('transform: css.use', () => {
    it.each([
      ['several styles', 'css.use(s.a, s.b)', `"${RED} ${PADDING}"`],
      ['no argument', 'css.use()', '""'],
      ['a condition', 'css.use(p && s.a)', `((p) ? "${RED}" : "")`],
    ])('compiles %s', async (_name, call, expected) => {
      const { code } = await app(
        `declare const p: boolean; export const cls = ${call};`,
      );
      expect(code).toContain(`export const cls = ${expected};`);
    });

    it('compiles a call through a named import', async () => {
      const { code } = await transform({
        'app.tsx': `import { create, use } from '@plumeria/core';
const s = create({ a: { color: 'red' } });
export const cls = use(s.a);`,
      });
      expect(code).toContain(`export const cls = "${RED}";`);
    });

    it('leaves a call whose callee is not a name alone', async () => {
      const { code } = await app(
        `const v = (() => 1)(); export const A = () => <div classStyle={s.a} />;`,
      );
      expect(code).toContain('const v = (() => 1)();');
    });
  });

  describe('transform: conditions that set the same property', () => {
    const BLUE = `const t = css.create({ c: { color: 'blue' } });\n`;

    it('looks two conditions up together', async () => {
      const { code } = await app(
        BLUE +
          `export const A = ({ x, y }: any) => <div classStyle={[x && s.a, y && t.c]} />;`,
      );
      expect(code).toMatch(
        new RegExp(
          `\\(\\{"0__1":"x[a-z0-9]+","1__0":"${RED}","1__1":"x[a-z0-9]+"\\}\\[\\(\\(x\\) \\? "1" : "0"\\) \\+ "__" \\+ \\(\\(y\\) \\? "1" : "0"\\)\\] \\|\\| ""\\)`,
        ),
      );
    });

    it('looks two comparisons of one name up together', async () => {
      const { code } = await app(
        BLUE +
          `export const A = ({ v }: any) => <div classStyle={[v === 'a' && s.a, v === 'c' && t.c]} />;`,
      );
      expect(code).toContain(
        `[((v === 'a') ? "1" : "0") + "__" + ((v === 'c') ? "1" : "0")]`,
      );
    });

    it('keeps a base the conditions do not touch outside the lookup', async () => {
      const { code } = await app(
        BLUE +
          `export const A = ({ v, on }: any) => <div classStyle={[s.b, v === 'a' && s.a, v === 'c' && t.c, on && s.b]} />;`,
      );
      expect(code).toContain(
        `({"0":"${PADDING}","1":"${PADDING}"}[((on) ? "1" : "0")] || "${PADDING}")`,
      );
    });

    it('widens the lookup for a third condition', async () => {
      const { code } = await app(
        BLUE +
          `export const A = ({ v, y }: any) => <div classStyle={[v === 'a' && s.a, v === 'c' && t.c, y ? s.a : t.c]} />;`,
      );
      expect(code).toContain(`"1__1__1":"${RED}"`);
    });
  });

  describe('transform: one parameter written with several units', () => {
    const local = (declaration: string) =>
      transform({
        'app.tsx': `import * as css from '@plumeria/core';
const st = css.create(${declaration});
export const A = (p: any) => <div classStyle={st.fn(p.n)} />;`,
      });

    it('names a second unit on one property after the unit', async () => {
      const { code } = await local(
        "{ fn: (size: number) => ({ width: `${size}px`, ':hover': { width: `${size}%` }, ':focus': { width: size } }) }",
      );
      expect(code).toMatch(
        /"--([a-z0-9]+)-size": \(\(p\.n\) \+ 'px'\), "--\1-size-width": \(\(p\.n\) \+ '%'\), "--\1-size-width-px": \(typeof \(p\.n\) === 'number' \? \(p\.n\) \+ 'px' : \(p\.n\)\)/,
      );
    });

    it('names a percentage on a unitless property in words', async () => {
      const { code } = await local(
        "{ fn: (n: number) => ({ lineHeight: n, ':hover': { lineHeight: `${n}px` }, ':focus': { lineHeight: `${n}%` } }) }",
      );
      expect(code).toMatch(
        /"--([a-z0-9]+)-n": p\.n, "--\1-n-line-height": \(\(p\.n\) \+ 'px'\), "--\1-n-line-height-percent": \(\(p\.n\) \+ '%'\)/,
      );
    });

    it('shares one variable between declarations that write the same unit', async () => {
      const { code } = await local(
        "{ fn: (n: number) => ({ width: `${n}px`, ':hover': { width: `${n}px` }, height: `${n}%` }) }",
      );
      expect(code).toMatch(
        /style=\{\{ "--([a-z0-9]+)-n": \(\(p\.n\) \+ 'px'\), "--\1-n-height": \(\(p\.n\) \+ '%'\) \}\}/,
      );
    });
  });

  describe('transform: an imported function key that reads names around it', () => {
    const imported = (declaration: string, lead: string, call = 'st.fn(p.n)') =>
      transform({
        'styles.ts': `import * as css from '@plumeria/core';
${lead}
export const st = css.create(${declaration});`,
        'app.tsx': `import '@plumeria/core';
import { st } from './styles';
export const A = (p: any) => <div classStyle={${call}} />;`,
      });

    it.each([
      [
        'a template literal',
        '{ fn: (n: number) => ({ width: `calc(${n}px + ${GAP}px)`, color: TONE }) }',
        `const GAP = 4;\nconst TONE = 'red';`,
        /\{ width: calc\(var\(--[a-z0-9]+-n\) \+ 4px\); \}[\s\S]*\{ color: red; \}/,
      ],
      [
        'a block body',
        '{ fn: (n: number) => { return { width: n, color: TONE }; } }',
        `const TONE = 'red';`,
        /\{ width: var\(--[a-z0-9]+-n\); \}[\s\S]*\{ color: red; \}/,
      ],
      [
        'a function expression',
        '{ fn: function (n: number) { return { width: n, padding: GAP }; } }',
        `const GAP = 4;`,
        /\{ width: var\(--[a-z0-9]+-n\); \}[\s\S]*\{ padding: 4px; \}/,
      ],
      [
        'a parameter default',
        '{ fn: (n: number = GAP) => ({ width: n }) }',
        `const GAP = 4;`,
        /\{ width: var\(--[a-z0-9]+-n, 4px\); \}/,
      ],
      [
        'a shorthand property',
        '{ fn: (n: number) => ({ width: n, color }) }',
        `const color = 'red';`,
        /\{ color: red; \}/,
      ],
      [
        'members and a spread of objects',
        '{ fn: (n: number) => ({ width: n, color: TOKENS.tone, margin: TOKENS.deep.gap, ...BASE }) }',
        `const TOKENS = { tone: 'red', deep: { gap: 4 } };\nconst BASE = { display: 'flex' };`,
        /\{ color: red; \}[\s\S]*\{ margin: 4px; \}[\s\S]*\{ display: flex; \}/,
      ],
    ])('resolves %s', async (_name, declaration, lead, expected) => {
      const { css } = await imported(declaration, lead);
      expect(css).toMatch(expected);
    });

    it.each([
      [
        'an array pattern and a rest parameter',
        '{ fn: ([a]: number[], ...rest: number[]) => ({ width: a }) }',
        'st.fn(p.n)',
      ],
      [
        'a rest element in a named parameter',
        '{ fn: ({ tone, ...rest }: any) => ({ color: tone }) }',
        'st.fn({ tone: p.t })',
      ],
    ])('rejects %s', async (_name, declaration, call) => {
      await expect(imported(declaration, '', call)).rejects.toThrow(
        '[plumeria] Dynamic styles require named parameters or object destructuring; array and rest parameters are not supported.',
      );
    });
  });

  describe('transform: values read through other definitions', () => {
    it('names a keyframes and a viewTransition inside a style', async () => {
      const { css } = await transform({
        'app.tsx': `import * as css from '@plumeria/core';
const k = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const vt = css.viewTransition({ old: { opacity: 0 } });
const st = css.create({ a: { animationName: k, viewTransitionName: vt } });
export const A = () => <div classStyle={st.a} />;`,
      });
      expect(css).toMatch(/@keyframes kf-x[a-z0-9]+ \{/);
      expect(css).toMatch(/::view-transition-old\(vt-x[a-z0-9]+\) \{/);
    });

    it.each([
      [
        'a keyframes read through a namespace import',
        {
          'anim.ts': `import * as css from '@plumeria/core';
export const k = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });`,
          'app.tsx': `import * as css from '@plumeria/core';
import * as anim from './anim';
const st = css.create({ a: { animationName: anim.k } });
export const A = () => <div classStyle={st.a} />;`,
        },
        'Cannot resolve the value of "animationName" at build time (anim.k).',
      ],
      [
        'a createStatic value read through two quoted keys',
        {
          'app.tsx': `import * as css from '@plumeria/core';
const bp = css.createStatic({ n: { gap: 4 } });
const st = css.create({ a: { margin: bp['n']['gap'] } });
export const A = () => <div classStyle={st.a} />;`,
        },
        `Cannot resolve the value of "margin" at build time (bp['n']['gap']).`,
      ],
    ])('rejects %s', async (_name, files, message) => {
      await expect(transform(files)).rejects.toThrow(message);
    });

    it('spreads an object constant and passes over one that is not an object', async () => {
      const { css } = await transform({
        'app.tsx': `import * as css from '@plumeria/core';
const base = { color: 'red' };
const num = 4;
const st = css.create({ a: { ...base, ...num, padding: 1 } });
export const A = () => <div classStyle={st.a} />;`,
      });
      expect(css).toContain('{ color: red; }');
      expect(css).toContain('{ padding: 1px; }');
    });
  });

  describe('transform: no cwd given', () => {
    it('scans the directory the process is running in', async () => {
      const project = path.join(DIR, 'default-cwd');
      fs.mkdirSync(project);
      fs.writeFileSync(
        path.join(project, 'card.tsx'),
        `import * as css from '@plumeria/core';
export const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;`,
      );
      const source = `import * as css from '@plumeria/core';
import { Card } from './card';
const s = css.create({ a: { color: 'red' } });
export const A = () => <Card cardStyle={s.a} />;`;
      const filePath = path.join(project, 'app.tsx');
      fs.writeFileSync(filePath, source);

      const previous = process.cwd();
      process.chdir(project);
      try {
        const { code } = await transformSource({
          source,
          moduleId: filePath,
          filePath,
          root: project,
          isDev: false,
          collectOndemandSheets: true,
        });
        expect(code).toContain(`<Card cardStyle={"xdeb8kup"} />`);
      } finally {
        process.chdir(previous);
      }
    });
  });

  describe('transform: a spread inside a style', () => {
    const declared = (declaration: string, lead = '') =>
      transform({
        'app.tsx': `import * as css from '@plumeria/core';
${lead}
const st = css.create(${declaration});
export const A = () => <div classStyle={st.a} />;`,
      });

    it.each([
      [
        'an object constant, which a later key overrides',
        `{ a: { ...base, color: 'red' } }`,
        `const base = { padding: 2, color: 'blue' };`,
        ['{ padding: 2px; }', '{ color: red; }'],
      ],
      [
        'an object constant, which overrides an earlier key',
        `{ a: { color: 'red', ...base } }`,
        `const base = { padding: 2, color: 'blue' };`,
        ['{ padding: 2px; }', '{ color: blue; }'],
      ],
      [
        'a member of an object constant',
        `{ a: { ...base.inner, color: 'red' } }`,
        `const base = { inner: { padding: 2 } };`,
        ['{ padding: 2px; }', '{ color: red; }'],
      ],
      [
        'a call, which it passes over',
        `{ a: { ...make(), color: 'red' } }`,
        '',
        ['{ color: red; }'],
      ],
    ])('reads %s', async (_name, declaration, lead, rules) => {
      const { css } = await declared(declaration, lead);
      for (const rule of rules) expect(css).toContain(rule);
    });

    it.each([
      [
        'a name it cannot resolve',
        `{ a: { ...missing, color: 'red' } }`,
        '[plumeria] Cannot resolve static value: missing.',
      ],
      [
        'an object literal',
        `{ a: { ...({ padding: 2 }), color: 'red' } }`,
        '[plumeria] Unsupported expression type: an object literal.',
      ],
      [
        'a conditional expression',
        `{ a: { ...(flag ? { padding: 2 } : {}), color: 'red' } }`,
        '[plumeria] Unsupported expression type: a conditional expression.',
      ],
    ])('rejects %s', async (_name, declaration, message) => {
      await expect(declared(declaration, 'const flag = true;')).rejects.toThrow(
        message,
      );
    });
  });

  describe('transform: a style object it cannot see', () => {
    it.each([
      [
        'a function key behind two members',
        `const lib: any = {}; export const A = () => <div classStyle={[s.a, lib.styles.fn(1)]} />;`,
        'lib.styles.fn(1)',
      ],
      [
        'a function key on the result of a call',
        `const get = (): any => s; export const A = () => <div classStyle={[s.a, get().fn(1)]} />;`,
        'get().fn(1)',
      ],
      [
        'a function key on a parameter that shadows the style object',
        `export const A = ({ s }: any) => <div classStyle={s.fn(1)} />;`,
        's.fn(1)',
      ],
      [
        'a static key on a parameter that shadows the style object',
        `export const A = ({ s }: any) => <div classStyle={s.a} />;`,
        's.a',
      ],
    ])('rejects %s', async (_name, body, source) => {
      await expect(app(body)).rejects.toThrow(
        `[plumeria] Dynamic or unresolvable style object "${source}" is not supported.`,
      );
    });
  });

  describe('transform: where a component reads the style it receives', () => {
    const TABLE = `{"xdeb8kup":"${RED}"}`;

    it.each([
      [
        'a member of the props object',
        `(props: { cardStyle?: css.Style }) => <div classStyle={props.cardStyle} />`,
        `(${TABLE}[props.cardStyle] || "")`,
      ],
      [
        'a name destructured in the body',
        `(props: { cardStyle?: css.Style }) => { const { cardStyle } = props; return <div classStyle={cardStyle} />; }`,
        `(${TABLE}[cardStyle] || "")`,
      ],
      [
        'a function nested in the component',
        `({ cardStyle }: { cardStyle?: css.Style }) => { const inner = () => <div classStyle={cardStyle} />; return inner(); }`,
        `(${TABLE}[cardStyle] || "")`,
      ],
    ])('looks the key up through %s', async (_name, component, lookup) => {
      const { code } = await app(
        `const Card = ${component};
export const A = () => <Card cardStyle={s.a} />;`,
      );
      expect(code).toContain(lookup);
      expect(code).toContain('<Card cardStyle={"xdeb8kup"} />');
    });

    it('joins a base with a received array that holds a function key', async () => {
      const { code } = await app(
        `const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={[s.b, cardStyle]} />;
export const A = ({ n, on }: any) => <Card cardStyle={[on && s.a, s.fn(n)]} />;`,
      );
      expect(code).toMatch(
        new RegExp(
          `className=\\{"${PADDING}" \\+ " " \\+ \\(\\{"x[a-z0-9]+":"${RED} x[a-z0-9]+","x[a-z0-9]+":"x[a-z0-9]+"\\}\\[\\(\\(cardStyle && cardStyle\\.key\\) \\|\\| cardStyle\\)\\] \\|\\| ""\\)\\}`,
        ),
      );
    });
  });

  describe('transform: styles that set the same property', () => {
    const BLUE = `const t = css.create({ c: { color: 'blue' }, x: { color: 'blue' }, y: { color: 'green' } });\n`;

    it('keeps the later of two styles that are always applied', async () => {
      const { code, css } = await app(
        BLUE + `export const A = () => <div classStyle={[s.a, t.c]} />;`,
      );
      expect(code).toMatch(/<div className=\{"x[a-z0-9]+"\} \/>/);
      expect(code).not.toContain(RED);
      expect(css).toBe('.xgmn1kmt { color: blue; }\n');
    });

    it('writes a conditional between two of them as it stands', async () => {
      const { code } = await app(
        BLUE +
          `export const A = ({ on }: any) => <div classStyle={[on ? s.a : t.c, s.b]} />;`,
      );
      expect(code).toContain(
        `className={"${PADDING}" + " " + (on ? "${RED}" : "xgmn1kmt")}`,
      );
    });

    it('looks a bracket and a condition up together', async () => {
      const { code } = await app(
        BLUE +
          `export const A = ({ k, on }: any) => <div classStyle={[t[k], on && s.a]} />;`,
      );
      expect(code).toContain(
        `[({"c":"0","x":"1","y":"2"}[k] || "") + "__" + ((on) ? "1" : "0")]`,
      );
    });
  });
});
