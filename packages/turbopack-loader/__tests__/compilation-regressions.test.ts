import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseSync } from '@swc/core';
import { getStyleRecords } from '@plumeria/utils';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');
import loader from '../src/index';

const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'plumeria-loader-regressions-'),
);
const prefix = `import * as css from '@plumeria/core';`;
const styles = `const styles = css.create({ a: { color: 'red' }, b: { padding: 4 }, c: { color: 'blue' } });`;
const run = (
  source: string,
  resourcePath = path.join(directory, 'fixture.tsx'),
) =>
  new Promise<string>((resolve, reject) => {
    loader
      .call(
        {
          resourcePath,
          context: directory,
          rootContext: directory,
          async: () => (error, result) =>
            error ? reject(error) : resolve(result!),
          addDependency: () => {},
          clearDependencies: () => {},
        },
        source,
      )
      .catch(reject);
  });
const checkSyntax = (source: string) =>
  parseSync(source, { syntax: 'typescript', tsx: true });
const classHash = (style: Record<string, any>) =>
  getStyleRecords(style)[0].hash;
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));
afterEach(() => mockedGlob.globSync.mockReturnValue([]));

it('preserves UTF-8 BOM and multibyte leading comments without shifting replacements', async () => {
  const result = await run(
    '\uFEFF/* 日本語 */\n' +
      prefix +
      styles +
      'export const el = <div classStyle={styles.a} />;',
  );
  expect(result).toContain('/* 日本語 */');
  expect(result).toContain(`className={"${classHash({ color: 'red' })}"}`);
  expect(() => checkSyntax(result)).not.toThrow();
});

it.each([
  `<div style={{ color: theme.primary }} className={staticValues.name} classStyle={styles.a} />`,
  `<div classStyle={styles.a} style={{ color: theme.primary }} className={staticValues.name} />`,
])('rewrites constants inside preserved JSX attributes: %s', async (jsx) => {
  const result = await run(
    prefix +
      styles +
      `const theme = css.createTheme(':root', { primary: 'green' }); const staticValues = css.createStatic({ name: 'existing' }); export const el = ${jsx};`,
  );
  expect(result).not.toContain('theme.primary');
  expect(result).not.toContain('staticValues.name');
  expect(result).toContain('var(--');
  expect(result).toContain('existing');
  expect(() => checkSyntax(result)).not.toThrow();
});

it('retains ordered styles in conditional array branches', async () => {
  const result = await run(
    prefix +
      styles +
      `export const el = <div classStyle={flag ? [styles.a, styles.b] : styles.c} />;`,
  );
  expect(result).toContain(classHash({ color: 'red' }));
  expect(result).toContain(classHash({ padding: 4 }));
  expect(result).toContain(classHash({ color: 'blue' }));
  expect(() => checkSyntax(result)).not.toThrow();
});

it.each(['flag || styles.b', 'flag ?? styles.b', "''", '0'])(
  'reports unsupported style entries instead of dropping styles: %s',
  async (entry) => {
    await expect(
      run(
        prefix +
          styles +
          `export const el = <div classStyle={[styles.a, ${entry}]} />;`,
      ),
    ).rejects.toThrow('unresolvable style object');
  },
);

it('rejects an unresolved conditional branch instead of emitting only its other branch', async () => {
  await expect(
    run(
      prefix +
        styles +
        `export const el = <div classStyle={flag ? [styles.a, unknownStyle] : styles.c} />;`,
    ),
  ).rejects.toThrow('unresolvable style object');
});

it.each(['styles.a', 'styles[key]', '[styles.a]'])(
  'does not resolve a shadowed styling-prop binding: %s',
  async (expression) => {
    await expect(
      run(
        prefix +
          styles +
          `export function Component(styles: any) { return <div classStyle={${expression}} />; }`,
      ),
    ).rejects.toThrow('unresolvable style object');
  },
);

it('reports nested style definitions before overwriting the module binding', async () => {
  await expect(
    run(
      prefix +
        styles +
        `export function Component() { const styles = css.create({a:{color:'green'}}); return <div classStyle={styles.a} />; }`,
    ),
  ).rejects.toThrow('top-level variable');
});

