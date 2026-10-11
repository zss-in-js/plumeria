import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

const moduleUsing = (color: string) => `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Box = () => <div classStyle={styles.box} />;
`;

describe.each(implementations)('$name', ({ compileCSS }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-sources-')),
  );
  const FILE = path.join(DIR, 'box.tsx');
  const OTHER = path.join(DIR, 'other.tsx');

  beforeAll(() => {
    fs.writeFileSync(FILE, moduleUsing('red'));
    fs.writeFileSync(OTHER, moduleUsing('green'));
  });
  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  const compile = (sources?: Record<string, string>) =>
    compileCSS({
      include: ['**/*.tsx'],
      exclude: [],
      cwd: DIR,
      ...(sources ? { sources } : {}),
    });

  it('reads the file on disk when no source is given', () => {
    const css = compile();

    expect(css).toContain('red');
    expect(css).toContain('green');
  });

  it('compiles the given source in place of the file on disk', () => {
    const css = compile({ [FILE]: moduleUsing('blue') });

    expect(css).toContain('blue');
    expect(css).not.toContain('red');
  });

  it('leaves the other files to the disk', () => {
    expect(compile({ [FILE]: moduleUsing('blue') })).toContain('green');
  });
});
