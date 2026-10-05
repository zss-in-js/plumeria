import * as path from 'path';
import { createTransformer } from '../src';

const rootDir = path.resolve(__dirname, '..');
const filename = path.join(rootDir, 'fixture.tsx');
const jestOptions = {
  config: { rootDir },
  supportsStaticESM: false,
} as unknown as Parameters<
  NonNullable<ReturnType<typeof createTransformer>['process']>
>[2];

const source = `import * as css from '@plumeria/core';
const styles = css.create({ box: { padding: 16, color: 'red' } });
export const A = ({ n }: { n: number }) => <div classStyle={styles.box}>{n}</div>;
`;

const run = (src: string, options = {}) => {
  const transformer = createTransformer(options);
  return transformer.process!(src, filename, jestOptions);
};

it('compiles the styling prop away and emits CommonJS', () => {
  const { code } = run(source);

  expect(code).toMatch(/className: "\S+ \S+"/);
  expect(code).not.toMatch(/classStyle/);
  expect(code).not.toMatch(/^import /m);
});

it('passes a file without Plumeria to swc unchanged in meaning', () => {
  const { code } = run('export const n: number = 1;\n');

  expect(code).toMatch(/exports\.n|n = 1/);
  expect(code).not.toMatch(/: number/);
});

it('honours a custom styleProp', () => {
  const { code } = run(source.replace('classStyle', 'sx'), {
    styleProp: 'sx',
  });

  expect(code).toMatch(/className: "\S+ \S+"/);
  expect(code).not.toMatch(/\bsx:/);
});

it('keys the cache on the compiled output', () => {
  const transformer = createTransformer();
  const key = (src: string) =>
    transformer.getCacheKey!(src, filename, jestOptions);

  expect(key(source)).toBe(key(source));
  expect(key(source)).not.toBe(key(source.replace("'red'", "'blue'")));
  expect(key(source)).toBe(key(`${source}\n`.trimEnd() + '\n'));
});

it('reuses the output compiled for the cache key', () => {
  const transformer = createTransformer();
  transformer.getCacheKey!(source, filename, jestOptions);

  expect(transformer.process!(source, filename, jestOptions).code).toBe(
    createTransformer().process!(source, filename, jestOptions).code,
  );
});
