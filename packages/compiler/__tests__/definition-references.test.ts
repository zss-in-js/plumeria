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
    api: 'viewTransitionClass',
    prefix: 'vt-',
    definition: `css.viewTransitionClass({ old: { opacity: 0 }, new: { opacity: 1 } })`,
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

    it.each([
      ['a member', `console.log(defs.name);`],
      ['a string key', `console.log(defs['name']);`],
      ['a destructured key', `const { name } = defs;\nconsole.log(name);`],
      ['a rest element', `const { ...rest } = defs;\nconsole.log(rest);`],
      ['a template key', 'console.log(defs[`name`]);'],
      ['an assigned key', `let name;\n({ name } = defs);\nconsole.log(name);`],
      [
        'an assigned rest element',
        `let rest;\n({ ...rest } = defs);\nconsole.log(rest);`,
      ],
      [
        'a computed key',
        `const key = 'name';\nconst { [key]: value } = defs;\nconsole.log(value);`,
      ],
    ])(
      'rejects a definition read through a namespace import as %s',
      async (_, read) => {
        fs.writeFileSync(
          path.join(dir, 'definitions.ts'),
          `import * as css from '@plumeria/core';\nexport const name = ${definition};\n`,
        );
        fs.writeFileSync(
          path.join(dir, 'reader.ts'),
          `import * as css from '@plumeria/core';\nimport * as defs from './definitions';\n${read}\n`,
        );
        await transformSource(env(dir, 'definitions.ts'));
        await expect(transformSource(env(dir, 'reader.ts'))).rejects.toThrow(
          'defs.name reads a Plumeria definition through a namespace import',
        );
      },
    );

    it('rejects a definition reached through a barrel as a rest element', async () => {
      fs.writeFileSync(
        path.join(dir, 'a.ts'),
        `import * as css from '@plumeria/core';\nexport const name = ${definition};\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'definitions.ts'),
        `export * from './a';\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'reader.ts'),
        `import * as css from '@plumeria/core';\nimport * as defs from './definitions';\nconst { ...rest } = defs;\nconsole.log(rest);\n`,
      );
      await transformSource(env(dir, 'a.ts'));
      await expect(transformSource(env(dir, 'reader.ts'))).rejects.toThrow(
        'defs.name reads a Plumeria definition through a namespace import',
      );
    });

    it('reads a rest element when the definition is not exported', async () => {
      fs.writeFileSync(
        path.join(dir, 'definitions.ts'),
        `import * as css from '@plumeria/core';\nconst name = ${definition};\nexport const plain = 1;\nconsole.log(name);\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'reader.ts'),
        `import * as css from '@plumeria/core';\nimport * as defs from './definitions';\nconst { ...rest } = defs;\nconsole.log(rest);\n`,
      );
      await transformSource(env(dir, 'definitions.ts'));
      const { code } = await transformSource(env(dir, 'reader.ts'));
      expect(code).toContain(`const { ...rest } = defs;`);
    });

    it.each([
      ['an argument', `console.log(defs);`],
      ['a spread', `console.log({ ...defs });`],
      [
        'a nested pattern',
        `const { inner: { name } } = { inner: defs };\nconsole.log(name);`,
      ],
      ['a dynamic key', `const key = 'name';\nconsole.log(defs[key]);`],
      ['an alias', `const alias = defs;\nconsole.log(alias.name);`],
    ])('rejects a namespace import used as a whole as %s', async (_, read) => {
      fs.writeFileSync(
        path.join(dir, 'definitions.ts'),
        `import * as css from '@plumeria/core';\nexport const name = ${definition};\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'reader.ts'),
        `import * as css from '@plumeria/core';\nimport * as defs from './definitions';\n${read}\n`,
      );
      await transformSource(env(dir, 'definitions.ts'));
      await expect(transformSource(env(dir, 'reader.ts'))).rejects.toThrow(
        'defs is used as a whole, but it holds defs.name',
      );
    });

    it('passes a namespace import that holds no definition as a whole', async () => {
      fs.writeFileSync(
        path.join(dir, 'definitions.ts'),
        `export const plain = 1;\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'reader.ts'),
        `import * as css from '@plumeria/core';\nimport * as defs from './definitions';\nconsole.log(defs);\n`,
      );
      await transformSource(env(dir, 'definitions.ts'));
      const { code } = await transformSource(env(dir, 'reader.ts'));
      expect(code).toContain(`console.log(defs);`);
    });

    it('reads other exports through a namespace import', async () => {
      fs.writeFileSync(
        path.join(dir, 'definitions.ts'),
        `import * as css from '@plumeria/core';\nexport const name = ${definition};\nexport const plain = 1;\n`,
      );
      fs.writeFileSync(
        path.join(dir, 'reader.ts'),
        `import * as css from '@plumeria/core';\nimport * as defs from './definitions';\nconst { plain } = defs;\nlet other;\n({ plain: other } = defs);\nconsole.log(defs.plain, defs['plain'], defs[\`plain\`], plain, other);\n`,
      );
      await transformSource(env(dir, 'definitions.ts'));
      const { code } = await transformSource(env(dir, 'reader.ts'));
      expect(code).toContain(
        "console.log(defs.plain, defs['plain'], defs[`plain`], plain, other);",
      );
    });
  });
});
