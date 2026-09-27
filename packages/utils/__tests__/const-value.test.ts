import * as fs from 'fs';
import * as path from 'path';
import { resolveExportValue } from '../src/constValue';

const DIR = fs.mkdtempSync(path.join(__dirname, 'fixture-const-value-'));
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

const write = (name: string, source: string) => {
  const filePath = path.join(DIR, name);
  fs.writeFileSync(filePath, source);
  return filePath;
};

const tokens = write(
  'tokens.ts',
  `import * as css from '@plumeria/core';
export const query = '@media (width >= 640px)' as const;
export const pseudo: string = ':hover';
export const bp = css.createStatic({ md: '@media (width >= 768px)' });
export const plain = { sm: '@media (width >= 480px)' };
export const size = 4;
export const call = String(':hover');
export const notStatic = css.create({ a: { color: 'red' } });
export default ':focus';`,
);
const named = write(
  'named.ts',
  `import { createStatic as cs } from '@plumeria/core';
export const bp = cs({ lg: '@media (width >= 1024px)' } as const);`,
);
const defaultName = write(
  'default-name.ts',
  `const pseudo = ':active';
export default pseudo;`,
);
const barrel = write(
  'barrel.ts',
  `export { query as renamed } from './tokens';
export * from './named';`,
);
const relay = write(
  'relay.ts',
  `import { pseudo } from './tokens';
import * as all from './tokens';
import { unknown } from 'some-package';
export { pseudo, all, unknown };`,
);
const cycle = write(
  'cycle.ts',
  `import { loop } from './cycle';
export { loop };`,
);
const broken = write('broken.ts', `export const = ;`);

describe('resolveExportValue', () => {
  it('reads constants the file declares', () => {
    expect(resolveExportValue(tokens, 'query')).toBe('@media (width >= 640px)');
    expect(resolveExportValue(tokens, 'pseudo')).toBe(':hover');
    expect(resolveExportValue(tokens, 'size')).toBe(4);
    expect(resolveExportValue(tokens, 'plain')).toEqual({
      sm: '@media (width >= 480px)',
    });
  });

  it('reads the object passed to createStatic', () => {
    expect(resolveExportValue(tokens, 'bp')).toEqual({
      md: '@media (width >= 768px)',
    });
    expect(resolveExportValue(named, 'bp')).toEqual({
      lg: '@media (width >= 1024px)',
    });
  });

  it('reads default exports', () => {
    expect(resolveExportValue(tokens, 'default')).toBe(':focus');
    expect(resolveExportValue(defaultName, 'default')).toBe(':active');
  });

  it('follows re-exports and imports', () => {
    expect(resolveExportValue(barrel, 'renamed')).toBe(
      '@media (width >= 640px)',
    );
    expect(resolveExportValue(barrel, 'bp')).toEqual({
      lg: '@media (width >= 1024px)',
    });
    expect(resolveExportValue(relay, 'pseudo')).toBe(':hover');
  });

  it('leaves values it cannot pin down unresolved', () => {
    expect(resolveExportValue(tokens, 'call')).toBeUndefined();
    expect(resolveExportValue(tokens, 'notStatic')).toBeUndefined();
    expect(resolveExportValue(tokens, 'missing')).toBeUndefined();
    expect(resolveExportValue(relay, 'all')).toBeUndefined();
    expect(resolveExportValue(relay, 'unknown')).toBeUndefined();
    expect(resolveExportValue(cycle, 'loop')).toBeUndefined();
    expect(resolveExportValue(broken, 'x')).toBeUndefined();
    expect(
      resolveExportValue(path.join(DIR, 'absent.ts'), 'x'),
    ).toBeUndefined();
  });

  it('rereads a file after it changes', () => {
    const file = write('changing.ts', `export const key = ':hover';`);
    expect(resolveExportValue(file, 'key')).toBe(':hover');
    fs.writeFileSync(file, `export const key = ':focus';`);
    const later = new Date(Date.now() + 10_000);
    fs.utimesSync(file, later, later);
    expect(resolveExportValue(file, 'key')).toBe(':focus');
  });
});
