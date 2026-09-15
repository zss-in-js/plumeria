// A component can name its style prop the same as the one elements take, which
// is what the `StyleProps` reference shows. That name used to be read as the
// element's own prop wherever it was passed, so the call site resolved the
// style to classes and renamed the attribute, and the component it was handed
// to never saw it: the styles were dropped with no error.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-style-prop-'));
const STYLES = path.join(DIR, 'styles.ts');
const CARD = path.join(DIR, 'Card.tsx');
const APP = path.join(DIR, 'App.tsx');
const SAME = path.join(DIR, 'Same.tsx');
const ELEMENT = path.join(DIR, 'Element.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';
import { getStyleRecords, deepMerge } from '../src/index';

const BASE = { color: 'green', fontSize: '14px' };
const LOUD = { color: 'crimson', fontWeight: 700 };

const files: Record<string, string> = {
  [STYLES]: `
import * as css from '@plumeria/core';
export const styles = css.create(${JSON.stringify({ base: BASE, loud: LOUD })});
`,
  [CARD]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
export const Card = ({ classStyle }: { classStyle?: css.Style }) => (
  <div classStyle={[styles.base, classStyle]} />
);
`,
  [APP]: `
import '@plumeria/core';
import { styles } from './styles';
import { Card } from './Card';
export const Plain = () => <Card classStyle={styles.loud} />;
export const Conditional = ({ on }: { on: boolean }) => (
  <Card classStyle={on && styles.loud} />
);
`,
  [SAME]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
const Inline = ({ classStyle }: { classStyle?: css.Style }) => (
  <div classStyle={[styles.base, classStyle]} />
);
export const Uses = () => <Inline classStyle={styles.loud} />;
`,
  [ELEMENT]: `
import '@plumeria/core';
import { styles } from './styles';
export const Element = () => <div classStyle={styles.loud} />;
`,
};

const env = (filePath: string) => ({
  source: files[filePath],
  moduleId: filePath,
  filePath,
  root: DIR,
  styleProp: DEFAULT_STYLE_PROP,
  propertyPolicy: undefined,
  isDev: false,
  collectOndemandSheets: true,
  addDependency: () => {},
});

const run = async (filePath: string) =>
  (await transformSource(env(filePath))).code;

const classesOf = (style: Record<string, unknown>) =>
  getStyleRecords(style as never)
    .map((record) => record.hash)
    .sort()
    .join(' ');

const norm = (value: string) => value.trim().split(/\s+/).sort().join(' ');

// The applying element keeps its `className` expression on one line, so the
// attribute can be read back and evaluated against a key the call site emits.
const renderer = (code: string, index = 0) => {
  const expression = [...code.matchAll(/className=\{([\s\S]*?)\}(?= \/>)/g)][
    index
  ][1];
  return (classStyle: unknown) =>
    norm(new Function('classStyle', `return (${expression});`)(classStyle));
};

const keysOf = (code: string) =>
  [...code.matchAll(/classStyle=\{(?:[^}]*?)"(\w+)"/g)].map(
    (match) => match[1],
  );

beforeAll(() => {
  for (const [filePath, source] of Object.entries(files))
    fs.writeFileSync(filePath, source);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('transform: a component whose style prop takes the element name', () => {
  it('hands the component a key instead of resolving the style at the call site', async () => {
    const [plain] = keysOf(await run(APP));
    const render = renderer(await run(CARD));
    expect(render(plain)).toBe(norm(classesOf(deepMerge(BASE, LOUD))));
  });

  it('keeps a conditional call site on both of its branches', async () => {
    const [, conditional] = keysOf(await run(APP));
    const render = renderer(await run(CARD));
    expect(render(conditional)).toBe(norm(classesOf(deepMerge(BASE, LOUD))));
    expect(render(false)).toBe(norm(classesOf(BASE)));
  });

  it('relays to a component declared in the same file', async () => {
    const code = await run(SAME);
    const [key] = keysOf(code);
    expect(renderer(code)(key)).toBe(norm(classesOf(deepMerge(BASE, LOUD))));
  });

  it('still resolves the prop on an element to its classes', async () => {
    const code = await run(ELEMENT);
    expect(keysOf(code)).toEqual([]);
    expect(norm(code.match(/className=\{"([^"]*)"\}/)![1])).toBe(
      norm(classesOf(LOUD)),
    );
  });
});
