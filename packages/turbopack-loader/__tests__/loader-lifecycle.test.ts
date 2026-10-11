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
