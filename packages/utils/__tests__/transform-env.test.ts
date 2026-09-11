// The two callers hand `transformSource` different environments, and the
// difference is not cosmetic: the plugin compiles every file the same way in
// either mode, while the loader leaves the stylesheet to a whole-project scan
// once it is building for production. Both axes used to be covered only by
// accident -- each bundler's suite ran the shared code under its own flags and
// nothing asserted what the flags changed. These name the difference.
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import * as path from 'path';
import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const FILE = `${__dirname}/fixture.tsx`;

const SOURCE = `
import * as css from '@plumeria/core';
export const styles = css.create({ box: { color: 'teal' } });
export const A = () => <div classStyle={styles.box} />;
`;

const run = (overrides: { isDev?: boolean; collectOndemandSheets?: boolean }) =>
  transformSource({
    source: SOURCE,
    moduleId: FILE,
    filePath: FILE,
    root: process.cwd(),
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
    ...overrides,
  });

describe('transform: the isDev axis', () => {
  it('empties an exported style binding when it is not a dev build', async () => {
    const { code } = await run({ isDev: false });

    expect(code).toContain('export const styles = "";');
    expect(code).not.toContain('new Proxy');
  });

  it('guards an exported style binding on a dev build', async () => {
    const { code } = await run({ isDev: true });

    expect(code).toContain('new Proxy');
    expect(code).toContain('const k=new Set(["box"])');
    expect(code).toContain('was read at runtime');
  });

  it('names the defining file relative to the root it was given', async () => {
    const { code } = await run({ isDev: true });

    expect(code).toContain(path.relative(process.cwd(), FILE));
  });

  it('applies the class either way', async () => {
    const dev = await run({ isDev: true });
    const build = await run({ isDev: false });

    expect(dev.code).toContain('className=');
    expect(build.code).toContain('className=');
  });
});

describe('transform: the on-demand sheet axis', () => {
  it('collects the stylesheet when the caller asks for it', async () => {
    const { sheets } = await run({ collectOndemandSheets: true });

    expect(sheets.join('')).toContain('color: teal');
  });

  it('leaves the stylesheet to the caller when it does not', async () => {
    const { code, sheets } = await run({ collectOndemandSheets: false });

    expect(sheets).toEqual([]);
    expect(code).toContain('className=');
  });
});
