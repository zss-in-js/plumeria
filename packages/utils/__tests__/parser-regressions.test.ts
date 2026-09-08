import fs from 'node:fs';
import path from 'node:path';
import { parseSync } from '@swc/core';
import {
  collectLocalConsts,
  objectExpressionToObject,
  getRootIdentifier,
  deepMerge,
} from '../src/parser';
import { styleFunctionsOf, resolveDynamicStyle } from '../src/dynamicKey';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn() }));
import { globSync } from '@rust-gear/glob';

const parseObject = (source: string, constants = '') => {
  const ast = parseSync(`${constants}; const obj = ${source}`, {
    syntax: 'typescript',
  });
  const node = (ast.body.at(-1) as any).declarations[0].init;
  return objectExpressionToObject(
    node,
    collectLocalConsts(ast),
    {},
    {},
    {},
    {},
    {},
    {},
    {},
  );
};

it('evaluates wrapped values, named unary operands and computed member keys', () => {
  expect(
    parseObject(
      "{ marginTop: -GAP, color: (colors['red'] as string), opacity: +GAP, width: colors[key]! }",
      "const GAP = 8; const colors = {red: '#f00'}; const key = 'red'",
    ),
  ).toEqual({ marginTop: -8, color: '#f00', opacity: 8, width: '#f00' });
  expect(
    parseObject(
      "{ color: yes && 'red', width: no || 8, height: null ?? 4 }",
      'const yes = true; const no = false',
    ),
  ).toEqual({ color: 'red', width: 8, height: 4 });
});

it.each(['-', '*', '/', '%', '**', '&', '<<', '>>', '>>>', '^', '|'])(
  'reports invalid operand types for supported operator %s',
  (operator) => {
    expect(() => parseObject(`{ width: '10' ${operator} 2 }`)).toThrow(
      `[plumeria] Binary operator ${operator} requires numeric operands; received string and number.`,
    );
  },
);

it('distinguishes invalid addition operands from unsupported operators', () => {
  expect(() => parseObject('{ width: 2 + null }')).toThrow(
    '[plumeria] Binary operator + requires non-null primitive operands; received number and null.',
  );
  expect(() => parseObject('{ width: 2 === 2 }')).toThrow(
    '[plumeria] Unsupported binary operator: ===',
  );
  expect(parseObject("{ width: 10 - 2, content: '10' + 2 }")).toEqual({
    width: 8,
    content: '102',
  });
});

it('preserves JavaScript spread replacement and treats prototype keys as data', () => {
  expect(
    parseObject(
      "{ ':hover': {color: 'red', background: 'blue'}, ...override }",
      "const override = {':hover': {color: 'green'}}",
    ),
  ).toEqual({ ':hover': { color: 'green' } });
  const result = parseObject("{ ['__proto__']: {color: 'red'} }");
  expect(Object.hasOwn(result, '__proto__')).toBe(true);
  expect(deepMerge({}, Object.create({ inherited: 'bad' }))).toEqual({});
});

it('does not stringify unresolved calls or objects into CSS', () => {
  expect(() => parseObject('{ width: `calc(100% - ${unknown()}px)` }')).toThrow(
    'primitive',
  );
  expect(() => parseObject("{ width: 'size' + unknown() }")).toThrow();
});

it.each(['(styles as any).box', 'styles!.box', 'styles.box!', 'styles?.box'])(
  'unwraps %s for binding diagnostics',
  (expression) => {
    const ast = parseSync(`const x = ${expression}`, { syntax: 'typescript' });
    expect(getRootIdentifier((ast.body[0] as any).declarations[0].init)).toBe(
      'styles',
    );
  },
);

it('diagnoses unsupported dynamic parameter patterns when used', () => {
  const ast = parseSync(
    'const styles = { box: ([size]) => ({ width: size }) }',
    { syntax: 'typescript' },
  );
  const func = styleFunctionsOf((ast.body[0] as any).declarations[0].init).box;
  expect(() => resolveDynamicStyle(func, ['arg'], {}, {} as any)).toThrow(
    'array and rest',
  );
});

const directory = path.join(__dirname, '__tmp_parser_regressions__');
beforeAll(() => fs.mkdirSync(directory, { recursive: true }));
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));
const write = (name: string, source: string) => {
  const file = path.join(directory, name);
  fs.writeFileSync(file, source);
  const time = new Date(Date.now() + Math.random() * 100000);
  fs.utimesSync(file, time, time);
  return file;
};

