import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_STYLE_PROP } from '@plumeria/utils';
import { implementations } from '../compiler-implementations';

const TRIES = `import * as css from '@plumeria/core';
export const above = css.positionTry({ positionArea: 'top', marginBottom: 8 });
export const unused = css.positionTry({ positionArea: 'left' });
export const names = [above, unused];
`;

const PAGE = `import * as css from '@plumeria/core';
import { above } from './tries';
const below = css.positionTry({ positionArea: 'bottom', marginTop: 8 });
const s = css.create({
  tooltip: {
    positionArea: 'right',
    positionTryFallbacks: \`\${above}, \${below}, flip-inline\`,
  },
  single: { positionTryFallbacks: below },
});
export const P = () => <div classStyle={s.tooltip} />;
export const Q = () => <div classStyle={s.single} />;
export const names = [below];
`;

const setup = () => {
  const dir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
  );
  fs.writeFileSync(path.join(dir, 'tries.ts'), TRIES);
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

  it('gives each definition a dashed name', async () => {
    const { code } = await transformSource(env(DIR, 'tries.ts'));
    const [above, unused] = namesOf(code);
    expect(above).toContain('--pt-');
    expect(unused).toContain('--pt-');
    expect(above).not.toBe(unused);
  });

  it('emits @position-try for an imported and a local name used in a fallback list', async () => {
    const { code: tries } = await transformSource(env(DIR, 'tries.ts'));
    const { code: page } = await transformSource(env(DIR, 'page.tsx'));
    const [above] = namesOf(tries);
    const [below] = namesOf(page);
    const sheet = css();
    expect(sheet).toContain(
      `@position-try ${above} {\n  position-area: top;\n  margin-bottom: 8px;\n}`,
    );
    expect(sheet).toContain(
      `@position-try ${below} {\n  position-area: bottom;\n  margin-top: 8px;\n}`,
    );
    expect(sheet).toContain(
      `position-try-fallbacks: ${above}, ${below}, flip-inline;`,
    );
    expect(sheet).toContain(`position-try-fallbacks: ${below};`);
  });

  it('leaves out the @position-try of a name nothing uses', async () => {
    const { code } = await transformSource(env(DIR, 'tries.ts'));
    const [, unused] = namesOf(code);
    expect(css()).not.toContain(`@position-try ${unused}`);
  });
});

it('gives the same name in both implementations', async () => {
  const names = await Promise.all(
    implementations.map(async ({ transformSource }) => {
      const dir = setup();
      try {
        const { code } = await transformSource(env(dir, 'tries.ts'));
        return namesOf(code);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }),
  );
  expect(names[0]).toEqual(names[1]);
});
