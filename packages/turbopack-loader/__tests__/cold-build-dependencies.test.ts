// Regression harness for the watch set the loader registers per file.
//
// Two kinds of edge reach one compiled file, and HMR is only correct if both
// are registered and nothing else is:
//
//   Forward: the modules this file imports, and their transitive dependencies,
//            because a style defined there is inlined here.
//   Reverse: the files that render this component and pass it a style through
//            a prop, because those props are what fill this file's lookup map.
//
// The set has to stay exactly that. Registering the repopulated global
// dependency closure instead would make the watch set huge and unstable and
// trigger full reloads, so the unrelated files below must never appear.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const TOKENS = path.join(DIR, 'tokens.ts');
const STYLES = path.join(DIR, 'styles.ts');
const LEAF = path.join(DIR, 'Leaf.tsx');
const CARD = path.join(DIR, 'Card.tsx');
const PARENT = path.join(DIR, 'Parent.tsx');
const UNRELATED = path.join(DIR, 'Unrelated.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import loader from '../src/index';

const files: Record<string, string> = {
  [TOKENS]: `
export const brand = 'rebeccapurple';
`,
  [STYLES]: `
import * as css from '@plumeria/core';
import { brand } from './tokens';
export const styles = css.create({
  a: { color: brand },
  b: { color: 'teal' },
});
`,
  [LEAF]: `
import * as css from '@plumeria/core';
export const Leaf = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
`,
  [CARD]: `
import '@plumeria/core';
import { styles } from './styles';
export const Card = () => <div classStyle={styles.b} />;
`,
  [PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
export const Parent = () => <Leaf styleArray={styles.a} />;
`,
  [UNRELATED]: `
import * as css from '@plumeria/core';
const other = css.create({ z: { color: 'olive' } });
export const Unrelated = () => <span classStyle={other.z} />;
`,
};

const deps = new Map<string, string[]>();

const run = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const seen: string[] = [];
    deps.set(file, seen);
    const ctx = {
      resourcePath: file,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: (p: string) => seen.push(p),
      clearDependencies: () => (seen.length = 0),
    };
    (loader as any).call(ctx, files[file]);
  });

const watchedBy = async (file: string) => {
  await run(file);
  return [...new Set(deps.get(file))].sort();
};

beforeAll(async () => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
  // The reverse edges only exist once the parent has been scanned.
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

it('registers transitive dependencies on first cold load', async () => {
  expect(await watchedBy(CARD)).toEqual([CARD, STYLES, TOKENS].sort());
});