it('resolves imported create members regardless of glob order and preserves snapshots', () => {
  const base = write(
    'z-base.ts',
    "import * as css from '@plumeria/core'; export const base = css.create({box: {color: 'red'}});",
  );
  const consumer = write(
    'a-consumer.ts',
    "import * as css from '@plumeria/core'; import {base} from './z-base'; export const styles = css.create({link: base.box});",
  );
  jest.isolateModules(() => {
    (globSync as jest.Mock).mockReturnValue([consumer, base]);
    const { scanAll } = require('../src/parser');
    const first = scanAll();
    const hash = first.createHashTable[`${consumer}-styles`];
    expect(first.createObjectTable[hash]).toEqual({ link: { color: 'red' } });
    write(
      'z-base.ts',
      "import * as css from '@plumeria/core'; export const base = css.create({box: {color: 'blue'}});",
    );
    const next = scanAll();
    expect(
      next.createObjectTable[next.createHashTable[`${consumer}-styles`]],
    ).toEqual({ link: { color: 'blue' } });
    expect(first.createObjectTable[hash]).toEqual({ link: { color: 'red' } });
    expect(next.createObjectTable[hash]).toBeUndefined();
  });
});

it('recovers a failed scan after an imported dependency is repaired', () => {
  const dep = write(
    'dep.ts',
    "import * as css from '@plumeria/core'; export const value = css.createStatic({number: 'bad'});",
  );
  const file = write(
    'user.ts',
    "import * as css from '@plumeria/core'; import {value} from './dep'; export const styles = css.create({box: {width: -value.number}});",
  );
  jest.isolateModules(() => {
    (globSync as jest.Mock).mockReturnValue([file, dep]);
    const { scanAll, resolveFileError } = require('../src/parser');
    scanAll();
    expect(resolveFileError(file, 'styles')).toBeDefined();
    write(
      'dep.ts',
      "import * as css from '@plumeria/core'; export const value = css.createStatic({number: 8});",
    );
    const next = scanAll();
    expect(resolveFileError(file, 'styles')).toBeUndefined();
    expect(
      next.createObjectTable[next.createHashTable[`${file}-styles`]],
    ).toEqual({ box: { width: -8 } });
  });
});

it('inlines computed keys and const defaults into imported dynamic styles', () => {
  const file = write(
    'function.ts',
    "import * as css from '@plumeria/core'; const MOBILE = '@media (max-width: 600px)'; const GAP = 8; export const styles = css.create({box: (gap = GAP) => ({[MOBILE]: {padding: gap}})});",
  );
  jest.isolateModules(() => {
    (globSync as jest.Mock).mockReturnValue([file]);
    const { scanAll } = require('../src/parser');
    const obj = scanAll().createFunctionTable[`${file}-styles`];
    const func = styleFunctionsOf(obj).box;
    expect(func.defaults?.gap).toMatchObject({
      type: 'NumericLiteral',
      value: 8,
    });
    expect(func.body.properties[0]).toMatchObject({
      key: {
        expression: {
          type: 'StringLiteral',
          value: '@media (max-width: 600px)',
        },
      },
    });
  });
});

it('keeps an unchanged failure cached and releases its partial output after a fix', () => {
  const file = write(
    'partial.ts',
    "import * as css from '@plumeria/core'; export const old = css.keyframes({from: {opacity: 0}}); export const broken = css.create({1: {color: 'red'}});",
  );
  jest.isolateModules(() => {
    (globSync as jest.Mock).mockReturnValue([file]);
    const { scanAll, resolveFileError } = require('../src/parser');
    const first = scanAll();
    const oldHash = first.keyframesHashTable[`${file}-old`];
    expect(oldHash).toBeDefined();
    expect(resolveFileError(file, 'broken')).toBeDefined();
    const read = jest.spyOn(fs, 'readFileSync');
    scanAll();
    expect(read.mock.calls.some(([name]) => name === file)).toBe(false);
    read.mockRestore();
    write(
      'partial.ts',
      "import * as css from '@plumeria/core'; export const styles = css.create({box: {color: 'blue'}});",
    );
    const fixed = scanAll();
    expect(resolveFileError(file, 'broken')).toBeUndefined();
    expect(fixed.keyframesObjectTable[oldHash]).toBeUndefined();
    expect(fixed.keyframesHashTable[`${file}-old`]).toBeUndefined();
    expect(
      fixed.createObjectTable[fixed.createHashTable[`${file}-styles`]],
    ).toEqual({ box: { color: 'blue' } });
  });
});

