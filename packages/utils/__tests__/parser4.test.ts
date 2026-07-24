import path from 'node:path';
import { parseSync, ObjectExpression } from '@swc/core';
import * as fs from 'fs';
import * as rs from '@rust-gear/glob';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedRs = rs as jest.Mocked<typeof rs>;

const f = (rel: string) => path.resolve(process.cwd(), rel);

const objExpr = (code: string) =>
  (parseSync(`const _ = ${code};`, { syntax: 'typescript' }).body[0] as any)
    .declarations[0].init as ObjectExpression;

// Loads a fresh copy of the module so each case starts with an empty fileCache
// and empty aggregated tables, then scans the given virtual file set.
const scanFiles = (files: Record<string, string>) => {
  mockedRs.globSync.mockReturnValue(Object.keys(files) as any);
  mockedFs.statSync.mockImplementation(
    (p: any) =>
      ({
        mtimeMs: 1,
        isDirectory: () => false,
        isFile: () => true,
      }) as any,
  );
  mockedFs.existsSync.mockImplementation((p: any) => path.resolve(p) in files);
  mockedFs.readFileSync.mockImplementation(
    (p: any) => files[path.resolve(p)] ?? '',
  );

  let mod: any;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('../src/parser');
  });
  return { mod, tables: mod.scanAll() };
};

const propEntries = (tables: any) => {
  const table = tables.componentPropsTable || {};
  return Object.keys(table).flatMap((compKey) =>
    Object.keys(table[compKey]).flatMap((prop) => table[compKey][prop]),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('objectExpressionToObject fallbacks', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { objectExpressionToObject } = require('../src/parser');

  const call = (
    code: string,
    opts: {
      staticTable?: any;
      createStaticHashTable?: any;
      createStaticObjectTable?: any;
      resolveVariable?: (name: string) => any;
    } = {},
  ) =>
    objectExpressionToObject(
      objExpr(code),
      opts.staticTable ?? {},
      {},
      {},
      {},
      {},
      {},
      opts.createStaticHashTable ?? {},
      opts.createStaticObjectTable ?? {},
      {},
      opts.resolveVariable,
    );

  it('drops a shorthand property when no resolver and no static entry exist', () => {
    expect(call('{ width }')).toEqual({});
  });

  it('keeps a shorthand property that only the static table knows', () => {
    expect(call('{ width }', { staticTable: { width: '1px' } })).toEqual({
      width: '1px',
    });
  });

  it('drops a createStatic member whose object table entry is missing', () => {
    expect(
      call('{ color: tokens.a }', { createStaticHashTable: { tokens: 'H' } }),
    ).toEqual({});
  });

  it('drops a createStatic member indexed by a non-string computed key', () => {
    expect(
      call('{ color: tokens[0] }', {
        createStaticHashTable: { tokens: 'H' },
        createStaticObjectTable: { H: { a: 'red' } },
      }),
    ).toEqual({});
  });
});

describe('collectLocalConsts', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { collectLocalConsts } = require('../src/parser');

  it('ignores module items that declare no variables', () => {
    const ast = parseSync('function f() {}\nclass C {}', {
      syntax: 'typescript',
    });
    expect(collectLocalConsts(ast)).toEqual({});
  });
});

describe('getFileDependencies', () => {
  it('returns nothing for a file that was never scanned', () => {
    const { mod } = scanFiles({});
    expect(mod.getFileDependencies(f('nope.ts'))).toEqual([]);
  });

  it('terminates on a dependency cycle', () => {
    const a = f('cycle/a.ts');
    const b = f('cycle/b.ts');
    const { mod } = scanFiles({
      [a]: 'import * as css from "@plumeria/core"; import { B } from "./b"; export const A = css.create({ x: { color: "red" } });',
      [b]: 'import * as css from "@plumeria/core"; import { A } from "./a"; export const B = css.create({ y: { color: "blue" } });',
    });

    expect(mod.getFileDependencies(a).sort()).toEqual([a, b].sort());
  });
});

