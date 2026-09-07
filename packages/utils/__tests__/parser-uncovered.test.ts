import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseSync } from '@swc/core';
import {
  unwrapExpression,
  getRootIdentifier,
  t,
  objectExpressionToObject,
} from '../src/parser';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const glob = jest.requireMock('@rust-gear/glob').globSync;
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-uncovered-'));
afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));
const expression = (source: string) =>
  (
    parseSync(`const value = ${source}`, { syntax: 'typescript' })
      .body[0] as any
  ).declarations[0].init;

it('unwraps nested assertions and identifies parentheses before normalization', () => {
  const node = expression('((styles as any)!.box)');
  expect(t.isParenthesisExpression(node)).toBe(true);
  expect(t.isParenthesisExpression(unwrapExpression(node))).toBe(false);
  expect(getRootIdentifier(node)).toBe('styles');
  expect(unwrapExpression(undefined)).toBeUndefined();
});
it('reports a missing member on a resolved style variable', () => {
  expect(() =>
    objectExpressionToObject(
      expression('{color: theme.missing}'),
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      () => ({ present: 'red' }),
    ),
  ).toThrow('Unknown style member on theme');
});
const scan = (source: string) => {
  const file = path.join(directory, 'App.tsx');
  fs.writeFileSync(file, source);
  glob.mockReturnValue([file]);
  let result: any;
  jest.isolateModules(() => {
    const parser = require('../src/parser');
    const tables = parser.scanAll(directory);
    result = {
      entries: tables.componentPropsTable?.[`${file}-Card`]?.boxStyle,
      error: parser.resolveFileError(file, ''),
    };
  });
  return result;
};
const prefix = `import * as css from '@plumeria/core';const definition={a:{color:'red'},empty:{},space:(n:number)=>({padding:n})};const alias=definition;const s=css.create(alias);const Card=({boxStyle})=>null;`;
it.each([
  ['([s.a, null, , s.empty, s.space(n)] as any)', true],
  ['([null] as any)', false],
  ['((true ? s.a : s.empty) as any)', true],
  ['((false ? s.empty : s.a) as any)', true],
  ['((true && s.a) as any)', true],
  ['((false && s.a) as any)', false],
  ['[s.a, null, false, undefined]', true],
])('scans wrapped style prop expression %s', (value, present) => {
  const result = scan(
    prefix + `export const App=({n})=><Card boxStyle={${value}}/>;`,
  );
  expect(result.error).toBeUndefined();
  if (present)
    expect(
      result.entries.some((entry: any) => entry.styleObj.color === 'red'),
    ).toBe(true);
  else expect(result.entries).toBeUndefined();
});
it.each(['[s.a, unknown()]', 's.a || s.empty', 's.a ?? s.empty'])(
  'reports unsupported style prop expression %s',
  (value) => {
    const result = scan(
      prefix + `export const App=()=> <Card boxStyle={${value}}/>;`,
    );
    expect(result.error?.message).toMatch(
      /unsupported style expression|Style prop fallbacks/,
    );
  },
);
it('handles a file removed between globbing and stat', () => {
  glob.mockReturnValue([path.join(directory, 'missing.ts')]);
  jest.isolateModules(() => {
    const { scanAll } = require('../src/parser');
    expect(() => scanAll(directory)).not.toThrow();
  });
});

it('reports a spread element in a style prop array', () => {
  const result = scan(
    prefix + `export const App=()=> <Card boxStyle={[s.a, ...[s.a]]}/>;`,
  );
  expect(result.error?.message).toMatch(
    /Spread elements in a style array are not supported/,
  );
});
