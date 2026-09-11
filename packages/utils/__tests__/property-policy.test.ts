import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const files: string[] = [];

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => files),
}));

import { transformSource } from '../src/transform';
import { resolvePropertyPolicy } from '../src/propertyPolicy';
import type { PropertyPolicyOptions } from '../src/propertyPolicy';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const env = (
  source: string,
  filePath: string,
  options: PropertyPolicyOptions = {},
) => ({
  source,
  moduleId: filePath,
  filePath,
  root: process.cwd(),
  styleProp: DEFAULT_STYLE_PROP,
  propertyPolicy: resolvePropertyPolicy(options),
  isDev: false,
  collectOndemandSheets: true,
  addDependency: () => {},
});

let fixtureCount = 0;

const run = async (
  body: string,
  options: PropertyPolicyOptions = {},
): Promise<string> => {
  const appPath = path.join(FIXTURE_DIR, `app-${fixtureCount++}.tsx`);
  const source = `import * as css from '@plumeria/core';\n${body}\n`;

  fs.writeFileSync(appPath, source, 'utf-8');
  files.length = 0;
  files.push(appPath);

  const result = await transformSource(env(source, appPath, options));
  return typeof result === 'string' ? result : (result?.code ?? '');
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const style = (declaration: string) =>
  `export const s = css.create({ a: { ${declaration} } });\n` +
  `export const A = () => <div classStyle={s.a} />;`;

describe('transform: withoutLogicalProperties', () => {
  it('fails the build on a logical property', async () => {
    await expect(
      run(style(`marginBlockStart: 0`), { withoutLogicalProperties: true }),
    ).rejects.toThrow(
      /'marginBlockStart' is the logical name of this property/,
    );
  });

  it('names the physical property to write instead', async () => {
    await expect(
      run(style(`insetInlineStart: 0`), { withoutLogicalProperties: true }),
    ).rejects.toThrow(/use 'left'/);
  });

  it('names the file the property was written in', async () => {
    await expect(
      run(style(`marginBlockStart: 0`), { withoutLogicalProperties: true }),
    ).rejects.toThrow(/\(app-\d+\.tsx\)/);
  });

  it('leaves the physical spelling alone', async () => {
    await expect(
      run(style(`marginTop: 0`), { withoutLogicalProperties: true }),
    ).resolves.toContain('className');
  });
});

describe('transform: withoutPhysicalProperties', () => {
  it('fails the build on a physical property', async () => {
    await expect(
      run(style(`marginTop: 0`), { withoutPhysicalProperties: true }),
    ).rejects.toThrow(/'marginTop' is the physical name of this property/);
  });

  it('names the logical property to write instead', async () => {
    await expect(
      run(style(`marginTop: 0`), { withoutPhysicalProperties: true }),
    ).rejects.toThrow(/Write it as 'marginBlockStart'/);
  });
});

describe('transform: the property policy is off by default', () => {
  it('transforms either spelling when neither option is set', async () => {
    await expect(
      run(style(`marginTop: 0, insetInlineStart: 0`)),
    ).resolves.toContain('className');
  });
});

describe('transform: the sizes option', () => {
  it('leaves an axis property alone by default', async () => {
    await expect(
      run(style(`blockSize: 10`), { withoutLogicalProperties: true }),
    ).resolves.toContain('className');
  });

  it('rejects an axis property when sizes is on', async () => {
    await expect(
      run(style(`blockSize: 10`), {
        withoutLogicalProperties: { sizes: true },
      }),
    ).rejects.toThrow(/'blockSize' is the logical name of this property/);
  });
});

describe('transform: where the policy reaches', () => {
  it('reaches a property nested under a selector', async () => {
    await expect(
      run(style(`':hover': { marginBlockStart: 0 }`), {
        withoutLogicalProperties: true,
      }),
    ).rejects.toThrow(
      /'marginBlockStart' is the logical name of this property/,
    );
  });

  it('reaches a keyframes property', async () => {
    await expect(
      run(
        `export const k = css.keyframes({ from: { marginBlockStart: 0 } });\n` +
          `export const s = css.create({ a: { animationName: k } });\n` +
          `export const A = () => <div classStyle={s.a} />;`,
        { withoutLogicalProperties: true },
      ),
    ).rejects.toThrow(
      /'marginBlockStart' is the logical name of this property/,
    );
  });

  it('reaches the body of a style function', async () => {
    await expect(
      run(
        `export const s = css.create({ a: (v: number) => ({ marginBlockStart: v }) });\n` +
          `export const A = () => <div classStyle={s.a(0)} />;`,
        { withoutLogicalProperties: true },
      ),
    ).rejects.toThrow(
      /'marginBlockStart' is the logical name of this property/,
    );
  });
});

describe('transform: the two options contradict each other', () => {
  it('refuses a configuration that enables both before any file is read', () => {
    expect(() =>
      resolvePropertyPolicy({
        withoutLogicalProperties: true,
        withoutPhysicalProperties: true,
      }),
    ).toThrow(/contradict each other/);
  });
});
