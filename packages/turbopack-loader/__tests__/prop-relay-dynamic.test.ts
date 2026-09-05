// A dynamic function key resolves to a class name plus a custom property on the
// element. Only the class is knowable from the component that receives the
// style through a prop, so the key it is handed travels with the values the
// caller computed, and the receiving element spreads them into its own style.
// Written inline or handed over a prop, the element has to end up the same.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const STYLES = path.join(DIR, 'styles.ts');
const INLINE = path.join(DIR, 'Inline.tsx');
const LEAF = path.join(DIR, 'Leaf.tsx');
const MERGED = path.join(DIR, 'Merged.tsx');
const USED = path.join(DIR, 'Used.tsx');
const RELAY = path.join(DIR, 'Relay.tsx');
const GATED = path.join(DIR, 'Gated.tsx');
const UNREADABLE = path.join(DIR, 'Unreadable.tsx');
const USED_PLAIN = path.join(DIR, 'UsedPlain.tsx');
const PARENT = path.join(DIR, 'Parent.tsx');
const MIXED = path.join(DIR, 'Mixed.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import loader from '../src/index';
import { getStyleRecords, deepMerge } from '@plumeria/utils';

const BASE = { backgroundColor: 'green', padding: 24 };

const files: Record<string, string> = {
  [STYLES]: `
import * as css from '@plumeria/core';
export const styles = css.create({
  base: ${JSON.stringify(BASE)},
  tone: (c: string) => ({ backgroundColor: c }),
  sized: (n: number) => ({ padding: n, zIndex: n }),
  tinted: (c = 'teal') => ({ color: c }),
  unread: (c: string) => ({ color: 'olive' }),
});
`,
  [INLINE]: `
import '@plumeria/core';
import { styles } from './styles';
export const Inline = ({ color, n }: { color: string; n: number }) => (
  <div>
    <div classStyle={styles.tone(color)} />
    <div classStyle={styles.sized(n)} />
    <div classStyle={styles.tinted()} />
  </div>
);
`,
  [LEAF]: `
import * as css from '@plumeria/core';
export const Leaf = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
`,
  [MERGED]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
export const Merged = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={[styles.base, styleArray]} />
);
`,
  [USED]: `
import * as css from '@plumeria/core';
export const Used = ({ styleArray }: { styleArray?: css.Style }) => (
  <div className={css.use(styleArray)} />
);
`,
  [RELAY]: `
import * as css from '@plumeria/core';
import { Leaf } from './Leaf';
export const Relay = ({ styleArray }: { styleArray?: css.Style }) => (
  <Leaf styleArray={styleArray} />
);
`,
  [GATED]: `
import * as css from '@plumeria/core';
export const Gated = ({ on, styleArray }: { on: boolean; styleArray?: css.Style }) => (
  <div classStyle={on && styleArray} />
);
`,
  [USED_PLAIN]: `
import * as css from '@plumeria/core';
export const UsedPlain = ({ plain }: { plain?: css.Style }) => (
  <div className={css.use(plain)} />
);
`,
  // The scan cannot read a runtime condition inside an array, so this call
  // site keeps its array and reaches the same prop the carriers do.
  [UNREADABLE]: `
import '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
export const Unreadable = ({ on }: { on: boolean }) => (
  <Leaf styleArray={[on && styles.base, styles.tinted]} />
);
`,
  [MIXED]: `
import '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
export const Mixed = ({ color, flag }: { color: string; flag: boolean }) => (
  <div>
    <Leaf styleArray={[styles.base, flag && styles.base, styles.tone(color)]} />
    <div classStyle={[styles.base, styles.tone(color)]} />
  </div>
);
`,
  [PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
import { Merged } from './Merged';
import { Used } from './Used';
import { Relay } from './Relay';
import { Gated } from './Gated';
import { UsedPlain } from './UsedPlain';

export const Parent = ({
  color,
  n,
  flag,
}: {
  color: string;
  n: number;
  flag: boolean;
}) => (
  <div>
    <Leaf styleArray={styles.tone(color)} />
    <Leaf styleArray={styles.sized(n)} />
    <Leaf styleArray={styles.tinted()} />
    <Merged styleArray={styles.tone(color)} />
    <Used styleArray={styles.tone(color)} />
    <Relay styleArray={styles.tone(color)} />
    <UsedPlain plain={styles.unread(color)} />
    <Gated on styleArray={flag ? styles.tone(color) : styles.base} />
  </div>
);
`,
};

const run = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: file,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, files[file]);
  });

const classesOf = (style: Record<string, unknown>) =>
  getStyleRecords(style as never)
    .map((record) => record.hash)
    .sort()
    .join(' ');

const norm = (value: string) => value.trim().split(/\s+/).sort().join(' ');

type Rendered = { className: string; style: Record<string, unknown> };
type Carrier = { key: string; vars: Record<string, unknown> };

/** Every carrier the parent hands out, in source order. */
const carriersOf = (code: string, flag = true) =>
  [...code.matchAll(/styleArray=\{([\s\S]*?)\}\s*\/>/g)].map((match) =>
    new Function('color', 'n', 'flag', `return (${match[1]});`)('red', 8, flag),
  );

/** What each styled element the file renders resolves to. */
const elementsOf = (code: string): Rendered[] =>
  [
    ...code.matchAll(
      /className=\{([\s\S]*?)\}(?: style=\{\{([\s\S]*?)\}\})?\s*\/>/g,
    ),
  ].map((match) => ({
    className: norm(
      new Function('color', 'n', `return (${match[1]});`)('red', 8),
    ),
    style: new Function('color', 'n', `return ({${match[2] ?? ''}});`)(
      'red',
      8,
    ),
  }));

