// A style arriving through a prop is a set of styles, one per call site, and
// the compiled element picks between them by the key it is handed. Putting a
// condition in front of that must not lose the set: the key is gated instead,
// so a false test yields a key no entry claims and the surrounding styles are
// what remain.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const STYLES = path.join(DIR, 'styles.ts');
const GATED = path.join(DIR, 'Gated.tsx');
const EITHER = path.join(DIR, 'Either.tsx');
const PARENT = path.join(DIR, 'Parent.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import { unpluginFactory } from '../src/core';
import { getStyleRecords, deepMerge } from '@plumeria/utils';

const BASE = { padding: 24, fontWeight: 700, color: 'green' };
const RED = { padding: 4, color: 'red' };
const BLUE = { padding: 8, color: 'blue' };

const files: Record<string, string> = {
  [STYLES]: `
import * as css from '@plumeria/core';
export const styles = css.create(${JSON.stringify({
    base: BASE,
    red: RED,
    blue: BLUE,
  })});
`,
  [GATED]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
export const Gated = ({
  styleArray,
  cond,
}: {
  styleArray?: css.Style;
  cond?: boolean;
}) => <div classStyle={[styles.base, cond && styleArray]} />;
`,
  [EITHER]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
export const Either = ({
  styleArray,
  cond,
}: {
  styleArray?: css.Style;
  cond?: boolean;
}) => <div classStyle={cond ? styleArray : styles.base} />;
`,
  [PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { Gated } from './Gated';
import { Either } from './Either';

export const Parent = () => (
  <div>
    <Gated styleArray={styles.red} cond={true} />
    <Gated styleArray={styles.blue} cond={true} />
    <Either styleArray={styles.red} cond={true} />
    <Either styleArray={styles.blue} cond={true} />
  </div>
);
`,
};

const run = async (file: string): Promise<string> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    files[file],
    file,
  );
  return result.code;
};

const norm = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).sort().join(' ');

const classesOf = (style: Record<string, unknown>) =>
  norm(
    getStyleRecords(style as never)
      .map((r) => r.hash)
      .join(' '),
  );

// The compiled element, driven the way React would drive it.
const renderer = async (file: string) => {
  const code = await run(file);
  const expr = code.match(/className=\{([\s\S]*?)\}(?= \/>)/)?.[1];
  if (!expr) throw new Error(`no className in:\n${code}`);
  return (styleArray: unknown, cond: unknown) =>
    norm(
      new Function('styleArray', 'cond', `return (${expr});`)(
        styleArray,
        cond,
      ) ?? '',
    );
};

let keys: string[] = [];

beforeAll(async () => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
  const parent = await run(PARENT);
  keys = [...parent.matchAll(/styleArray={"(\w+)"}/g)].map((m) => m[1]);
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('unplugin: a style prop applied under a condition', () => {
  it('keys the call sites by content, so the same style repeats', () => {
    // [Gated red, Gated blue, Either red, Either blue]
    expect(keys).toHaveLength(4);
    expect(keys[0]).toBe(keys[2]);
    expect(keys[1]).toBe(keys[3]);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('merges the passed style over the base when the gate is open', async () => {
    const render = await renderer(GATED);
    expect(render(keys[0], true)).toBe(classesOf(deepMerge(BASE, RED)));
    expect(render(keys[1], true)).toBe(classesOf(deepMerge(BASE, BLUE)));
  });

  it('leaves the base alone when the gate is closed', async () => {
    const render = await renderer(GATED);
    expect(render(keys[0], false)).toBe(classesOf(BASE));
    expect(render(keys[1], false)).toBe(classesOf(BASE));
  });

  it('falls back to the base when no style was passed', async () => {
    const render = await renderer(GATED);
    expect(render(undefined, true)).toBe(classesOf(BASE));
    expect(render(undefined, false)).toBe(classesOf(BASE));
  });

  it('picks the passed style or the alternative branch of a ternary', async () => {
    const render = await renderer(EITHER);
    expect(render(keys[0], true)).toBe(classesOf(RED));
    expect(render(keys[1], true)).toBe(classesOf(BLUE));
    expect(render(keys[0], false)).toBe(classesOf(BASE));
    expect(render(keys[1], false)).toBe(classesOf(BASE));
  });

  it('leaves no style object in the class expression', async () => {
    for (const file of [GATED, EITHER]) {
      const code = await run(file);
      const expr = code.match(/className=\{([\s\S]*?)\}(?= \/>)/)![1];
      expect(expr).not.toMatch(/styles\.|padding|color|fontWeight/);
    }
  });
});
