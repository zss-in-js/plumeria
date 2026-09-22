// A component usually reaches a theme variable through a style module rather
// than the `createTheme` call itself, so the on-demand pass has to look the
// variable up in the project-wide theme table to find its definition. That
// lookup enumerates the table, which only holds the project's entries when the
// scan hands them back as own properties: a table layered on a prototype chain
// answers a key lookup but reports no keys, and the `:where(:root)` and theme
// selector blocks silently stop being emitted while the compiled code keeps
// referencing the variables.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const THEME = path.join(DIR, 'theme.ts');
const STYLES = path.join(DIR, 'styles.ts');
const COMPONENT = path.join(DIR, 'Component.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const env = (source: string, filePath: string) => ({
  source,
  moduleId: filePath,
  filePath,
  root: process.cwd(),
  styleProp: DEFAULT_STYLE_PROP,
  propertyPolicy: undefined,
  isDev: false,
  collectOndemandSheets: true,
  addDependency: () => {},
});

const files: Record<string, string> = {
  [THEME]: `
import * as css from '@plumeria/core';
export const theme = css.createTheme('.dark', {
  textPrimary: { default: '#0b0b0b', theme: '#f4f4f5' },
  iconColor: { default: '#71717a', theme: '#e4e4e7' },
});
`,
  [STYLES]: `
import * as css from '@plumeria/core';
import { theme } from './theme';
export const styles = css.create({
  label: { color: theme.textPrimary },
});
`,
  [COMPONENT]: `
import '@plumeria/core';
import { styles } from './styles';
export const Component = () => <span classStyle={styles.label} />;
`,
};

const run = async (file: string) => {
  const result = await transformSource(env(files[file], file));
  return { code: result.code, css: (result.sheets ?? []).join('\n') };
};

const referenced = (value: string) => [
  ...new Set([...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])),
];

const defined = (value: string) => [
  ...new Set([...value.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1])),
];

beforeAll(() => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('transform: a theme variable reached through a style module', () => {
  it('emits the theme blocks alongside the rule that uses them', async () => {
    const { css } = await run(COMPONENT);

    expect(css).toContain(':where(:root)');
    expect(css).toContain('.dark');
    expect(css).toContain('#0b0b0b');
    expect(css).toContain('#f4f4f5');
  });

  it('defines every custom property the output references', async () => {
    const { code, css } = await run(COMPONENT);
    const used = referenced(`${code}\n${css}`);

    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !defined(css).includes(name))).toEqual([]);
  });

  it('leaves the unused theme variable out', async () => {
    const { css } = await run(COMPONENT);

    expect(css).not.toContain('#71717a');
    expect(css).not.toContain('#e4e4e7');
  });
});
