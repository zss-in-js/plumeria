import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ compileCSS }) => {
  const FIXTURE_DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
  );

  let fixtureCount = 0;

  const BROKEN = `export const styles = css.create({
  good: { color: 'green' },
  1: { color: 'red' },
});`;

  const SOUND = `export const styles = css.create({
  good: { color: 'green' },
});`;

  const compile = (
    definition: string,
    usage = 'styles.good',
    through:
      | 'the file itself'
      | 'a re-export'
      | 'a namespace import'
      | 'a namespace import of a re-export' = 'the file itself',
  ) => {
    const id = fixtureCount++;
    const stylesPath = path.join(FIXTURE_DIR, `styles-${id}.ts`);
    const barrelPath = path.join(FIXTURE_DIR, `barrel-${id}.ts`);
    const appPath = path.join(FIXTURE_DIR, `app-${id}.tsx`);
    const from =
      through === 'a re-export' ||
      through === 'a namespace import of a re-export'
        ? `barrel-${id}`
        : `styles-${id}`;
    const importLine = through.startsWith('a namespace import')
      ? `import * as imported from './${from}';`
      : `import { styles } from './${from}';`;

    fs.writeFileSync(
      stylesPath,
      `import * as css from '@plumeria/core';\n${definition}\n`,
      'utf-8',
    );
    fs.writeFileSync(
      barrelPath,
      `export { styles } from './styles-${id}';\n`,
      'utf-8',
    );
    fs.writeFileSync(
      appPath,
      `import * as css from '@plumeria/core';\n` +
        `${importLine}\n` +
        `function Test() { return 'x'; }\n` +
        `export const App = () => <div classStyle={${usage}} />;\n`,
      'utf-8',
    );

    return compileCSS({
      cwd: FIXTURE_DIR,
      include: [path.basename(appPath)],
      exclude: [],
    });
  };

  afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

  describe('compiler: an error in the file a style comes from', () => {
    it('reports that error instead of the style that could not be read', () => {
      expect(() => compile(BROKEN)).toThrow(/The style key 1 is a number/);
    });

    it('names the declaring file, not the one being compiled', () => {
      expect(() => compile(BROKEN)).toThrow(/\(styles-\d+\.ts\)/);
    });

    it('names it through a file that only re-exports the style', () => {
      expect(() => compile(BROKEN, 'styles.good', 'a re-export')).toThrow(
        /The style key 1 is a number.+\(styles-\d+\.ts\)/,
      );
    });

    // A namespace import binds the module, not one of its exports, so the root
    // identifier of `imported.styles.good` is the namespace. It used to carry no
    // origin, and the file that actually failed went unnamed.
    it('names it through a namespace import of the declaring file', () => {
      expect(() =>
        compile(BROKEN, 'imported.styles.good', 'a namespace import'),
      ).toThrow(/The style key 1 is a number.+\(styles-\d+\.ts\)/);
    });

    // The namespace names the module, so the export has to be read off the member
    // that follows it. Left as the namespace itself, the lookup stopped at the
    // barrel, which is sound, and the file that failed went unnamed.
    it('names it through a namespace import of a file that only re-exports the style', () => {
      expect(() =>
        compile(
          BROKEN,
          'imported.styles.good',
          'a namespace import of a re-export',
        ),
      ).toThrow(/The style key 1 is a number.+\(styles-\d+\.ts\)/);
    });

    it('keeps the unresolvable-style message when that file is sound', () => {
      expect(() => compile(SOUND, '[styles.good, Test()]')).toThrow(
        /Dynamic or unresolvable style object "Test\(\)" is not supported/,
      );
    });
  });
});