it('applies a style received through an object-rest component parameter', async () => {
  const child = path.join(directory, 'Child.tsx');
  const parent = path.join(directory, 'Parent.tsx');
  const childSource =
    prefix +
    `export const Child = ({ id, ...rest }: any) => <div id={id} classStyle={rest.styleArray} />;`;
  const parentSource =
    prefix +
    styles +
    `import { Child } from './Child'; export const Parent = () => <Child id="child" styleArray={styles.a} />;`;
  fs.writeFileSync(child, childSource);
  fs.writeFileSync(parent, parentSource);
  mockedGlob.globSync.mockReturnValue([child, parent]);
  const result = await run(childSource, child);
  expect(result).toContain(classHash({ color: 'red' }));
  expect(result).toContain('rest.styleArray');
  expect(() => checkSyntax(result)).not.toThrow();
});

it.each(['flag && styles.c', 'flag ? styles.c : styles.b'])(
  'compiles conditional entries of a style array passed to a component: %s',
  async (conditional) => {
    const child = path.join(directory, `ArrayChild${conditional.length}.tsx`);
    const parent = path.join(directory, `ArrayParent${conditional.length}.tsx`);
    const childSource =
      prefix +
      `export const Child = ({ styleArray }: any) => <div classStyle={styleArray} />;`;
    const parentSource =
      prefix +
      styles +
      `import { Child } from './${path.basename(child, '.tsx')}'; export const Parent = ({flag}: any) => <Child styleArray={[styles.a, ${conditional}]} />;`;
    fs.writeFileSync(child, childSource);
    fs.writeFileSync(parent, parentSource);
    mockedGlob.globSync.mockReturnValue([parent, child]);
    const parentResult = await run(parentSource, parent);
    const childResult = await run(childSource, child);
    expect(parentResult).toContain('(flag)');
    expect(childResult).toContain(classHash({ color: 'blue' }));
    expect(childResult).toContain(classHash({ color: 'red' }));
    expect(() => checkSyntax(parentResult)).not.toThrow();
    expect(() => checkSyntax(childResult)).not.toThrow();
  },
);

it.each([
  '({ a: { color: "red" } } as const)',
  '({ a: { color: "red" } } satisfies Record<string, any>)',
  'rules',
])('accepts statically readable style arguments: %s', async (argument) => {
  const result = await run(
    prefix +
      `const rules = { a: { color: 'red' } }; const styles = css.create(${argument}); export const el = <div classStyle={styles.a} />;`,
  );
  expect(result).toContain(classHash({ color: 'red' }));
  expect(() => checkSyntax(result)).not.toThrow();
});

it.each([
  'export default css.create({a: {color: "red"}});',
  'let styles; styles = css.create({a: {color: "red"}});',
  'const {a} = css.create({a: {color: "red"}});',
])(
  'diagnoses unsupported declarations without emitting broken code: %s',
  async (declaration) => {
    await expect(run(prefix + declaration)).rejects.toThrow(
      'top-level variable',
    );
  },
);

it.each([
  '(styles as any).a',
  'styles!.a',
  'styles.a!',
  'styles?.a',
  '(styles.a)',
])(
  'resolves styles through a transparent expression wrapper: %s',
  async (expression) => {
    const result = await run(
      prefix + styles + `export const el = <div classStyle={${expression}} />;`,
    );
    expect(result).toContain(classHash({ color: 'red' }));
    expect(() => checkSyntax(result)).not.toThrow();
  },
);

it.each([
  ["{ color: 'red', }", "color: 'red'"],
  ["{ color: 'red' // note\n}", "color: 'red'"],
  ["{ color: 'red', // note\n}", "color: 'red'"],
  ['{ ...rest, }', '...rest'],
])(
  'extends a preserved inline style object written as %s',
  async (styleObject, preserved) => {
    const result = await run(
      prefix +
        styles +
        `const tone = css.create({ box: (color: string) => ({ background: color }) });` +
        `export const el = <div style={${styleObject}} classStyle={tone.box('blue')} />;`,
    );
    expect(result).toContain(preserved);
    expect(result).toContain('"blue"');
    expect(() => checkSyntax(result)).not.toThrow();
  },
);
