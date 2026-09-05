import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseSync } from '@swc/core';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const STYLES = path.join(DIR, 'styles.ts');
const LEAF = path.join(DIR, 'Leaf.tsx');
const PARENT = path.join(DIR, 'Parent.tsx');
const ONLY_LEAF = path.join(DIR, 'OnlyLeaf.tsx');
const ONLY_PARENT = path.join(DIR, 'OnlyParent.tsx');
const SHAPES_LEAF = path.join(DIR, 'ShapesLeaf.tsx');
const SHAPES_PARENT = path.join(DIR, 'ShapesParent.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import { unpluginFactory } from '../src/core';
import { getStyleRecords, deepMerge } from '@plumeria/utils';

const BASE = { backgroundColor: 'green' };
const OTHER = { padding: 24 };

const files: Record<string, string> = {
  [STYLES]: `
import * as css from '@plumeria/core';
export const styles = css.create(${JSON.stringify({ base: BASE, other: OTHER })});
`,
  [LEAF]: `
import * as css from '@plumeria/core';
export const Leaf = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
`,
  [PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
export const Parent = ({ on }: { on?: boolean }) => (
  <div>
    <Leaf styleArray={styles.base} />
    <Leaf styleArray={[styles.base, on && styles.other]} />
    <Leaf styleArray={[on && styles.other, styles.base]} />
  </div>
);
`,
  [SHAPES_LEAF]: `
import * as css from '@plumeria/core';
export const ShapesLeaf = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
`,
  [SHAPES_PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { ShapesLeaf } from './ShapesLeaf';
export const ShapesParent = ({ on }: { on?: boolean }) => (
  <div>
    <ShapesLeaf styleArray={[styles.base, styles.other]} />
    <ShapesLeaf styleArray={on && styles.base} />
    <ShapesLeaf styleArray={on ? styles.base : styles.other} />
    <ShapesLeaf styleArray={[styles.base, on ? styles.other : styles.base]} />
  </div>
);
`,
};

files[ONLY_LEAF] = files[LEAF].replaceAll('Leaf', 'OnlyLeaf');
files[ONLY_PARENT] = files[PARENT].replace(
  '    <Leaf styleArray={styles.base} />\n',
  '',
)
  .replace('    <Leaf styleArray={[on && styles.other, styles.base]} />\n', '')
  .replaceAll('Leaf', 'OnlyLeaf');

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

const classesOf = (style: Record<string, unknown>) =>
  getStyleRecords(style as never)
    .map((r) => r.hash)
    .sort()
    .join(' ');

const norm = (value: string) => value.trim().split(/\s+/).sort().join(' ');

/** Extracts all expressions passed to `styleArray={...}` in source order using SWC */
const passedValues = (code: string): string[] => {
  const ast = parseSync(code, { syntax: 'typescript', tsx: true });
  const values: string[] = [];
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'JSXAttribute' &&
      node.name?.type === 'Identifier' &&
      node.name.value === 'styleArray' &&
      node.value?.type === 'JSXExpressionContainer'
    ) {
      const { start, end } = node.value.expression.span;
      values.push(code.slice(start - 1, end - 1));
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === 'span') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) walk(item);
      } else if (child && typeof child === 'object') {
        walk(child);
      }
    }
  };
  walk(ast);
  return values;
};

/** Extracts the raw JS code inside a JSX attribute's expression container (e.g. className={...}) */
const extractJsxExpr = (code: string, attrName: string): string => {
  const ast = parseSync(code, { syntax: 'typescript', tsx: true });
  let found: any;
  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || found) return;
    if (
      node.type === 'JSXAttribute' &&
      node.name?.type === 'Identifier' &&
      node.name.value === attrName
    ) {
      found = node;
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === 'span') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) walk(item);
      } else if (child && typeof child === 'object') {
        walk(child);
      }
    }
  };
  walk(ast);
  if (!found || found.value?.type !== 'JSXExpressionContainer') {
    throw new Error(
      `Attribute "${attrName}" with JSXExpressionContainer not found in code`,
    );
  }
  const { start, end } = found.value.expression.span;
  return code.slice(start - 1, end - 1);
};

beforeAll(() => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('unplugin: an array over a prop that the build cannot fully read', () => {
  it.each([
    ['alongside a static call site', PARENT, LEAF, 3],
    ['as the only call site', ONLY_PARENT, ONLY_LEAF, 1],
  ])('preserves the readable styles %s', async (_, parent, leaf, count) => {
    const values = passedValues(await run(parent as string));
    const code = await run(leaf as string);
    const expr = extractJsxExpr(code, 'className');

    const render = (value: unknown) =>
      norm(new Function('styleArray', `return (${expr});`)(value) ?? '');
    const valueOf = (source: string, on: boolean) =>
      new Function('on', `return ${source};`)(on);

    expect(values).toHaveLength(count);
    // Preserve the existing partial resolution for either runtime condition.
    for (const value of values) {
      for (const on of [false, true]) {
        expect(render(valueOf(value, on))).toBe(norm(classesOf(BASE)));
      }
    }
  });

  describe('coverage of common style prop shapes', () => {
    it('applies both styles for a plain array [styles.base, styles.other]', async () => {
      const values = passedValues(await run(SHAPES_PARENT));
      const code = await run(SHAPES_LEAF);
      const expr = extractJsxExpr(code, 'className');

      const render = (value: unknown) =>
        norm(new Function('styleArray', `return (${expr});`)(value) ?? '');
      const valueOf = (source: string, on: boolean) =>
        new Function('on', `return ${source};`)(on);

      expect(render(valueOf(values[0], false))).toBe(
        norm(classesOf(deepMerge(BASE, OTHER))),
      );
    });

    it('toggles the style for a bare logical AND: on && styles.base', async () => {
      const values = passedValues(await run(SHAPES_PARENT));
      const code = await run(SHAPES_LEAF);
      const expr = extractJsxExpr(code, 'className');

      const render = (value: unknown) =>
        norm(new Function('styleArray', `return (${expr});`)(value) ?? '');
      const valueOf = (source: string, on: boolean) =>
        new Function('on', `return ${source};`)(on);

      expect(render(valueOf(values[1], true))).toBe(norm(classesOf(BASE)));
      expect(render(valueOf(values[1], false))).toBe('');
    });

    it('switches between styles for a bare ternary: on ? styles.base : styles.other', async () => {
      const values = passedValues(await run(SHAPES_PARENT));
      const code = await run(SHAPES_LEAF);
      const expr = extractJsxExpr(code, 'className');

      const render = (value: unknown) =>
        norm(new Function('styleArray', `return (${expr});`)(value) ?? '');
      const valueOf = (source: string, on: boolean) =>
        new Function('on', `return ${source};`)(on);

      expect(render(valueOf(values[2], true))).toBe(norm(classesOf(BASE)));
      expect(render(valueOf(values[2], false))).toBe(norm(classesOf(OTHER)));
    });

    it('preserves the readable base style for a ternary inside an array', async () => {
      const values = passedValues(await run(SHAPES_PARENT));
      const code = await run(SHAPES_LEAF);
      const expr = extractJsxExpr(code, 'className');

      const render = (value: unknown) =>
        norm(new Function('styleArray', `return (${expr});`)(value) ?? '');
      const valueOf = (source: string, on: boolean) =>
        new Function('on', `return ${source};`)(on);

      expect(render(valueOf(values[3], false))).toBe(norm(classesOf(BASE)));
      expect(render(valueOf(values[3], true))).toBe(norm(classesOf(BASE)));
    });
  });
});
