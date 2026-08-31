import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);

// `rs.globSync` returns paths relative to `cwd`, so the mock does too. Reading
// one of them without resolving it against `cwd` only works while `cwd` is
// also the process directory, which is the case this file is here to rule out.
jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn((pattern: string | string[]) =>
    (Array.isArray(pattern) ? pattern : [pattern]).includes('fixture.tsx')
      ? ['fixture.tsx']
      : [],
  ),
}));

import { compileCSS } from '../src/index';

const SOURCE = `
import * as css from '@plumeria/core';

const styles = css.create({
  box: { color: 'red' },
});

export const Box = () => <div classStyle={styles.box} />;
`;

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: cwd', () => {
  it('reads globbed files relative to cwd, not to the process directory', () => {
    fs.writeFileSync(path.join(FIXTURE_DIR, 'fixture.tsx'), SOURCE, 'utf-8');
    expect(FIXTURE_DIR).not.toBe(process.cwd());

    const css = compileCSS({
      include: ['fixture.tsx'],
      exclude: ['**'],
      cwd: FIXTURE_DIR,
    });

    expect(css).toContain('color: red');
  });
});
