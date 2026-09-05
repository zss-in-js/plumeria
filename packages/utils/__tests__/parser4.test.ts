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
  mockedFs.statSync.mockImplementation((p: any, opts?: any) => {
    if (!(path.resolve(p) in files)) {
      if (opts?.throwIfNoEntry === false) return undefined as any;
      throw Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' });
    }
    return {
      mtimeMs: 1,
      isDirectory: () => false,
      isFile: () => true,
    } as any;
  });
  mockedFs.existsSync.mockImplementation((p: any) => path.resolve(p) in files);
  mockedFs.readFileSync.mockImplementation(
    (p: any) => files[path.resolve(p)] ?? '',
  );

  let mod: any;
  jest.isolateModules(() => {
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

  // A key that is only digits cannot name a style. @plumeria/no-invalid-selector
  // already rejects it, so the compiler has to say so instead of dropping it.
  it('rejects a numeric key', () => {
    expect(() => call('{ 1: { color: "red" } }')).toThrow(
      /The style key 1 is a number/,
    );
  });

  it('rejects a numeric key nested in a style object', () => {
    expect(() => call('{ box: { 1: "red" } }')).toThrow(/is a number/);
  });

  it('keeps a quoted numeric key', () => {
    expect(call('{ "1": { color: "red" } }')).toEqual({ 1: { color: 'red' } });
  });

  it('keeps a name that contains digits', () => {
    expect(call('{ key3: { color: "red" } }')).toEqual({
      key3: { color: 'red' },
    });
  });

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
  it('inlines defining-file values across supported function-key shapes', () => {
    const file = f('functions/shapes.ts');
    const { tables } = scanFiles({
      [file]: `
        import * as css from '@plumeria/core';
        const color = 'red';
        const weight = 700;
        const enabled = true;
        const hover = { color: 'blue', opacity: 0.8 };
        const spread = { display: 'block', visibility: 'visible' };
        const suffix = 'px';
        const prefix = 'size';
        export const styles = css.create({
          object: ({ color: dynamic, fallback = 'black', ...rest }) => ({
            color: dynamic,
            backgroundColor: color,
            variables: hover,
            ':hover': { ...hover, fontWeight: weight },
          }),
          array: ([value]) => ({ opacity: value, ...spread }),
          defaulted: (value = 1) => ({ zIndex: value, enabled }),
          rested: (...values) => ({ order: values[0], label: prefix + '-' + values[0] }),
          computed: (name) => ({ color: hover[name], width: name + suffix }),
          template: (value) => ({ content: \`${'${prefix}'}-${'${value}'}\` }),
          parenthesized: (value) => (({ color, opacity: value, width: (value + weight) })),
          blocked: function (value) { return { color, opacity: value }; },
          empty: function () {},
          scalar: () => color,
          unresolved: () => ({ color: unknown }),
          method: () => ({ custom() {} }),
        });
      `,
    });

    const ast = tables.createFunctionTable[`${file}-styles`];
    expect(ast).toBeDefined();
    expect(JSON.stringify(ast)).toContain('backgroundColor');
    expect(JSON.stringify(ast)).toContain('StringLiteral');
    expect(JSON.stringify(ast)).toContain('BooleanLiteral');
    expect(JSON.stringify(ast)).toContain('NumericLiteral');
  });

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

  it('reads a createTheme selector the file declares as a name', () => {
    const file = f('theme/dyn.ts');
    const { tables } = scanFiles({
      [file]:
        'import * as css from "@plumeria/core"; const sel = ":root"; export const th = css.createTheme(sel, { main: "red" });',
    });

    const hash = tables.createThemeHashTable[`${file}-th`];
    expect(hash).toBeDefined();
    expect(tables.createThemeSelectorTable[hash]).toBe(':root');
  });

  it('keeps two themes apart when only their selectors differ', () => {
    const file = f('theme/pair.ts');
    const { tables } = scanFiles({
      [file]:
        'import * as css from "@plumeria/core"; const one = ".one"; const two = ".two"; export const t1 = css.createTheme(one, { main: "red" }); export const t2 = css.createTheme(two, { main: "red" });',
    });

    const first = tables.createThemeHashTable[`${file}-t1`];
    const second = tables.createThemeHashTable[`${file}-t2`];
    expect(first).not.toBe(second);
    expect(tables.createThemeSelectorTable[first]).toBe('.one');
    expect(tables.createThemeSelectorTable[second]).toBe('.two');
  });

  it('resolves a re-export whose source does not exist', () => {
    const barrel = f('reexp/barrel.ts');
    const user = f('reexp/user.tsx');
    const child = f('reexp/Child.tsx');
    const { tables } = scanFiles({
      [barrel]:
        'import "@plumeria/core"; export { Missing } from "./gone";\nexport * from "./also-gone";',
      [child]:
        'import * as css from "@plumeria/core"; export const Child = (p: any) => <div className={css.use(p.classStyle)} />;',
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; import { Missing } from "./barrel"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child classStyle={s.box} />;',
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

describe('scanAll classStyle prop registration', () => {
  const child = f('props/Child.tsx');
  const childSource =
    'import * as css from "@plumeria/core"; export const Child = (p: any) => <div className={css.use(p.classStyle)} />;';

  it('skips holes in a style array', () => {
    const user = f('props/holes.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child classStyle={[, s.box]} />;',
    });

    expect(propEntries(tables)).toHaveLength(1);
  });

  it('registers an array member whose class string is empty', () => {
    const user = f('props/empty.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: {} }); export const U = () => <Child classStyle={[s.box]} />;',
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
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ a: { color: "red" }, b: { color: "blue" } }); export const U = ({ flag }: any) => <Child classStyle={[flag ? s.a : s.b]} />;',
    });

    expect(propEntries(tables)).toHaveLength(0);
  });

  it('ignores a member access to a key the create call never defined', () => {
    const user = f('props/missingkey.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child classStyle={s.nope} />;',
    });

    expect(propEntries(tables)).toHaveLength(0);
  });

  it('falls back to the raw import key when the component export is unresolvable', () => {
    const shim = f('props/shim.ts');
    const user = f('props/unresolved.tsx');
    const { tables } = scanFiles({
      [shim]: 'import "@plumeria/core"; export const somethingElse = 1;',
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./shim"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child classStyle={s.box} />;',
    });

    const table = tables.componentPropsTable || {};
    expect(Object.keys(table)).toContain(`${shim}-Child`);
  });

  it('ignores spread attributes on a component', () => {
    const user = f('props/spread.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [user]:
        'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = (rest: any) => <Child {...rest} classStyle={s.box} />;',
    });

    expect(propEntries(tables)).toHaveLength(1);
  });

  it('registers a member-chain tag under the module its leaf is declared in', () => {
    const ns = f('props/ns.tsx');
    const user = f('props/member.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [ns]: 'import "@plumeria/core"; import { Child } from "./Child"; export const svg = { Child };',
      [user]:
        'import * as css from "@plumeria/core"; import { svg } from "./ns"; const s = css.create({ box: { color: "red" } }); export const U = () => <svg.Child classStyle={s.box} />;',
    });

    const table = tables.componentPropsTable || {};
    // Same key a bare `<Child />` would produce -- the chain lands on the leaf.
    expect(table[`${child}-Child`]?.classStyle).toHaveLength(1);
  });

  it('follows a member chain of any depth, including a namespace import', () => {
    const mid = f('props/mid.tsx');
    const top = f('props/top.tsx');
    const user = f('props/deep.tsx');
    const { tables } = scanFiles({
      [child]: childSource,
      [mid]:
        'import "@plumeria/core"; export { Child } from "./Child"; import { Child } from "./Child"; export const Social = { Child };',
      [top]:
        'import "@plumeria/core"; export { Social } from "./mid"; import { Social } from "./mid"; export const Icons = { Social };',
      [user]:
        'import * as css from "@plumeria/core"; import * as ns from "./top"; const s = css.create({ a: { color: "red" }, b: { color: "blue" } }); export const U = () => <div><ns.Icons.Social.Child classStyle={s.a} /><ns.Social.Child classStyle={s.b} /></div>;',
    });

    const table = tables.componentPropsTable || {};
    expect(table[`${child}-Child`]?.classStyle).toHaveLength(2);
  });

  it('keeps entries from two files that share a span offset', () => {
    const a = f('props/same-a.tsx');
    const b = f('props/same-b.tsx');
    const identical =
      'import * as css from "@plumeria/core"; import { Child } from "./Child"; const s = css.create({ box: { color: "red" } }); export const U = () => <Child classStyle={s.box} />;';
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

describe('dynamic style props in scanAll', () => {
  const definitions = `
    import * as css from '@plumeria/core';
    export const styles = css.create({
      size: (size) => ({ width: size }),
      named: ({ width: size, color = 'red' }) => ({ width: size, color }),
      defaults: ({ size = 4 }) => ({ width: size }),
      fixed: (unused) => ({ color: 'red' }),
    });
  `;

  test.each([
    ['styles.size(value)', true],
    ['styles.size(value, extra)', true],
    ['styles.named({ width: value })', true],
    ['styles.named({ "width": value, color })', true],
    ['styles.defaults()', false],
    ['styles.fixed(value)', false],
    ['[styles.size(value), styles.fixed(value)]', true],
    ['[true ? styles.size(value) : styles.fixed(value)]', true],
    ['[false ? styles.fixed(value) : styles.size(value)]', true],
    ['[true && styles.size(value)]', true],
    ['[(styles.size(value))]', true],
  ])('registers %s with hasVars=%s', (expression, hasVars) => {
    const { tables } = scanFiles({
      [f('dynamic/styles.ts')]: definitions,
      [f('dynamic/page.tsx')]:
        `import * as css from '@plumeria/core'; import { styles } from './styles'; export const Page = () => <Card styleProp={${expression}} />;`,
    });
    const entries = propEntries(tables);
    expect(entries).toHaveLength(1);
    expect(entries[0].classString).not.toBe('');
    expect(entries[0].hasVars ?? false).toBe(hasVars);
    if (hasVars) expect(entries[0].styleObj.width).toMatch(/^var\(--/);
    else
      expect(entries[0].styleObj).toEqual(
        expression.includes('defaults')
          ? { width: expect.stringMatching(/^var\(--.*?, 4px\)$/) }
          : { color: 'red' },
      );
  });

  test.each([
    'unknown(value)',
    'styles["size"](value)',
    'styles.missing(value)',
    'styles.size(...values)',
    'styles.named(value)',
    'styles.named({}, {})',
    'styles.named({ color: value })',
    'styles.size({ size: value })',
  ])('does not register unsupported call %s', (expression) => {
    const { tables } = scanFiles({
      [f('dynamic/page.tsx')]:
        `${definitions} export const Page = () => <Card styleProp={${expression}} />;`,
    });
    expect(propEntries(tables)).toEqual([]);
  });

  test('records an evaluation error in the JSX phase', () => {
    const file = f('dynamic/error.tsx');
    const { mod, tables } = scanFiles({
      [file]: `import * as css from '@plumeria/core'; export const styles = css.create({ bad: (value) => ({ width: value ** 2 }) }); export const Page = () => <Card styleProp={styles.bad(value)} />;`,
    });
    expect(propEntries(tables)).toEqual([]);
    expect(mod.resolveFileError(file, 'styles')).toEqual({
      filePath: file,
      message: expect.stringContaining('Unsupported binary operator'),
    });
  });
});

describe('theme selector failures', () => {
  test('returns an empty selector when evaluation throws', () => {
    const { resolveThemeSelector } = require('../src/parser');
    const expression = (objExpr('{ value: value ** 2 }').properties[0] as any)
      .value;
    expect(resolveThemeSelector(expression, {}, {}, {})).toBe('');
  });

  test('resolves a quoted createStatic member as a selector', () => {
    const { resolveThemeSelector } = require('../src/parser');
    const expression = (
      objExpr('{ value: selectors["root"] }').properties[0] as any
    ).value;
    expect(
      resolveThemeSelector(
        expression,
        {},
        { selectors: 'hash' },
        { hash: { root: '.root' } },
      ),
    ).toBe('.root');
  });
});
