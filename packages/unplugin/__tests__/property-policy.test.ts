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

import { unpluginFactory } from '../src/core';

let fixtureCount = 0;

const run = async (
  body: string,
  options: Record<string, unknown> = {},
): Promise<string> => {
  const appPath = path.join(FIXTURE_DIR, `app-${fixtureCount++}.tsx`);
  const source = `import * as css from '@plumeria/core';\n${body}\n`;

  fs.writeFileSync(appPath, source, 'utf-8');
  files.length = 0;
  files.push(appPath);

  const plugin = unpluginFactory(
    options as never,
    {
      framework: 'vite',
    } as never,
  ) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    source,
    appPath,
  );
  return typeof result === 'string' ? result : (result?.code ?? '');
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const style = (declaration: string) =>
  `export const s = css.create({ a: { ${declaration} } });\n` +
  `export const A = () => <div classStyle={s.a} />;`;

describe('unplugin: withoutLogicalProperties', () => {
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

describe('unplugin: withoutPhysicalProperties', () => {
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

describe('unplugin: the property policy is off by default', () => {
  it('transforms either spelling when neither option is set', async () => {
    await expect(
      run(style(`marginTop: 0, insetInlineStart: 0`)),
    ).resolves.toContain('className');
  });
});

describe('unplugin: the sizes option', () => {
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

describe('unplugin: where the policy reaches', () => {
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

describe('unplugin: the two options contradict each other', () => {
  it('refuses a configuration that enables both before any file is read', () => {
    expect(() =>
      unpluginFactory(
        {
          withoutLogicalProperties: true,
          withoutPhysicalProperties: true,
        } as never,
        { framework: 'vite' } as never,
      ),
    ).toThrow(/contradict each other/);
  });
});
