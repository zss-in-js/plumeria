import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const files: string[] = [];
jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => files),
}));

import { transformSource } from '../src/transform';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'transform-coverage-'));
let count = 0;

const run = async (
  source: string,
  options: { scan?: string[]; dependencies?: string[] } = {},
) => {
  const filePath = path.join(directory, `fixture-${count++}.tsx`);
  fs.writeFileSync(filePath, source);
  files.splice(0, files.length, ...(options.scan ?? [filePath]));
  return transformSource({
    source,
    moduleId: filePath,
    filePath,
    root: directory,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: (dependency) => options.dependencies?.push(dependency),
  });
};

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

describe('transformSource uncovered syntax forms', () => {
  it('supports a default core import and an aliased defaulted prop', async () => {
    const result = await run(`
      import css from '@plumeria/core';
      const s = css.create({ a: { color: 'red' } });
      export const Card = ({ cardStyle: local = s.a }: { cardStyle?: css.Style }) =>
        <div classStyle={local} />;
      export const App = () => <Card />;
    `);
    expect(result.code).toContain('className');
  });

  it.each([
    ['create', `const value = css.create(make());`],
    ['createStatic', `const value = css.createStatic(make());`],
    ['createTheme', `const value = css.createTheme('.dark', make());`],
  ])('rejects %s without its object argument', async (_name, declaration) => {
    await expect(
      run(`import * as css from '@plumeria/core'; ${declaration}`, {
        scan: [],
      }),
    ).rejects.toThrow(/needs a style object/);
  });

  it.each([
    [
      `const selector = getSelector(); const t = css.createTheme(selector, {});`,
      /needs a selector/,
    ],
    [`const t = css.createTheme('@font-face', {});`, /Unsupported at-rule/],
  ])('rejects an unreadable theme selector', async (body, message) => {
    await expect(
      run(`import * as css from '@plumeria/core'; ${body}`, { scan: [] }),
    ).rejects.toThrow(message);
  });

  it('preserves type-only core specifiers', async () => {
    const result = await run(`
      import { type Style, create as make } from '@plumeria/core';
      const s = make({ a: { color: 'red' } });
      export const A = ({ value }: { value?: Style }) => <div classStyle={[s.a, value]} />;
    `);
    expect(result.code).toContain(
      `import type { Style } from '@plumeria/core'`,
    );
  });

  it('supports the named use import', async () => {
    const result = await run(`
      import { create, use as classes } from '@plumeria/core';
      const s = create({ a: { color: 'red' } });
      export const value = classes(s.a);
    `);
    expect(result.code).not.toContain('classes(s.a)');
  });

  it('merges a non-object existing style expression', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ a: (size: number) => ({ width: size }) });
      export const A = ({ size, style }: any) =>
        <div style={style} classStyle={s.a(size)} />;
    `);
    expect(result.code).toContain('...(style)');
  });

  it('removes an empty style prop while retaining className', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      export const A = ({ name }: any) =>
        <div className={name} classStyle={undefined} />;
    `);
    expect(result.code).toContain('className={(name)}');
  });

  it('rejects a dynamic function key passed to use', async () => {
    await expect(
      run(`
        import * as css from '@plumeria/core';
        const s = css.create({ a: (size: number) => ({ width: size }) });
        export const value = css.use(s.a(2));
      `),
    ).rejects.toThrow(/does not support dynamic function keys/);
  });

  it('compiles local keyframes, view transitions, and themes', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const frames = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
      const transition = css.viewTransition({ old: { opacity: 0 } });
      const theme = css.createTheme('.dark', { color: 'blue' });
      const statics = css.createStatic({ gap: 4 });
      const s = css.create({ a: { animationName: frames, color: theme.color } });
      export const A = () => <div classStyle={s.a} data-values={[transition, statics.gap]} />;
    `);
    expect(result.code).toContain('className');
  });

  it('accepts a literal style object and sparse style arrays', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ a: { color: 'red' } });
      export const A = ({ on }: any) =>
        <><div classStyle={{ color: 'blue' }} /><div classStyle={[s.a, , on && s.a]} /></>;
    `);
    expect(result.code).toContain('className');
  });

  it('supports shorthand named arguments and reports a missing one', async () => {
    const ok = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ a: ({ color }: { color: string }) => ({ color }) });
      export const A = ({ color }: any) => <div classStyle={s.a({ color })} />;
    `);
    expect(ok.code).toContain('className');

    await expect(
      run(`
        import * as css from '@plumeria/core';
        const s = css.create({ a: ({ color }: { color: string }) => ({ color }) });
        export const A = () => <div classStyle={s.a({})} />;
      `),
    ).rejects.toThrow(/leaves "color" unset/);
  });

  it('resolves a positional function called with an object value', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ a: (value: any) => ({ color: value.color }) });
      export const A = () => <div classStyle={s.a({ value: { color: 'red' } })} />;
    `);
    expect(result.code).toContain('className');
  });

  it('discovers a component wrapped in a default-exported call', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ a: { color: 'red' } });
      declare const memo: <T>(value: T) => T;
      export default memo(({ cardStyle = s.a }: { cardStyle?: css.Style }) =>
        <div classStyle={cardStyle} />);
    `);
    expect(result.code).toContain('className');
  });

  it('resolves a complete local create object used as a style', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const styles = css.create({ color: 'red', padding: 4 });
      export const A = () => <div classStyle={styles} />;
    `);
    expect(result.code).toContain('className');
  });

  it('handles an empty style array without adding a class', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      export const A = () => <div classStyle={[]} />;
    `);
    expect(result.code).not.toContain('classStyle');
  });

  it('rejects an unknown computed style group', async () => {
    await expect(
      run(`
        import * as css from '@plumeria/core';
        export const A = ({ styles, kind }: any) => <div classStyle={styles[kind]} />;
      `),
    ).rejects.toThrow(/not supported/);
  });

  it('chooses a collision-free key for computed style groups', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ '#': { color: 'red' }, value: { color: 'blue' } });
      export const A = ({ kind, on }: any) => <div classStyle={on ? s[kind] : s.value} />;
    `);
    expect(result.code).toContain('##');
  });

  it('ignores a computed dynamic-function callee during detection', async () => {
    await expect(
      run(`
        import * as css from '@plumeria/core';
        const s = css.create({ a: (size: number) => ({ width: size }) });
        export const A = () => <div classStyle={s['a'](2)} />;
      `),
    ).rejects.toThrow(/not supported/);
  });
});

