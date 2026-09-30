import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ transformSource }) => {
  const FIXTURE_DIR = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
  );
  const env = (source: string, filePath: string, cwd: string) => ({
    source,
    moduleId: filePath,
    filePath,
    root: cwd,
    cwd,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
  });

  let fixtureCount = 0;

  const BROKEN = `export const styles = css.create({
  good: { color: 'green' },
  1: { color: 'red' },
});`;

  const SOUND = `export const styles = css.create({
  good: { color: 'green' },
});`;

  const transform = (
    definition: string,
    usage = 'styles.good',
    through: 'the file itself' | 'a re-export' = 'the file itself',
  ) => {
    const id = fixtureCount++;
    const project = path.join(FIXTURE_DIR, String(id));
    fs.mkdirSync(project);
    const stylesPath = path.join(project, `styles-${id}.ts`);
    const barrelPath = path.join(project, `barrel-${id}.ts`);
    const appPath = path.join(project, `app-${id}.tsx`);
    const from = through === 'a re-export' ? `barrel-${id}` : `styles-${id}`;
    const source =
      `import * as css from '@plumeria/core';\n` +
      `import { styles } from './${from}';\n` +
      `function Test() { return 'x'; }\n` +
      `export const App = () => <div classStyle={${usage}} />;\n`;

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
    fs.writeFileSync(appPath, source, 'utf-8');

    return transformSource(env(source, appPath, project));
  };

  afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

  describe('transform: an error in the file a style comes from', () => {
    it('reports that error instead of the style that could not be read', async () => {
      await expect(transform(BROKEN)).rejects.toThrow(
        /The style key 1 is a number/,
      );
    });

    it('names the declaring file, not the one being transformed', async () => {
      await expect(transform(BROKEN)).rejects.toThrow(/\(styles-\d+\.ts\)/);
    });

    it('names it through a file that only re-exports the style', async () => {
      await expect(
        transform(BROKEN, 'styles.good', 'a re-export'),
      ).rejects.toThrow(/The style key 1 is a number.+\(styles-\d+\.ts\)/);
    });

    it('keeps the unresolvable-style message when that file is sound', async () => {
      await expect(transform(SOUND, '[styles.good, Test()]')).rejects.toThrow(
        /Dynamic or unresolvable style object "Test\(\)" is not supported/,
      );
    });
  });
});
