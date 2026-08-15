import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const CONSUMER_PATH = path.join(FIXTURE_DIR, 'consumer.tsx');
const STYLES_PATH = path.join(FIXTURE_DIR, 'imported.styles.ts');

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [STYLES_PATH, CONSUMER_PATH]),
}));

import { compileCSS } from '../src/index';

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: dynamic function keys across files', () => {
  it('emits the rule for a function key imported from another file', () => {
    // The declaration lives in another module, so the only record of its
    // function keys is the one the scanner leaves behind.
    fs.writeFileSync(
      STYLES_PATH,
      `import * as css from '@plumeria/core';
export const importedStyles = css.create({ tone: (color: string) => ({ color }) });
`,
      'utf-8',
    );
    fs.writeFileSync(
      CONSUMER_PATH,
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone(p.c)} />;
`,
      'utf-8',
    );

    const css = compileCSS({ include: ['**'], exclude: [] });

    expect(css).toContain('.xokp0532 { color: var(--x80848wl-color); }');
  });
});
