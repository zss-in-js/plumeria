import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() =>
    fs.readdirSync(FIXTURE_DIR).map((name) => path.join(FIXTURE_DIR, name)),
  ),
}));

import { compileCSS } from '../src/index';

const write = (name: string, body: string) =>
  fs.writeFileSync(path.join(FIXTURE_DIR, name), body, 'utf-8');

const compile = () => compileCSS({ include: ['**'], exclude: [] });

beforeEach(() => {
  for (const name of fs.readdirSync(FIXTURE_DIR)) {
    fs.rmSync(path.join(FIXTURE_DIR, name));
  }
});

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('compiler: styles imported from another file', () => {
  it('emits the rule for a function key imported from another file', () => {
    // The declaration lives in another module, so the only record of its
    // function keys is the one the scanner leaves behind.
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
export const importedStyles = css.create({ tone: (color: string) => ({ color }) });
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone(p.c)} />;
`,
    );

    expect(compile()).toContain('.xokp0532 { color: var(--x80848wl-color); }');
  });

  it('resolves a const declared in the defining file', () => {
    // The name is in scope where the function is written, not where it is
    // called, so the consumer's own bindings cannot stand in for it.
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
const weight = 700;
export const importedStyles = css.create({
  tone: (color: string) => ({ color, fontWeight: weight }),
});
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone(p.c)} />;
`,
    );

    const css = compile();
    expect(css).toContain('font-weight: 700');
    expect(css).toMatch(/color: var\(--\w+-color\)/);
  });

  it('resolves a spread of a const declared in the defining file', () => {
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
const base = { fontWeight: 700 };
export const importedStyles = css.create({
  tone: (color: string) => ({ color, ...base }),
});
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone(p.c)} />;
`,
    );

    expect(compile()).toContain('font-weight: 700');
  });

  it('keeps a parameter dynamic where a nested rule also reads a const', () => {
    // The two live under one selector, so resolving the const must not take
    // the parameter next to it with it.
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
const weight = 700;
export const importedStyles = css.create({
  tone: (color: string) => ({ ':hover': { color, fontWeight: weight } }),
});
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone(p.c)} />;
`,
    );

    const css = compile();
    expect(css).toContain('font-weight: 700');
    expect(css).toMatch(/color: var\(--\w+-color\)/);
  });

  it('resolves createStatic and createTheme the defining file imports', () => {
    write(
      'tokens.ts',
      `import * as css from '@plumeria/core';
export const theme = css.createTheme(':root', { brand: 'rebeccapurple' });
export const sizes = css.createStatic({ gap: '2px' });
`,
    );
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
import { theme, sizes } from './tokens';
export const importedStyles = css.create({
  tone: (color: string) => ({ color, background: theme.brand, padding: sizes.gap }),
});
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone(p.c)} />;
`,
    );

    const css = compile();
    expect(css).toMatch(/background: var\(--\w+-brand\)/);
    expect(css).toContain('padding: 2px');
  });

  it('resolves a defining-file const behind a named parameter', () => {
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
const weight = 700;
export const importedStyles = css.create({
  tone: ({ color }: { color: string }) => ({ color, fontWeight: weight }),
});
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = (p: any) => <div classStyle={importedStyles.tone({ color: p.c })} />;
`,
    );

    const css = compile();
    expect(css).toContain('font-weight: 700');
    expect(css).toMatch(/color: var\(--\w+-color\)/);
  });

  it('resolves a const declared in the defining file for a static key', () => {
    // Static keys read from the scanner's table too, so they lose the same
    // scope a function body does.
    write(
      'imported.styles.ts',
      `import * as css from '@plumeria/core';
const weight = 700;
export const importedStyles = css.create({
  plain: { color: 'red', fontWeight: weight },
});
`,
    );
    write(
      'consumer.tsx',
      `import '@plumeria/core';
import { importedStyles } from './imported.styles';
export const A = () => <div classStyle={importedStyles.plain} />;
`,
    );

    const css = compile();
    expect(css).toContain('color: red');
    expect(css).toContain('font-weight: 700');
  });
});
