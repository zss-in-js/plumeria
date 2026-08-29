jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import * as fs from 'fs';
import * as path from 'path';

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');

type Loader = (this: unknown, source: string) => Promise<void>;

const compileIn = (fixture: string) => {
  const loader = require('../src/index').default as Loader;

  return (source: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const context = {
        resourcePath: path.join(__dirname, fixture),
        async:
          () =>
          (err: Error | null): void => {
            if (err) reject(err);
            else resolve(fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8'));
          },
        addDependency: () => {},
        clearDependencies: () => {},
      };

      loader.call(context, source).catch(reject);
    });
};

type ThemeArgs = { selector?: string; default?: string; theme?: string };

const moduleWith = (args: ThemeArgs = {}): string => {
  const { selector = '.dark', default: def = 'black', theme = 'white' } = args;
  return `import * as css from '@plumeria/core';
const theme = css.createTheme('${selector}', {
  textColor: { default: '${def}', theme: '${theme}' },
});
const styles = css.create({ box: { color: theme.textColor } });
export const Box = () => <div classStyle={styles.box} />;
`;
};

const VAR = /--x[0-9a-z]{7}-[a-z-]+/g;

const varsIn = (css: string): string[] => [...new Set(css.match(VAR) ?? [])];

const referencedIn = (css: string): string[] => [
  ...new Set(
    (css.match(/var\(--x[0-9a-z]{7}-[a-z-]+/g) ?? []).map((ref) =>
      ref.slice(4),
    ),
  ),
];

const declarersOf = (css: string, varName: string): string[] => {
  const found: string[] = [];
  for (const chunk of css.split(/(?<=\})/)) {
    const head = chunk.match(/([^{}]+)\{/);
    if (head && new RegExp(`${varName}\\s*:`).test(chunk)) {
      found.push(head[1].trim());
    }
  }
  return found;
};

const themeSelectorsOf = (css: string, varName: string): string[] =>
  declarersOf(css, varName).filter((selector) => selector !== ':where(:root)');

const expectOneSelectorPerVariable = (css: string): void => {
  for (const varName of varsIn(css)) {
    expect(themeSelectorsOf(css, varName)).toHaveLength(1);
  }
};

describe('createTheme edits in the shared dev CSS file', () => {
  let backup: string;

  beforeEach(() => {
    jest.resetModules();
    backup = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
    fs.writeFileSync(VIRTUAL_FILE_PATH, '', 'utf-8');
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
  });

  afterEach(() => {
    fs.writeFileSync(VIRTUAL_FILE_PATH, backup, 'utf-8');
  });

  it('gives the new selector a variable of its own', async () => {
    const compile = compileIn('theme-hmr-fixture.tsx');

    const first = await compile(moduleWith({ selector: '.dark' }));
    const [oldVar] = varsIn(first);

    const second = await compile(moduleWith({ selector: '.night' }));
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(themeSelectorsOf(second, newVar)).toEqual(['.night']);
    expect(themeSelectorsOf(second, oldVar)).toEqual(['.dark']);
    expect(referencedIn(second)).toContain(newVar);
    expectOneSelectorPerVariable(second);
  });

  it('separates a class selector from the at-rule that replaced it', async () => {
    const compile = compileIn('theme-hmr-fixture.tsx');

    const first = await compile(moduleWith({ selector: '.dark' }));
    const [oldVar] = varsIn(first);

    const second = await compile(
      moduleWith({ selector: '@media (prefers-color-scheme: dark)' }),
    );
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(themeSelectorsOf(second, newVar)).toEqual([
      '@media (prefers-color-scheme: dark)',
    ]);
    expectOneSelectorPerVariable(second);
  });

  it('keeps one selector per variable across repeated selector edits', async () => {
    const compile = compileIn('theme-hmr-fixture.tsx');

    await compile(moduleWith({ selector: '.dark' }));
    await compile(moduleWith({ selector: '.night' }));
    const last = await compile(moduleWith({ selector: '.dusk' }));

    expect(varsIn(last)).toHaveLength(3);
    expectOneSelectorPerVariable(last);
  });

  it('keeps class rules emitted by an earlier compile', async () => {
    const compile = compileIn('theme-hmr-fixture.tsx');

    const first = await compile(moduleWith({ default: 'black' }));
    const boxClass = first.match(/\.(x[0-9a-z]+) \{\n {2}color/)?.[1];
    expect(boxClass).toBeDefined();

    const second = await compile(moduleWith({ default: 'navy' }));
    expect(second).toContain(boxClass as string);
  });

  it('leaves the theme of another source file alone', async () => {
    const inA = compileIn('theme-hmr-a.tsx');
    const inB = compileIn('theme-hmr-b.tsx');

    await inA(moduleWith({ selector: '.dark' }));
    const afterB = await inB(moduleWith({ selector: '.sepia' }));

    expect(afterB).toContain('.dark');
    expect(afterB).toContain('.sepia');
    expectOneSelectorPerVariable(afterB);

    const recompiled = await inA(moduleWith({ selector: '.dark' }));
    expect(recompiled).toContain('.sepia');
    expectOneSelectorPerVariable(recompiled);
  });
});
