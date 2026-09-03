import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const STYLES = path.join(FIXTURE_DIR, 'styles.ts');
const BARREL = path.join(FIXTURE_DIR, 'barrel.ts');

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [STYLES, BARREL]),
}));

import { scanAll, resolveFileError } from '../src/parser';

const BROKEN = `
import * as css from '@plumeria/core';
export const styles = css.create({
  good: { color: 'green' },
  1: { color: 'red' },
});
`;

const SOUND = `
import * as css from '@plumeria/core';
export const styles = css.create({
  good: { color: 'green' },
});
`;

const scan = (body: string) => {
  fs.writeFileSync(STYLES, body, 'utf-8');
  scanAll();
};

beforeAll(() =>
  fs.writeFileSync(BARREL, `export { styles } from './styles';\n`, 'utf-8'),
);

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('parser: the error a file threw while being scanned', () => {
  it('is kept against the file that threw it', () => {
    scan(BROKEN);

    expect(resolveFileError(STYLES, 'styles')).toEqual({
      filePath: STYLES,
      message: expect.stringMatching(/The style key 1 is a number/),
    });
  });

  it('carries no [plumeria] prefix, so each caller adds its own', () => {
    scan(BROKEN);

    expect(resolveFileError(STYLES, 'styles')?.message).not.toMatch(
      /^\[plumeria\]/,
    );
  });

  it('is found through the file that re-exports the style', () => {
    scan(BROKEN);

    expect(resolveFileError(BARREL, 'styles')?.filePath).toBe(STYLES);
  });

  it('is dropped once the file scans', () => {
    scan(BROKEN);
    scan(SOUND);

    expect(resolveFileError(STYLES, 'styles')).toBeUndefined();
    expect(resolveFileError(BARREL, 'styles')).toBeUndefined();
  });

  it('is absent for a file that never failed', () => {
    scan(SOUND);

    expect(
      resolveFileError(path.join(FIXTURE_DIR, 'absent.ts'), 'styles'),
    ).toBeUndefined();
  });
});