describe('scanAll import and export shapes', () => {
  it('handles a namespace import from a non-core module', () => {
    const styles = f('ns/styles.ts');
    const user = f('ns/user.ts');
    const { tables } = scanFiles({
      [styles]:
        'import * as css from "@plumeria/core"; export const s = css.create({ box: { color: "red" } });',
      [user]:
        'import * as css from "@plumeria/core"; import * as all from "./styles"; export const t = css.create({ b: { color: "blue" } });',
    });

    expect(Object.keys(tables.createHashTable)).toContain(`${styles}-s`);
  });

  it('handles createTheme whose selector is not a string literal', () => {
    const file = f('theme/dyn.ts');
    const { tables } = scanFiles({
      [file]:
        'import * as css from "@plumeria/core"; const sel = ":root"; export const th = css.createTheme(sel, { main: "red" });',
    });

    const hash = tables.createThemeHashTable[`${file}-th`];
    expect(hash).toBeDefined();
    expect(tables.createThemeSelectorTable[hash]).toBe('');
  });

  it('resolves a re-export whose source does not exist', () => {
    const barrel = f('reexp/barrel.ts');
    const user = f('reexp/user.tsx');
    const child = f('reexp/Child.tsx');
    const { tables } = scanFiles({
      [barrel]:
        'import "@plumeria/core"; export { Missing } from "./gone";\nexport * from "./also-gone";',
      [child]:
        'import * as css from "@plumeria/core"; export const Child = (p: any) => <div className={css.use(p.styleName)} />;',
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; import { Missing } from "./barrel"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child styleName={s.box} />;',
    });

    expect(propEntries(tables)).toHaveLength(1);
  });

  it('falls through a star export that does not provide the name', () => {
    const leaf = f('star/leaf.ts');
    const barrel = f('star/barrel.ts');
    const user = f('star/user.ts');
    const { tables } = scanFiles({
      [leaf]:
        'import * as css from "@plumeria/core"; export const other = css.create({ o: { color: "red" } });',
      [barrel]: 'import "@plumeria/core"; export * from "./leaf";',
      [user]:
        'import * as css from "@plumeria/core"; import { notThere } from "./barrel"; export const u = css.create({ x: { color: "blue" } });',
    });

    expect(Object.keys(tables.createHashTable)).toContain(`${leaf}-other`);
  });

  it('records a namespace re-export', () => {
    const leaf = f('nsexp/leaf.ts');
    const barrel = f('nsexp/barrel.ts');
    const { tables } = scanFiles({
      [leaf]:
        'import * as css from "@plumeria/core"; export const leafStyle = css.create({ l: { color: "red" } });',
      [barrel]: 'import "@plumeria/core"; export * as leaf from "./leaf";',
    });

    expect(Object.keys(tables.createHashTable)).toContain(`${leaf}-leafStyle`);
  });
});

describe('scanAll styleName prop registration', () => {
  const child = f('props/Child.tsx');
  const childSource =
    'import * as css from "@plumeria/core"; export const Child = (p: any) => <div className={css.use(p.styleName)} />;';

  it('skips holes in a style array', () => {
    const user = f('props/holes.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child styleName={[, s.box]} />;',
    });

    expect(propEntries(tables)).toHaveLength(1);
  });

  it('registers an array member whose class string is empty', () => {
    const user = f('props/empty.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: {} }); export const U = () => <Child styleName={[s.box]} />;',
    });

    const entries = propEntries(tables);
    expect(entries).toHaveLength(1);
    expect(entries[0].classString).toBe('');
  });

  it('gives up on a conditional inside an array when the test is dynamic', () => {
    const user = f('props/dyncond.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ a: { color: "red" }, b: { color: "blue" } }); export const U = ({ flag }: any) => <Child styleName={[flag ? s.a : s.b]} />;',
    });

    expect(propEntries(tables)).toHaveLength(0);
  });

  it('ignores a member access to a key the create call never defined', () => {
    const user = f('props/missingkey.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child styleName={s.nope} />;',
    });

    expect(propEntries(tables)).toHaveLength(0);
  });

  it('falls back to the raw import key when the component export is unresolvable', () => {
    const shim = f('props/shim.ts');
    const user = f('props/unresolved.tsx');
    const { tables } = scanFiles({
      [shim]: 'import "@plumeria/core"; export const somethingElse = 1;',
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./shim"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child styleName={s.box} />;',
    });

    const table = tables.componentPropsTable || {};
    expect(Object.keys(table)).toContain(`${shim}-Child`);
  });

  it('ignores spread attributes on a component', () => {
    const user = f('props/spread.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = (rest: any) => <Child {...rest} styleName={s.box} />;',
    });

    expect(propEntries(tables)).toHaveLength(1);
  });

  it('keeps entries from two files that share a span offset', () => {
    const a = f('props/same-a.tsx');
    const b = f('props/same-b.tsx');
    const identical =
      'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child styleName={s.box} />;';
    const { tables } = scanFiles({
      [child]: childSource,
      [a]: identical,
      [b]: identical,
    });

    const entries = propEntries(tables);
    expect(entries).toHaveLength(2);
    expect(entries[0].spanStart).toBe(entries[1].spanStart);
    expect(new Set(entries.map((e: any) => e.filePath)).size).toBe(2);
  });
});
