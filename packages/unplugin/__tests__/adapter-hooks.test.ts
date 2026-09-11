// The bundler adapters wrap the core plugin rather than reimplement it, so
// each one is only correct while three things hold: the bundler's root and
// mode reach the core plugin, the wrapped `transform` hands back exactly what
// the core produced, and the virtual stylesheet the core registered is
// resolvable and loadable through that bundler's own hooks.
//
// Nothing here needs a real Vite or webpack. Both adapters take a plugin
// object and a context object, so a literal stands in for either bundler.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const CARD = path.join(DIR, 'Card.tsx');
const CARD_CSS = `${path.join(DIR, 'Card')}.zero.css`;

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import vite from '../src/vite';
import { attachWebpackHooks } from '../src/webpack';
import { unpluginFactory } from '../src/core';

const SOURCE = `
import * as css from '@plumeria/core';
const styles = css.create({ box: { color: 'teal' } });
export const Card = () => <div classStyle={styles.box} />;
`;

beforeAll(() => {
  fs.writeFileSync(CARD, SOURCE);
  mockedGlob.globSync.mockReturnValue([CARD]);
});

afterAll(() => {
  fs.rmSync(DIR, { recursive: true, force: true });
});

const transform = (plugin: any) =>
  plugin.transform.call({ addWatchFile() {} }, SOURCE, CARD);

describe('the vite adapter', () => {
  it('carries the resolved root and command into the core plugin', () => {
    const plugin = vite() as any;
    plugin.configResolved({ root: DIR, command: 'serve' });

    expect(plugin.__plumeriaInternal).toBeDefined();
    expect(plugin.load(CARD_CSS)).toBe(null);
  });

  it('hands back what the core transform produced', async () => {
    const plugin = vite() as any;
    plugin.configResolved({ root: DIR, command: 'serve' });
    const adapted = await transform(plugin);

    const core = unpluginFactory(undefined, {
      framework: 'vite',
    } as never) as any;
    core.__plumeriaInternal.setRoot(DIR);
    const raw = await transform(core);

    expect(adapted.code).toBe(raw.code);
  });

  it('serves the virtual stylesheet it registered', async () => {
    const plugin = vite() as any;
    plugin.configResolved({ root: DIR, command: 'serve' });
    await transform(plugin);

    expect(plugin.resolveId(CARD_CSS)).toBe(CARD_CSS);
    expect(plugin.load(CARD_CSS)).toContain('color: teal');
    expect(plugin.load(`${CARD_CSS}?direct`)).toContain('color: teal');
  });

  it('keeps the core out of dependency optimization', () => {
    const plugin = vite() as any;
    const config = plugin.config({}, { command: 'build' });

    expect(config.optimizeDeps.exclude).toContain('@plumeria/core');
    expect(config.build.cssCodeSplit).toBe(false);
  });
});

