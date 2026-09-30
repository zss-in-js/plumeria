import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-component-prop-edge-')),
  );
  let count = 0;

  const HEAD = `import * as css from '@plumeria/core';
const s = css.create({
  a: { color: 'red' },
  b: { padding: 4 },
  fn: (size: number) => ({ width: size }),
  named: ({ tone }: { tone: string }) => ({ color: tone }),
});
const Card = ({ cardStyle }: { cardStyle?: css.Style }) => <div classStyle={cardStyle} />;
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
  const RED_KEY = 'xdeb8kup';
  const PADDING_KEY = 'x2sgbyc1';
  const CARRIER = '[((cardStyle && cardStyle.key) || cardStyle)]';

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  describe('component prop: a condition written with a literal', () => {
    it.each([
      [
        'a conditional on true',
        'true ? s.a : s.b',
        `({"${RED_KEY}":"${RED}","${PADDING_KEY}":"${PADDING}"}[cardStyle] || "")`,
        `<Card cardStyle={true ? "${RED_KEY}" : "${PADDING_KEY}"} />`,
      ],
      [
        'false && a style',
        'false && s.a',
        `({"${RED_KEY}":"${RED}"}[cardStyle] || "")`,
        `<Card cardStyle={false && "${RED_KEY}"} />`,
      ],
      [
        'true && a style',
        'true && s.a',
        `({"${RED_KEY}":"${RED}"}[cardStyle] || "")`,
        `<Card cardStyle={true && "${RED_KEY}"} />`,
      ],
    ])('keys %s', async (_name, value, table, site) => {
      const { code } = await app(
        `export const A = () => <Card cardStyle={${value}} />;`,
      );
      expect(code).toContain(table);
      expect(code).toContain(site);
    });
  });

  describe('component prop: a branch it cannot read', () => {
    it('keys the branch it can read beside a name it cannot', async () => {
      const { code } = await app(
        `export const A = ({ on, other }: any) => <Card cardStyle={on ? s.a : other} />;`,
      );
      expect(code).toContain(`({"${RED_KEY}":"${RED}"}[cardStyle] || "")`);
      expect(code).toContain(`<Card cardStyle={on ? "${RED_KEY}" : other} />`);
    });

    it.each([
      ['a name under &&', 'on && other'],
      ['null and false', 'on ? null : false'],
      ['a spread in an array', '[...list]'],
    ])('registers nothing for %s', async (_name, value) => {
      const { code, css } = await app(
        `export const A = ({ on, other, list }: any) => <Card cardStyle={${value}} />;`,
      );
      expect(code).toContain('<div className={""} />');
      expect(code).toContain(`<Card cardStyle={${value}} />`);
      expect(css).toBe('');
    });

    it('rejects a fallback written with ||', async () => {
      await expect(
        app(
          `export const A = ({ on }: any) => <Card cardStyle={on || s.a} />;`,
        ),
      ).rejects.toThrow(
        '[plumeria] Style prop fallbacks using || or ?? cannot be resolved. Use a conditional expression with defined styles.',
      );
    });
  });

  describe('component prop: a function key', () => {
    it.each([
      ['a named argument', 's.named({ tone: p.t })'],
      ['a conditional beside a static key', 'p.on ? s.fn(p.n) : s.a'],
      ['&&', 'p.on && s.fn(p.n)'],
      ['true &&', 'true && s.fn(p.n)'],
      ['false &&', 'false && s.fn(p.n)'],
      ['an array with a condition', '[s.a, p.on && s.b, null, s.fn(p.n)]'],
    ])('reads the key and its variables for %s', async (_name, value) => {
      const { code } = await app(
        `export const A = (p: any) => <Card cardStyle={${value}} />;`,
      );
      expect(code).toContain(CARRIER);
      expect(code).toContain('style={{ ...(cardStyle && cardStyle.vars) }}');
    });

    it('keys both branches of a conditional beside a static key', async () => {
      const { code } = await app(
        `export const A = (p: any) => <Card cardStyle={p.on ? s.fn(p.n) : s.a} />;`,
      );
      expect(code).toMatch(
        new RegExp(
          `\\(\\{"x[a-z0-9]+":"x[a-z0-9]+","${RED_KEY}":"${RED}"\\}\\[\\(\\(cardStyle && cardStyle\\.key\\) \\|\\| cardStyle\\)\\] \\|\\| ""\\)`,
        ),
      );
    });

    it('rejects a named argument written as a spread', async () => {
      await expect(
        app(
          `export const A = ({ rest }: any) => <Card cardStyle={s.named({ ...rest })} />;`,
        ),
      ).rejects.toThrow(
        '[plumeria] s.named({ ...rest }) is only supported in the classStyle prop.',
      );
    });
  });

  describe('component prop: the shape of the receiving component', () => {
    it('reads a defaulted parameter that names the prop twice', async () => {
      const { code } = await transform({
        'app.tsx': `import * as css from '@plumeria/core';
const s = css.create({ a: { color: 'red' } });
const Card = ({ cardStyle, cardStyle: again }: { cardStyle?: css.Style } = {}) => <div classStyle={cardStyle} />;
export const A = () => <Card cardStyle={s.a} />;`,
      });
      expect(code).toContain(`({"${RED_KEY}":"${RED}"}[cardStyle] || "")`);
      expect(code).toContain(`<Card cardStyle={"${RED_KEY}"} />`);
    });

    it('reads anonymous default exports of other files', async () => {
      const { code, css } = await transform({
        'widget.tsx': `import '@plumeria/core';
export default class { render() { return null; } }`,
        'box.tsx': `import * as css from '@plumeria/core';
export default function ({ boxStyle }: { boxStyle?: css.Style }) { return <div classStyle={boxStyle} />; }`,
        'app.tsx': `import * as css from '@plumeria/core';
import Widget from './widget';
import Box from './box';
const s = css.create({ a: { color: 'red' } });
export const A = () => <><Widget /><Box boxStyle={s.a} /></>;`,
      });
      expect(code).toContain(`<Widget /><Box boxStyle={"${RED_KEY}"} />`);
      expect(css).toContain('{ color: red; }');
    });
  });

  describe('component prop: imports the scan does not follow', () => {
    it('passes over a barrel that re-exports the core package and names it cannot resolve', async () => {
      const { code } = await transform({
        'barrel.ts': `export { create } from '@plumeria/core';
export * from '@plumeria/core';
export * from './missing';
export { nope } from 'unknown-package';`,
        'app.tsx': `import * as css from '@plumeria/core';
import * as barrel from './barrel';
const s = css.create({ a: { color: 'red' } });
export const A = () => <div classStyle={s.a} data-b={barrel} />;`,
      });
      expect(code).toContain(`import * as barrel from './barrel';`);
      expect(code).toContain(`<div className={"${RED}"} data-b={barrel} />`);
    });

    it('leaves a namespace import of a style file as written', async () => {
      const { code } = await transform({
        'styles.ts': `import * as css from '@plumeria/core';
export const styles = css.create({ a: { color: 'teal' } });`,
        'app.tsx': `import * as css from '@plumeria/core';
import * as ns from './styles';
const s = css.create({ a: { color: 'red' } });
export const A = () => <div classStyle={s.a} data-n={ns} />;`,
      });
      expect(code).toContain(`import * as ns from './styles';`);
      expect(code).toContain(`<div className={"${RED}"} data-n={ns} />`);
    });
  });
});
