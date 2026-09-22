import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'plumeria-class-prop-'),
);

const prefix = `import * as css from '@plumeria/core';`;
const styles = `const styles = css.create({ a: { color: 'red' }, dyn: (x: number = 0) => ({ width: x }) });`;

const run = async (body: string, classProp?: string) => {
  const filePath = path.join(directory, `${Math.random()}.tsx`);
  const source = `${prefix}\n${styles}\n${body}\n`;
  fs.writeFileSync(filePath, source);
  const { code } = await transformSource({
    source,
    moduleId: filePath,
    filePath,
    root: directory,
    styleProp: DEFAULT_STYLE_PROP,
    classProp,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
  });
  return code;
};

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

it('writes className when no class prop is configured', async () => {
  const code = await run(
    `export const A = () => <div classStyle={styles.a} />;`,
  );

  expect(code).toContain('className={');
  expect(code).not.toContain('<div class=');
});

it('writes the configured attribute instead of className', async () => {
  const code = await run(
    `export const A = () => <div classStyle={styles.a} />;`,
    'class',
  );

  expect(code).toContain('class={');
  expect(code).not.toContain('className={');
});

it('keeps the style attribute for a dynamic function key', async () => {
  const code = await run(
    `export const A = () => <div classStyle={[styles.a, styles.dyn(1)]} />;`,
    'class',
  );

  expect(code).toContain('class={');
  expect(code).toContain('style={{');
  expect(code).not.toContain('className={');
});

it('merges an existing attribute written under the configured name', async () => {
  const code = await run(
    `export const A = () => <div class="kept" classStyle={styles.a} />;`,
    'class',
  );

  expect(code).toContain('class={');
  expect(code).toContain('kept');
  expect(code).not.toContain('className={');
});
