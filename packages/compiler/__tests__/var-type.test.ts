import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

const VARS = `import * as css from '@plumeria/core';
export const angle = css.varType({ syntax: '<angle>', initialValue: '0deg' });
export const rotation = css.varType({ syntax: '<angle>', initialValue: '0deg' });
export const names = [angle, rotation];
`;

const PAGE = `import * as css from '@plumeria/core';
import { angle } from './vars';
const tint = css.varType({ syntax: '<color>', initialValue: 'red', inherits: true });
const s = css.create({
  ring: {
    background: \`conic-gradient(from var(\${angle}), var(\${tint}), blue)\`,
    transition: \`\${angle} 0.3s\`,
    [tint]: 'blue',
    ':hover': { [angle]: '90deg' },
  },
  rotate: (a: string) => ({ [angle]: a }),
});
export const P = (p: any) => <div classStyle={[s.ring, s.rotate(p.a)]} />;
export const names = [tint];
`;

const setup = () => {
  const dir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
  );
  fs.writeFileSync(path.join(dir, 'vars.ts'), VARS);
  fs.writeFileSync(path.join(dir, 'page.tsx'), PAGE);
  return dir;
};

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

const namesOf = (code: string): string[] => {
  const head = 'export const names = ';
  const start = code.indexOf(head) + head.length;
  return JSON.parse(code.slice(start, code.indexOf(';', start)));
};

describe.each(implementations)('$name', ({ transformSource, compileCSS }) => {
  const DIR = setup();

  afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

  const css = () =>
    compileCSS({ include: ['*.ts', '*.tsx'], exclude: [], cwd: DIR });

  it('gives each definition its own name, even when two read the same', async () => {
    const { code } = await transformSource(env(DIR, 'vars.ts'));
    const [angle, rotation] = namesOf(code);
    expect(angle).toContain('--pr-');
    expect(rotation).toContain('--pr-');
    expect(angle).not.toBe(rotation);
  });

  it('registers a used variable with @property, and inherits only when asked', async () => {
    const { code: vars } = await transformSource(env(DIR, 'vars.ts'));
    const { code: page } = await transformSource(env(DIR, 'page.tsx'));
    const [angle] = namesOf(vars);
    const [tint] = namesOf(page);
    const sheet = css();
    expect(sheet).toContain(
      `@property ${angle} {\n  syntax: "<angle>";\n  inherits: false;\n  initial-value: 0deg;\n}`,
    );
    expect(sheet).toContain(
      `@property ${tint} {\n  syntax: "<color>";\n  inherits: true;\n  initial-value: red;\n}`,
    );
  });

  it('leaves out the @property of a variable nothing uses', async () => {
    const { code } = await transformSource(env(DIR, 'vars.ts'));
    const [, rotation] = namesOf(code);
    expect(css()).not.toContain(`@property ${rotation}`);
  });

  it('reads the name as a key, inside var(), in a condition and in a function key', async () => {
    const { code } = await transformSource(env(DIR, 'vars.ts'));
    const [angle] = namesOf(code);
    const sheet = css();
    expect(sheet).toContain(`from var(${angle})`);
    expect(sheet).toContain(`transition: ${angle} 0.3s;`);
    expect(sheet).toContain(`:hover { ${angle}: 90deg; }`);
    expect(sheet).toMatch(
      new RegExp(`\\{ ${angle}: var\\(--[0-9a-z]+-a\\); \\}`),
    );
  });

  it('needs a named top-level variable to hash the name from', async () => {
    const file = path.join(DIR, 'anonymous.ts');
    fs.writeFileSync(
      file,
      `import * as css from '@plumeria/core';\nexport default css.varType({ syntax: '*' });\n`,
    );
    await expect(transformSource(env(DIR, 'anonymous.ts'))).rejects.toThrow(
      /css\.varType must be assigned to a named top-level variable/,
    );
    fs.rmSync(file);
  });

  // An @property the optimizer rejects takes the whole stylesheet down with
  // it, so the definition is reported where it is written instead.
  it.each([
    ['a quote in the syntax', `'<an"gle>'`, `'0deg'`],
    ['a misspelled syntax', `'<lenght>'`, `'0px'`],
    ['an initial value of another type', `'<angle>'`, `'red'`],
  ])('reports %s at the definition', async (_, syntax, initialValue) => {
    const file = path.join(DIR, 'invalid.ts');
    fs.writeFileSync(
      file,
      `import * as css from '@plumeria/core';\nexport const broken = css.varType({ syntax: ${syntax}, initialValue: ${initialValue} });\n`,
    );
    await expect(transformSource(env(DIR, 'invalid.ts'))).rejects.toThrow(
      /css\.varType "broken" is not a valid @property/,
    );
    fs.rmSync(file);
  });

  it.each([
    [`'<length> | <percentage>'`, `'0px'`],
    [`'<length>+'`, `'0px'`],
    [`'small | medium | large'`, `'small'`],
    [`'<string>'`, `'"hello"'`],
  ])('accepts the syntax %s', async (syntax, initialValue) => {
    const file = path.join(DIR, 'valid.ts');
    fs.writeFileSync(
      file,
      `import * as css from '@plumeria/core';\nexport const fine = css.varType({ syntax: ${syntax}, initialValue: ${initialValue} });\nexport const names = [fine];\n`,
    );
    const { code } = await transformSource(env(DIR, 'valid.ts'));
    expect(namesOf(code)[0]).toContain('--pr-');
    fs.rmSync(file);
  });
});

it('gives the same name in both implementations', async () => {
  const names = await Promise.all(
    implementations.map(async ({ transformSource }) => {
      const dir = setup();
      try {
        const { code } = await transformSource(env(dir, 'vars.ts'));
        return namesOf(code);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }),
  );
  expect(names[0]).toEqual(names[1]);
});