/** The one array the unreadable call site hands over, as it reaches the child. */
const unreadableValue = (code: string) => {
  const match = code.match(/styleArray=\{(\[[\s\S]*?\])\}\s*\/>/);
  if (!match) throw new Error(`no array left in:\n${code}`);
  return new Function('on', `return (${match[1]});`)(true);
};

/** The child's element, applied to one value of the style prop. */
const renderOf = (code: string) => {
  const match = code.match(
    /className=\{([\s\S]*?)\}(?: style=\{\{([\s\S]*?)\}\})?\s*\/>/,
  );
  if (!match) throw new Error(`no styled element in:\n${code}`);
  return (styleArray: unknown, on = true): Rendered => ({
    className: norm(
      new Function('styleArray', 'on', `return (${match[1]});`)(styleArray, on),
    ),
    style: new Function('styleArray', 'on', `return ({${match[2] ?? ''}});`)(
      styleArray,
      on,
    ),
  });
};

beforeAll(() => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('turbopack-loader: a dynamic function key passed through a prop', () => {
  it('preserves readable styles and variables in a partially resolved array', async () => {
    const code = await run(MIXED);
    const inline = elementsOf(code)[0];
    const render = renderOf(await run(LEAF));

    for (const flag of [false, true]) {
      const carrier = carriersOf(code, flag)[0] as Carrier;
      expect(Object.values(carrier.vars)).toEqual(['red']);
      expect(render(carrier)).toEqual(inline);
    }
  });

  it('hands the key and the values over together', async () => {
    const [tone] = carriersOf(await run(PARENT));
    const { key, vars } = tone as Carrier;
    expect(typeof key).toBe('string');
    expect(Object.values(vars)).toEqual(['red']);
  });

  it('lands the element the call would have written inline', async () => {
    const carriers = carriersOf(await run(PARENT));
    const inline = elementsOf(await run(INLINE));
    const render = renderOf(await run(LEAF));

    expect(render(carriers[0])).toEqual(inline[0]);
  });

  it('carries a parameter that splits into two variables by unit', async () => {
    const carriers = carriersOf(await run(PARENT));
    const inline = elementsOf(await run(INLINE));
    const render = renderOf(await run(LEAF));

    const { vars } = carriers[1] as Carrier;
    expect(Object.values(vars)).toEqual(['8px', 8]);
    expect(render(carriers[1])).toEqual(inline[1]);
  });

  // The default is already written into the rule as a fallback, so the call
  // has nothing to carry and the key travels on its own.
  it('leaves a call that only takes its default as a bare key', async () => {
    const carriers = carriersOf(await run(PARENT));
    const inline = elementsOf(await run(INLINE));
    const render = renderOf(await run(LEAF));

    expect(typeof carriers[2]).toBe('string');
    expect(render(carriers[2])).toEqual(inline[2]);
  });

  it('lets the dynamic value win over a base that sets the same property', async () => {
    const carriers = carriersOf(await run(PARENT));
    const { vars } = carriers[0] as Carrier;
    const cssVar = Object.keys(vars)[0];

    const render = renderOf(await run(MERGED))(carriers[0]);
    expect(render.className).toBe(
      norm(classesOf(deepMerge(BASE, { backgroundColor: `var(${cssVar})` }))),
    );
    expect(render.style).toEqual(vars);
  });

  it('falls back to the base alone when the prop is left out', async () => {
    await run(PARENT);
    const render = renderOf(await run(MERGED))(undefined);
    expect(render.className).toBe(classesOf(BASE));
    expect(render.style).toEqual({});
  });

  it('is rejected on css.use(), which has no element to hold the values', async () => {
    await run(PARENT);
    await expect(run(USED)).rejects.toThrow(
      /"styleArray" carries a dynamic function key, and css\.use\(\) returns only a class name/,
    );
  });

  // Only the branch that needs values becomes a pair; the readable one stays
  // the key it always was.
  it('replaces each branch of a conditional call site on its own', async () => {
    const code = await run(PARENT);
    expect(carriersOf(code, true).at(-1)).toHaveProperty('key');
    expect(typeof carriersOf(code, false).at(-1)).toBe('string');
  });

  it('withholds the values with the class when the child gates the prop', async () => {
    const carrier = carriersOf(await run(PARENT)).at(-1) as Carrier;
    const render = renderOf(await run(GATED));

    expect(render(carrier, true).style).toEqual(carrier.vars);
    expect(render(carrier, false).style).toEqual({});
    expect(render(carrier, false).className).toBe('');
  });

  // A parameter the body never reads produces no custom property, so pairing
  // the key with an empty object would be output nobody needs -- and would
  // close css.use() off from a style that is really just a class name.
  it('leaves a parameter that reaches no declaration as a bare key', async () => {
    const code = await run(PARENT);
    const plain = code.match(/plain=\{([\s\S]*?)\}\s*\/>/)![1];
    expect(plain).toBe('"' + JSON.parse(plain) + '"');
    await expect(run(USED_PLAIN)).resolves.toContain('className=');
  });

  // A Style array the scan could not read keeps its array and reaches the same
  // prop. Reading it by position would take its second element for variables.
  it('does not mistake an unreadable Style array for a carrier', async () => {
    await run(PARENT);
    const value = unreadableValue(await run(UNREADABLE));
    expect(Array.isArray(value)).toBe(true);

    const leaf = await run(LEAF);
    // The prop does carry variables from other call sites, so the element is
    // reading for a carrier here -- otherwise this proves nothing.
    expect(leaf).toContain('.vars');

    const render = renderOf(leaf)(value);
    expect(render.className).toBe('');
    expect(render.style).toEqual({});
  });

  it('is still rejected when passed on to another component', async () => {
    await run(PARENT);
    await expect(run(RELAY)).rejects.toThrow(/is never applied/);
  });
});
