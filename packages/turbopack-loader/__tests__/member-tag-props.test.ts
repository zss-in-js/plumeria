import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as glob from '@rust-gear/glob';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const LEAF = path.join(DIR, 'logo.tsx');
const MID = path.join(DIR, 'social.tsx');
const TOP = path.join(DIR, 'icons.tsx');
const PARENT = path.join(DIR, 'Home.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = glob as jest.Mocked<typeof glob>;

import loader from '../src/index';

// `PlumeriaLogo` is declared here and only reachable from the parent through
// namespace objects, so nothing but the leaf itself names the styling channel.
const files: Record<string, string> = {
  [LEAF]: `
import * as css from '@plumeria/core';
export function PlumeriaLogo({ styleArray }: { styleArray?: css.Style }) {
  return <svg classStyle={styleArray} />;
}
`,
  [MID]: `
import '@plumeria/core';
import { PlumeriaLogo } from './logo';
export const Social = { PlumeriaLogo };
`,
  [TOP]: `
import '@plumeria/core';
import { Social } from './social';
export const Icons = { Social };
`,
  [PARENT]: `
import * as css from '@plumeria/core';
import * as ns from './icons';
import { Icons } from './icons';

const styles = css.create({ a: { color: 'red' }, b: { color: 'blue' } });

export const Home = () => (
  <div>
    <Icons.Social.PlumeriaLogo styleArray={styles.a} />
    <ns.Icons.Social.PlumeriaLogo styleArray={styles.b} />
  </div>
);
`,
};

const run = (file: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const ctx = {
      resourcePath: file,
      async: () => (err: Error | null, content?: string) =>
        err ? reject(err) : resolve(content as string),
      addDependency: () => {},
      clearDependencies: () => {},
    };
    (loader as any).call(ctx, files[file]);
  });

beforeAll(() => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files) as never);
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('turbopack-loader: styles passed to a member-chain tag', () => {
  it('replaces the parent props with lookup keys', async () => {
    const code = await run(PARENT);
    expect(code).toMatch(/<Icons\.Social\.PlumeriaLogo styleArray={"\w+"} \/>/);
    expect(code).toMatch(
      /<ns\.Icons\.Social\.PlumeriaLogo styleArray={"\w+"} \/>/,
    );
  });

  it('compiles the leaf component with both styles in its lookup map', async () => {
    await run(PARENT);
    const code = await run(LEAF);
    const map = code.match(/\{("\w+":"\w+",?)+\}/)?.[0];
    expect(map && Object.keys(JSON.parse(map))).toHaveLength(2);
  });
});
