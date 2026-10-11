import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import cssLoader from '../src/css';

const projectDir = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-theme-hmr-')),
);

const compileWith = (files: Record<string, string>): Promise<string> =>
  new Promise((resolve, reject) => {
    for (const [name, source] of Object.entries(files)) {
      fs.writeFileSync(path.join(projectDir, name), source, 'utf-8');
    }
    cssLoader.call({
      async: () => (err: Error | null, css?: string) =>
        err ? reject(err) : resolve(css as string),
      addDependency: () => {},
    });
  });

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

describe('createTheme edits compiled into the virtual CSS', () => {
  afterAll(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    for (const name of fs.readdirSync(projectDir)) {
      fs.rmSync(path.join(projectDir, name));
    }
    jest.spyOn(process, 'cwd').mockReturnValue(projectDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gives the new selector a variable of its own and drops the old one', async () => {
    const first = await compileWith({
      'theme.tsx': moduleWith({ selector: '.dark' }),
    });
    const [oldVar] = varsIn(first);

    const second = await compileWith({
      'theme.tsx': moduleWith({ selector: '.night' }),
    });
    const newVar = varsIn(second).find((name) => name !== oldVar) as string;

    expect(themeSelectorsOf(second, newVar)).toEqual(['.night']);
    expect(varsIn(second)).not.toContain(oldVar);
    expect(referencedIn(second)).toContain(newVar);
    expectOneSelectorPerVariable(second);
  });

  it('separates a class selector from the at-rule that replaced it', async () => {
    await compileWith({ 'theme.tsx': moduleWith({ selector: '.dark' }) });

    const second = await compileWith({
      'theme.tsx': moduleWith({
        selector: '@media (prefers-color-scheme: dark)',
      }),
    });
    const [newVar] = varsIn(second);

    expect(themeSelectorsOf(second, newVar)).toEqual([
      '@media (prefers-color-scheme: dark)',
    ]);
    expect(second).not.toContain('.dark');
    expectOneSelectorPerVariable(second);
  });

  it('keeps only the latest selector across repeated selector edits', async () => {
    await compileWith({ 'theme.tsx': moduleWith({ selector: '.dark' }) });
    await compileWith({ 'theme.tsx': moduleWith({ selector: '.night' }) });
    const last = await compileWith({
      'theme.tsx': moduleWith({ selector: '.dusk' }),
    });

    expect(varsIn(last)).toHaveLength(1);
    expect(themeSelectorsOf(last, varsIn(last)[0])).toEqual(['.dusk']);
  });

  it('replaces the class rule when the theme value changes', async () => {
    await compileWith({ 'theme.tsx': moduleWith({ default: 'black' }) });
    const second = await compileWith({
      'theme.tsx': moduleWith({ default: 'navy' }),
    });

    expect(second).toContain('navy');
    expect(second).not.toContain('black');
    expect(second.match(/\.x[0-9a-z]+ \{\n {2}color/g)).toHaveLength(1);
  });

  it('leaves the theme of another source file alone', async () => {
    const both = await compileWith({
      'theme-a.tsx': moduleWith({ selector: '.dark' }),
      'theme-b.tsx': moduleWith({ selector: '.sepia' }),
    });

    expect(both).toContain('.dark');
    expect(both).toContain('.sepia');
    expectOneSelectorPerVariable(both);

    const recompiled = await compileWith({
      'theme-a.tsx': moduleWith({ selector: '.dusk' }),
    });
    expect(recompiled).toContain('.sepia');
    expect(recompiled).not.toContain('.dark');
    expectOneSelectorPerVariable(recompiled);
  });
});