describe('transformSource imported tables', () => {
  it('resolves every exported table kind and records the dependency', async () => {
    const library = path.join(directory, 'library.ts');
    const librarySource = `
      import * as css from '@plumeria/core';
      export const constant = 'red';
      export const frames = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
      export const transition = css.viewTransition({ old: { opacity: 0 } });
      export const styles = css.create({ a: { color: constant, animationName: frames } });
      export const theme = css.createTheme('.dark', { color: 'blue' });
      export const statics = css.createStatic({ gap: 4 });
    `;
    fs.writeFileSync(library, librarySource);

    const source = `
      import { constant, frames, transition, styles, theme, statics } from './library';
      export const A = () => <div classStyle={styles.a} data-values={[constant, frames, transition, theme.color, statics.gap]} />;
    `;
    const consumer = path.join(directory, `fixture-${count}.tsx`);
    const dependencies: string[] = [];
    const result = await run(source, {
      scan: [library, consumer],
      dependencies,
    });

    expect(result.code).toContain('className');
    expect(dependencies).toContain(library);
  });

  it('resolves an imported style through a computed key', async () => {
    const library = path.join(directory, 'computed-library.ts');
    fs.writeFileSync(
      library,
      `import * as css from '@plumeria/core'; export const styles = css.create({ a: { color: 'red' }, b: { color: 'blue' } });`,
    );
    const source = `
      import { styles } from './computed-library';
      export const A = ({ kind }: any) => <div classStyle={styles[kind]} />;
    `;
    const consumer = path.join(directory, `fixture-${count}.tsx`);
    const result = await run(source, { scan: [library, consumer] });
    expect(result.code).toContain('[kind]');
  });

  it('rejects an imported dynamic function key passed to use', async () => {
    const library = path.join(directory, 'dynamic-library.ts');
    fs.writeFileSync(
      library,
      `import * as css from '@plumeria/core'; export const styles = css.create({ a: (size: number) => ({ width: size }) });`,
    );
    const source = `
      import * as css from '@plumeria/core';
      import { styles } from './dynamic-library';
      export const value = css.use(styles.a(2));
    `;
    const consumer = path.join(directory, `fixture-${count}.tsx`);
    await expect(run(source, { scan: [library, consumer] })).rejects.toThrow(
      /does not support dynamic function keys/,
    );
  });

  it('skips a computed callee while validating named use arguments', async () => {
    await expect(
      run(`
        import { create, use } from '@plumeria/core';
        const s = create({ a: () => ({ color: 'red' }) });
        export const value = use(s['a']());
      `),
    ).rejects.toThrow(/not supported/);
  });

  it('leaves a component carrier unresolved for an object-style function call', async () => {
    const source = `
      import * as css from '@plumeria/core';
      const s = css.create({ a: (value: any) => ({ color: value.color }) });
      const Card = ({ boxStyle }: { boxStyle?: css.Style }) => <div classStyle={boxStyle} />;
      export const A = () => <Card boxStyle={s.a({ value: { color: 'red' } })} />;
    `;
    const consumer = path.join(directory, `fixture-${count}.tsx`);
    await expect(run(source, { scan: [consumer] })).rejects.toThrow(
      /only supported in the classStyle prop/,
    );
  });
});

describe('transformSource argument and group resolution', () => {
  it('folds a static object argument into a positional dynamic function', async () => {
    const result = await run(`
      import * as css from '@plumeria/core';
      const s = css.create({ a: (value: string) => ({ color: value }) });
      export const A = () => <div classStyle={s.a({ value: 'red' })} />;
    `);
    expect(result.code).toContain('className');
    expect(result.code).not.toContain('style={');
    expect(result.sheets.join('')).toContain('color: red');
  });

  it('rejects a computed key on a top-level object that holds no styles', async () => {
    await expect(
      run(`
        import * as css from '@plumeria/core';
        const s = css.create({ a: { color: 'red' } });
        const palette = { a: s.a };
        export const A = ({ kind }: any) => <div classStyle={palette[kind]} />;
      `),
    ).rejects.toThrow(/"palette\[kind\]" is not supported/);
  });
});
