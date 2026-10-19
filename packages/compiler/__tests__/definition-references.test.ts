import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

// Each definition API returns a name. Read anywhere, the name is written in
// place, so nothing at runtime goes back to the declaration for it.
const APIS = [
  {
    api: 'keyframes',
    prefix: 'kf-',
    definition: `css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })`,
  },
  {
    api: 'viewTransition',
    prefix: 'vt-',
    definition: `css.viewTransition({ old: { opacity: 0 }, new: { opacity: 1 } })`,
  },
  {
    api: 'positionTry',
    prefix: '--pt-',
    definition: `css.positionTry({ positionArea: 'top' })`,
  },
  {
    api: 'varType',
    prefix: '--pr-',
    definition: `css.varType({ syntax: '<angle>', initialValue: '0deg' })`,
  },
];

const env = (dir: string, name: string) => {
  const filePath = path.join(dir, name);
  return {
    source: fs.readFileSync(filePath, 'utf8'),
    moduleId: filePath,
    filePath,
    root: dir,
    cwd: dir,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    addDependency: () => {},
  };
};

describe.each(implementations)('$name', ({ transformSource }) => {
  describe.each(APIS)('$api', ({ prefix, definition }) => {
    let dir: string;

    beforeEach(() => {
      dir = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
      );
    });

    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    it('writes the name where a local definition is read', async () => {
      fs.writeFileSync(
        path.join(dir, 'local.ts'),
        `import * as css from '@plumeria/core';\nconst name = ${definition};\nconsole.log(name);\n`,
      );
      const { code } = await transformSource(env(dir, 'local.ts'));
      expect(code).toContain(`console.log("${prefix}`);
      expect(code).not.toContain(`const name = "${prefix}`);
    });

    it('writes the name where an imported definition is read', async () => {
      fs.writeFileSync(
        path.join(dir, 'definitions.ts'),
        `import * as css from '@plumeria/core';\nexport const name = ${definition};\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'reader.ts'),
        `import * as css from '@plumeria/core';\nimport { name } from './definitions';\nconsole.log(name);\n`,
      );
      const { code: definitions } = await transformSource(
        env(dir, 'definitions.ts'),
      );
      const { code: reader } = await transformSource(env(dir, 'reader.ts'));
      expect(reader).toContain(`console.log("${prefix}`);
      expect(definitions).not.toContain(`export const name = "${prefix}`);
    });
  });
});
