import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { compileCSS, optimizer } from '@plumeria/compiler';
import loader from '../src/index';
import cssLoader from '../src/css';

const projectDir = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-cross-module-project-')),
);

const sources: Record<string, string> = {
  'a.tsx':
    "import * as css from '@plumeria/core'; export const a = css.create({ box: { '@media (min-width: 600px)': { color: 'red' } } }); export const A = () => <div classStyle={a.box} />;",
  'b.tsx':
    "import * as css from '@plumeria/core'; export const b = css.create({ box: { '@supports (display: grid)': { color: 'blue' } } }); export const B = () => <div classStyle={b.box} />;",
  'view.tsx':
    "import * as css from '@plumeria/core'; import { a } from './a'; import { b } from './b'; export const View = () => <div classStyle={[a.box, b.box]} />;",
};

const transform = (name: string): Promise<string> =>
  new Promise((resolve, reject) => {
    (loader as unknown as (this: unknown, source: string) => Promise<void>)
      .call(
        {
          resourcePath: path.join(projectDir, name),
          async: () => (err: Error | null, code?: string) =>
            err ? reject(err) : resolve(code as string),
          addDependency() {},
          clearDependencies() {},
        },
        sources[name],
      )
      .catch(reject);
  });

const virtualCss = (): Promise<string> =>
  new Promise((resolve, reject) => {
    cssLoader.call({
      async: () => (err: Error | null, css?: string) =>
        err ? reject(err) : resolve(css as string),
      addDependency() {},
    });
  });

beforeAll(() => {
  for (const [name, source] of Object.entries(sources)) {
    fs.writeFileSync(path.join(projectDir, name), source);
  }
});

afterAll(() => {
  fs.rmSync(projectDir, { recursive: true, force: true });
});

it.each([
  ['a.tsx', 'b.tsx', 'view.tsx'],
  ['b.tsx', 'a.tsx', 'view.tsx'],
])(
  'emits the build stylesheet whichever module compiles first: %s, %s, %s',
  async (...order) => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
    const previousCwd = process.cwd();
    process.chdir(projectDir);
    try {
      const build = optimizer(
        compileCSS({
          cwd: projectDir,
          include: ['**/*.{js,jsx,ts,tsx}'],
          exclude: [],
        }),
      );
      for (const name of order) await transform(name);

      const dev = await virtualCss();

      expect(dev).toBe(build);
      expect(dev.indexOf('@media')).toBeLessThan(dev.indexOf('@supports'));
    } finally {
      process.chdir(previousCwd);
    }
  },
);

it('unplugin emits identical per-module CSS in dev and build for this fixture', async () => {
  const { unpluginFactory } = require('../../unplugin/src/core');
  const previousCwd = process.cwd();
  process.chdir(projectDir);
  try {
    const outputs = [];
    for (const isDev of [true, false]) {
      const plugin = unpluginFactory({ lint: false }, { framework: 'vite' });
      plugin.__plumeriaInternal.setDev(isDev);
      plugin.__plumeriaInternal.setRoot(projectDir);
      for (const name of ['b.tsx', 'a.tsx', 'view.tsx']) {
        await plugin.transform.handler.call(
          { addWatchFile() {} },
          sources[name],
          path.join(projectDir, name),
        );
      }
      outputs.push([...plugin.__plumeriaInternal.cssLookup.entries()]);
    }
    expect(outputs[0]).toEqual(outputs[1]);
  } finally {
    process.chdir(previousCwd);
  }
});
