jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import type { unpluginFactory as Factory } from '../src/core';

type Plugin = {
  transform: (this: unknown, code: string, id: string) => Promise<unknown>;
  __plumeriaInternal: {
    cssLookup: Map<string, string>;
    setDev: (value: boolean) => void;
    setRoot: (root: string) => void;
  };
};

const ID = `${__dirname}/theme-hmr-fixture.tsx`;
const CSS_ID = ID.replace(/\.tsx$/, '.zero.css');

beforeEach(() => {
  jest.resetModules();
});

const devSession = () => {
  const { unpluginFactory } = require('../src/core') as {
    unpluginFactory: typeof Factory;
  };

  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as unknown as Plugin;
  plugin.__plumeriaInternal.setDev(true);
  plugin.__plumeriaInternal.setRoot(__dirname);

  return async (source: string): Promise<string> => {
    await plugin.transform.call({ addWatchFile: () => {} }, source, ID);
    return plugin.__plumeriaInternal.cssLookup.get(CSS_ID) ?? '';
  };
};

type ThemeArgs = {
  selector?: string;
  key?: string;
  default?: string;
  theme?: string;
};

const moduleWith = (args: ThemeArgs = {}): string => {
  const {
    selector = '.dark',
    key = 'textColor',
    default: def = 'black',
    theme = 'white',
  } = args;
  return `import * as css from '@plumeria/core';
const theme = css.createTheme('${selector}', {
  ${key}: { default: '${def}', theme: '${theme}' },
});
const styles = css.create({ box: { color: theme.${key} } });
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

const expectNoDanglingReference = (css: string): void => {
  for (const varName of referencedIn(css)) {
    expect(declarersOf(css, varName).length).toBeGreaterThan(0);
  }
};

describe('createTheme edits in dev', () => {
  it('gives the new selector a variable of its own', async () => {
    const compile = devSession();

    const first = await compile(moduleWith({ selector: '.dark' }));
    const [oldVar] = varsIn(first);

    const second = await compile(moduleWith({ selector: '.night' }));
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(themeSelectorsOf(second, newVar)).toEqual(['.night']);
    expect(themeSelectorsOf(second, oldVar)).toEqual(['.dark']);
    expect(referencedIn(second)).toContain(newVar);
    expectOneSelectorPerVariable(second);
    expectNoDanglingReference(second);
  });

  it('separates a class selector from the at-rule that replaced it', async () => {
    const compile = devSession();

    const first = await compile(moduleWith({ selector: '.dark' }));
    const [oldVar] = varsIn(first);

    const second = await compile(
      moduleWith({ selector: '@media (prefers-color-scheme: dark)' }),
    );
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(themeSelectorsOf(second, newVar)).toEqual([
      '@media (prefers-color-scheme: dark)',
    ]);
    expect(themeSelectorsOf(second, oldVar)).toEqual(['.dark']);
    expectOneSelectorPerVariable(second);
  });

  it('separates an at-rule from the class selector that replaced it', async () => {
    const compile = devSession();

    const first = await compile(
      moduleWith({ selector: '@media (prefers-color-scheme: dark)' }),
    );
    const [oldVar] = varsIn(first);

    const second = await compile(moduleWith({ selector: '.dark' }));
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(themeSelectorsOf(second, newVar)).toEqual(['.dark']);
    expectOneSelectorPerVariable(second);
  });

  it('keeps one selector per variable across repeated selector edits', async () => {
    const compile = devSession();

    await compile(moduleWith({ selector: '.dark' }));
    await compile(moduleWith({ selector: '.night' }));
    await compile(moduleWith({ selector: '[data-theme="dark"]' }));
    const last = await compile(moduleWith({ selector: '.dusk' }));

    expect(varsIn(last)).toHaveLength(4);
    expectOneSelectorPerVariable(last);
    expectNoDanglingReference(last);

    const current = referencedIn(last).filter(
      (name) => themeSelectorsOf(last, name)[0] === '.dusk',
    );
    expect(current).toHaveLength(1);
  });

  it('renames the variable when the theme value changes', async () => {
    const compile = devSession();

    const first = await compile(moduleWith({ theme: 'white' }));
    const [oldVar] = varsIn(first);

    const second = await compile(moduleWith({ theme: 'ivory' }));
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(second).toContain('ivory');
    expect(themeSelectorsOf(second, newVar)).toEqual(['.dark']);
    expectOneSelectorPerVariable(second);
  });

  it('renames the variable when the default value changes', async () => {
    const compile = devSession();

    const first = await compile(moduleWith({ default: 'black' }));
    const [oldVar] = varsIn(first);

    const second = await compile(moduleWith({ default: 'navy' }));
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(declarersOf(second, newVar)).toEqual([':where(:root)', '.dark']);
    expectOneSelectorPerVariable(second);
  });

  it('renames the variable when a key is renamed', async () => {
    const compile = devSession();

    const first = await compile(moduleWith({ key: 'textColor' }));
    expect(first).toContain('-text-color');

    const second = await compile(moduleWith({ key: 'fgColor' }));
    const renamed = varsIn(second).find((name) =>
      name.endsWith('-fg-color'),
    ) as string;

    expect(themeSelectorsOf(second, renamed)).toEqual(['.dark']);
    expectOneSelectorPerVariable(second);
  });

  it('keeps serving a theme the module no longer declares', async () => {
    const compile = devSession();

    const first = await compile(moduleWith());
    const [varName] = varsIn(first);

    const second = await compile(
      `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: 'red' } });
export const Box = () => <div classStyle={styles.box} />;
`,
    );

    expect(second).toContain('red');
    expect(declarersOf(second, varName)).toEqual([':where(:root)', '.dark']);
    expectNoDanglingReference(second);
  });

  it('gives two selectors with one value object a variable each', async () => {
    const compile = devSession();

    const css = await compile(
      `import * as css from '@plumeria/core';
const dark = css.createTheme('.dark', {
  textColor: { default: 'black', theme: 'white' },
});
const sepia = css.createTheme('.sepia', {
  textColor: { default: 'black', theme: 'white' },
});
const styles = css.create({
  a: { color: dark.textColor },
  b: { backgroundColor: sepia.textColor },
});
export const Box = () => <div classStyle={[styles.a, styles.b]} />;
`,
    );

    expect(varsIn(css)).toHaveLength(2);
    expect(
      varsIn(css)
        .map((name) => themeSelectorsOf(css, name)[0])
        .sort(),
    ).toEqual(['.dark', '.sepia']);
    expectOneSelectorPerVariable(css);
  });

  it('leaves a hand-written custom property alone', async () => {
    const compile = devSession();

    const source = (selector: string) => `import * as css from '@plumeria/core';
const theme = css.createTheme('${selector}', {
  textColor: { default: 'black', theme: 'white' },
});
const styles = css.create({
  box: { '--gap': '4px', color: theme.textColor, margin: 'var(--gap)' },
});
export const Box = () => <div classStyle={styles.box} />;
`;

    await compile(source('.dark'));
    const second = await compile(source('.night'));

    expect(second).toContain('--gap: 4px');
    expectOneSelectorPerVariable(second);
  });

  it('keeps class rules emitted by an earlier compile', async () => {
    const compile = devSession();

    const first = await compile(moduleWith({ default: 'black' }));
    const boxClass = first.match(/\.(x[0-9a-z]+)/)?.[1];
    expect(boxClass).toBeDefined();

    const second = await compile(moduleWith({ default: 'navy' }));
    expect(second).toContain(boxClass as string);
    expectNoDanglingReference(second);
  });
});