describe('the webpack adapter', () => {
  const attach = () =>
    attachWebpackHooks(unpluginFactory(undefined, {} as never));

  const compilerWith = (rules: unknown[]) => ({
    isChild: () => false,
    context: DIR,
    options: { mode: 'development', module: { rules } },
  });

  it('selects source modules and virtual stylesheets apart', () => {
    const plugin = attach();

    expect(plugin.transformInclude(CARD)).toBe(true);
    expect(plugin.transformInclude(`${DIR}/node_modules/a.tsx`)).toBe(false);
    expect(plugin.loadInclude(CARD_CSS)).toBe(true);
    expect(plugin.loadInclude(`${CARD_CSS}?t=1`)).toBe(true);
    expect(plugin.loadInclude(CARD)).toBe(false);
  });

  it('resolves a virtual stylesheet against its importer', async () => {
    const plugin = attach();
    plugin.webpack(compilerWith([]));
    await transform(plugin);

    expect(plugin.resolveId(CARD_CSS)).toBe(CARD_CSS);
    expect(plugin.resolveId('./Card.zero.css', CARD)).toBe(CARD_CSS);
    expect(plugin.resolveId('./Nothing.zero.css', CARD)).toBe(null);
  });

  it('loads the stylesheet as css and depends on the module behind it', async () => {
    const plugin = attach();
    plugin.webpack(compilerWith([]));
    await transform(plugin);

    const dependencies: string[] = [];
    const loaded = plugin.load.call(
      { addDependency: (file: string) => dependencies.push(file) },
      CARD_CSS,
    );

    expect(loaded).toEqual({
      code: expect.stringContaining('color: teal'),
      moduleType: 'css',
    });
    expect(dependencies).toEqual([CARD]);
    expect(plugin.load.call({}, `${DIR}/Absent.zero.css`)).toBe(null);
  });

  it('clones the existing css rule for virtual stylesheets', () => {
    const cssRule = { test: /\.css$/, use: ['style-loader', 'css-loader'] };
    const rules: any[] = [cssRule, { test: /\.tsx$/, use: ['swc-loader'] }];
    attach().webpack(compilerWith(rules));

    expect(rules).toHaveLength(3);
    expect(rules[0]).toMatchObject({
      use: cssRule.use,
      type: 'css/auto',
      enforce: 'pre',
    });
    expect(rules[0].test.test(CARD_CSS)).toBe(true);
    expect(rules[0].test.test(`${CARD_CSS}?t=1`)).toBe(true);
    expect(rules[0].test.test(CARD)).toBe(false);
  });

  it('ignores a child compiler', () => {
    const rules: any[] = [{ test: /\.css$/, use: ['css-loader'] }];
    attach().webpack({ ...compilerWith(rules), isChild: () => true });

    expect(rules).toHaveLength(1);
  });
});

// Rollup, esbuild, rspack and bun take the core plugin as it is, with no
// adapter in front of it, so its own virtual-module hooks are the whole
// contract for those bundlers. The `/`-rooted spelling is the one the
// transform writes into the module it compiles; the relative spelling is what
// a bundler hands back after resolving that import against the importer.
describe('the core plugin', () => {
  const core = () => {
    const plugin = unpluginFactory(undefined, {
      framework: 'vite',
    } as never) as any;
    plugin.__plumeriaInternal.setRoot(DIR);
    return plugin;
  };

  it('keeps a rooted virtual stylesheet as written', () => {
    const plugin = core();

    expect(plugin.resolveId('/Card.zero.css')).toBe('/Card.zero.css');
    expect(plugin.resolveId('/Card.zero.css?t=1')).toBe('/Card.zero.css?t=1');
  });

  it('resolves a relative virtual stylesheet against its importer', () => {
    const plugin = core();

    expect(plugin.resolveId('./Card.zero.css', CARD)).toBe(CARD_CSS);
    expect(plugin.resolveId('./Card.zero.css?t=1', CARD)).toBe(
      `${CARD_CSS}?t=1`,
    );
  });

  it('passes over anything that is not a virtual stylesheet', () => {
    const plugin = core();

    expect(plugin.resolveId(CARD, CARD)).toBe(null);
    expect(plugin.loadInclude(CARD)).toBe(false);
    expect(plugin.loadInclude(CARD_CSS)).toBe(true);
    expect(plugin.transformInclude(CARD)).toBe(true);
  });

  it('serves the stylesheet under both spellings of its module', async () => {
    const plugin = core();
    await transform(plugin);

    const rooted = `/${path.relative(DIR, CARD_CSS)}`;
    expect(plugin.load(CARD_CSS)).toContain('color: teal');
    expect(plugin.load(rooted)).toContain('color: teal');
    expect(plugin.load(`${rooted}?t=1`)).toContain('color: teal');
  });

  it('serves an empty stylesheet for a module it never compiled', () => {
    expect(core().load(`${DIR}/Absent.zero.css`)).toBe('');
  });
});