it('refreshes lazily loaded exports when an external barrel changes', () => {
  const file = write('external.ts', 'export {first as styles} from "./first";');
  const first = write('first.ts', 'export const first = 1;');
  const second = write('second.ts', 'export const second = 2;');
  jest.isolateModules(() => {
    const { resolveExport } = require('../src/parser');
    expect(resolveExport(file, 'styles')).toEqual({
      filePath: first,
      localName: 'first',
    });
    write('external.ts', 'export {second as styles} from "./second";');
    expect(resolveExport(file, 'styles')).toEqual({
      filePath: second,
      localName: 'second',
    });
  });
});

it('records syntax errors and empty theme selectors, then clears diagnostics on repair', () => {
  const file = write(
    'syntax.ts',
    "import * as css from '@plumeria/core'; export const styles = css.create({",
  );
  jest.isolateModules(() => {
    (globSync as jest.Mock).mockReturnValue([file]);
    const { scanAll, resolveFileError } = require('../src/parser');
    scanAll();
    expect(resolveFileError(file, 'styles')).toBeDefined();
    write(
      'syntax.ts',
      "import * as css from '@plumeria/core'; export const theme = css.createTheme('', {color: {default: 'red', theme: 'blue'}});",
    );
    scanAll();
    expect(resolveFileError(file, 'theme')?.message).toContain(
      'non-empty selector',
    );
    write(
      'syntax.ts',
      "import * as css from '@plumeria/core'; export const styles = css.create({box: {color: 'red'}});",
    );
    scanAll();
    expect(resolveFileError(file, 'styles')).toBeUndefined();
  });
});

it('recovers after tsconfig paths are corrected without editing the importing file', () => {
  const config = write(
    'tsconfig.json',
    JSON.stringify({ compilerOptions: { paths: { tokens: ['./wrong'] } } }),
  );
  const bad = write(
    'wrong.ts',
    "import * as css from '@plumeria/core'; export const value = css.createStatic({number: 'bad'});",
  );
  const good = write(
    'right.ts',
    "import * as css from '@plumeria/core'; export const value = css.createStatic({number: 8});",
  );
  const file = write(
    'config-user.ts',
    "import * as css from '@plumeria/core'; import {value} from 'tokens'; export const styles = css.create({box: {width: -value.number}});",
  );
  const cwd = jest.spyOn(process, 'cwd').mockReturnValue(directory);
  try {
    jest.isolateModules(() => {
      (globSync as jest.Mock).mockReturnValue([file, bad, good]);
      const { scanAll, resolveFileError } = require('../src/parser');
      scanAll();
      expect(resolveFileError(file, 'styles')).toBeDefined();
      write(
        path.basename(config),
        JSON.stringify({ compilerOptions: { paths: { tokens: ['./right'] } } }),
      );
      const result = scanAll();
      expect(resolveFileError(file, 'styles')).toBeUndefined();
      expect(
        result.createObjectTable[result.createHashTable[`${file}-styles`]],
      ).toEqual({ box: { width: -8 } });
    });
  } finally {
    cwd.mockRestore();
  }
});

it('keeps const-based defaults in generated dynamic CSS', () => {
  const ast = parseSync(
    'const styles = {box: (gap = GAP) => ({padding: gap})}',
    { syntax: 'typescript' },
  );
  const func = styleFunctionsOf((ast.body[0] as any).declarations[0].init).box;
  const result = resolveDynamicStyle(
    func,
    [],
    { GAP: 8 },
    {
      keyframesHashTable: {},
      viewTransitionHashTable: {},
      createThemeHashTable: {},
      createThemeObjectTable: {},
      createHashTable: {},
      createStaticHashTable: {},
      createStaticObjectTable: {},
    },
  );
  expect(result?.style.padding).toMatch(/,\s*8px\)/);
});

it('uses complete path segments and the current working directory for scanning', () => {
  const cwd = jest.spyOn(process, 'cwd');
  try {
    jest.isolateModules(() => {
      (globSync as jest.Mock).mockReturnValue([]);
      const { scanAll } = require('../src/parser');
      for (const name of ['my-node_modules', 'node_modules-backup']) {
        const root = path.join(directory, name, 'app');
        cwd.mockReturnValue(root);
        scanAll();
        expect(globSync).toHaveBeenLastCalledWith(
          path.join(root, '**/*.{js,jsx,ts,tsx}'),
          expect.objectContaining({ cwd: root }),
        );
      }
    });
  } finally {
    cwd.mockRestore();
  }
});
