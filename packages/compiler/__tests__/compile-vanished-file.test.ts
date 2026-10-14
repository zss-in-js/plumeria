import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

const moduleUsing = (color: string) => `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Box = () => <div classStyle={styles.box} />;
`;

// A link to nothing is listed by the glob but cannot be read, the same state as
// a file deleted between listing the project and reading it.
describe.each(implementations)('$name', ({ compileCSS }) => {
  const DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-vanished-')),
  );
  const FILE = path.join(DIR, 'box.tsx');
  const GONE = path.join(DIR, 'gone.tsx');

  beforeAll(() => {
    fs.writeFileSync(FILE, moduleUsing('#a1a1a1'));
    fs.symlinkSync(path.join(DIR, 'missing.tsx'), GONE);
  });
  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  it('skips a listed file that is gone by the time it is read', () => {
    const css = compileCSS({ include: ['**/*.tsx'], exclude: [], cwd: DIR });

    expect(css).toContain('#a1a1a1');
  });

  it('still reports a file it was given that cannot be read', () => {
    expect(() =>
      compileCSS({
        include: [],
        exclude: [],
        cwd: DIR,
        files: [FILE, GONE],
      }),
    ).toThrow();
  });
});
