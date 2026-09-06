jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockCompileCSS = jest.fn(() => '');
jest.mock('@plumeria/compiler', () => ({ compileCSS: mockCompileCSS }));
jest.mock('../src/file-lock', () => ({
  acquireLock: async () => {},
  releaseLockSync: () => {},
}));
const mockWrite = jest.fn();
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  const shared = (p: unknown) =>
    typeof p === 'string' && p.includes('zero-virtual.css');
  return {
    ...actual,
    readFileSync: (p: string, ...args: unknown[]) => {
      if (shared(p)) throw new Error('ENOENT');
      return actual.readFileSync(p, ...args);
    },
    writeFileSync: (p: string, ...args: unknown[]) =>
      shared(p) ? mockWrite(p, ...args) : actual.writeFileSync(p, ...args),
    renameSync: (a: string, b: string) =>
      shared(a) ? undefined : actual.renameSync(a, b),
  };
});
const loader: typeof import('../src/index').default =
  require('../src/index').default;
const run = (src: string, opts = {}): Promise<string> =>
  new Promise((resolve, reject) => {
    loader
      .call(
        {
          resourcePath: `${__dirname}/audit-fixture.tsx`,
          context: __dirname,
          rootContext: __dirname,
          getOptions: () => opts,
          async: () => (err, out) => (err ? reject(err) : resolve(out!)),
          addDependency: () => {},
          clearDependencies: () => {},
        },
        src,
      )
      .catch(reject);
  });
const pre = `import * as css from '@plumeria/core';`;
it('retains other declarators', async () => {
  const out = await run(
    pre +
      `const styles = css.create({box:{color:'red'}}), keep = 42; export const el = <div classStyle={styles.box}>{keep}</div>;`,
  );
  expect(out).toContain('keep = 42');
});
it('retains separately exported binding', async () => {
  const out = await run(
    pre + `const styles = css.create({box:{color:'red'}}); export {styles};`,
  );
  expect(out).toMatch(/const styles\s*=/);
});
it('does not replace shadowed bindings', async () => {
  const out = await run(
    pre +
      `const styles = css.create({box:{color:'red'}}); export function f(styles: {box:string}) {return styles.box;}`,
  );
  expect(out).toContain('return styles.box');
});
it('compiles a style array that contains a hole', async () => {
  const out = await run(
    pre +
      `const styles = css.create({box:{color:'red'}}); export const el = <div classStyle={[, styles.box]} />;`,
  );
  expect(out).toContain('className=');
});
it('production retries after transient failure', async () => {
  const prior = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: 'production' });
  try {
    mockCompileCSS.mockImplementationOnce(() => {
      throw new Error('transient');
    });
    const src =
      pre +
      `const styles = css.create({box:{color:'red'}}); export const el = <div classStyle={styles.box} />;`;
    await expect(run(src)).rejects.toThrow('transient');
    await expect(run(src)).resolves.toContain('className=');
  } finally {
    Object.assign(process.env, { NODE_ENV: prior });
  }
});
