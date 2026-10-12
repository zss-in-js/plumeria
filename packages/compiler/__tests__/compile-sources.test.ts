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

  it('compiles only the files it is given, whatever their names hold', () => {
    const bang = path.join(DIR, 'bang!-[slug].tsx');
    fs.writeFileSync(bang, moduleUsing('#d44444'));

    const css = compileCSS({
      include: [],
      exclude: [],
      cwd: DIR,
      files: [bang],
    });

    expect(css).toContain('#d44444');
    expect(css).not.toContain('red');
  });

  it('compiles a given file that has no copy on disk', () => {
    const virtual = path.join(DIR, 'virtual.tsx');

    const css = compileCSS({
      include: [],
      exclude: [],
      cwd: DIR,
      files: [virtual],
      sources: { [virtual]: moduleUsing('#e55555') },
    });

    expect(css).toContain('#e55555');
  });

  it('leaves the other files to the disk', () => {
    expect(compile({ [FILE]: moduleUsing('blue') })).toContain('green');
  });
});
