import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseSync } from '@swc/core';

const FIXTURE_DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const files: string[] = [];

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => files),
}));

import { transformSource } from '../src/transform';
import {
  assertPropertyPolicy,
  resolvePropertyPolicy,
} from '../src/propertyPolicy';
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

const assertSource = (
  source: string,
  policy = resolvePropertyPolicy({ withoutLogicalProperties: true }),
) =>
  assertPropertyPolicy(
    parseSync(source, { syntax: 'typescript', tsx: true }),
    policy,
    '/project/source.tsx',
  );

describe('resolvePropertyPolicy', () => {
  it.each([
    [
      { withoutLogicalProperties: {} },
      { reject: 'logical', includeAxes: false },
    ],
    [
      { withoutPhysicalProperties: {} },
      { reject: 'physical', includeAxes: false },
    ],
    [{ withoutLogicalProperties: false }, undefined],
    [{ withoutPhysicalProperties: false }, undefined],
  ] as const)('resolves %j', (options, expected) => {
    expect(resolvePropertyPolicy(options)).toEqual(expected);
  });
});

describe('assertPropertyPolicy', () => {
  it('does nothing without a policy', () => {
    expect(() => assertSource('', undefined)).not.toThrow();
  });

  it.each([
    `import css from '@plumeria/core'; css.create({ a: { marginBlockStart: 0 } });`,
    `import { create } from '@plumeria/core'; create({ a: { marginBlockStart: 0 } });`,
    `import { create as make } from '@plumeria/core'; make({ a: { marginBlockStart: 0 } });`,
    `import { viewTransition as transition } from '@plumeria/core'; transition({ a: () => ({ marginBlockStart: 0 }) });`,
  ])('checks supported import and call form %#', (source) => {
    expect(() => assertSource(source)).toThrow(/marginBlockStart/);
  });

  it('checks string-keyed styles', () => {
    expect(() =>
      assertSource(
        `import { create } from '@plumeria/core'; create({
          direct: { 'marginBlockStart': 0 },
        });`,
      ),
    ).toThrow(/marginBlockStart/);
  });

  it('ignores unrelated calls and unsupported object entries', () => {
    expect(() =>
      assertSource(`
        import other from 'other';
        import * as css from '@plumeria/core';
        other.create({ a: { marginBlockStart: 0 } });
        css.unknown({ a: { marginBlockStart: 0 } });
        css.create(value, { ...styles, 1: 0, plain: 0, fn: function () {} });
        unknown();
        getApi()({});
      `),
    ).not.toThrow();
  });

  it('ignores non-properties and unnamed keys inside a style', () => {
    expect(() =>
      assertSource(`
        import * as css from '@plumeria/core';
        css.create({ a: { ...base, 1: 0, color: 'red' } });
      `),
    ).not.toThrow();
  });

  it('continues after checking an allowed nested style', () => {
    expect(() =>
      assertSource(`
        import * as css from '@plumeria/core';
        css.create({ a: { ':hover': { color: 'red' }, color: 'blue' } });
      `),
    ).not.toThrow();
  });

  it('accepts an already-unwrapped function body AST', () => {
    const ast = parseSync(
      `import * as css from '@plumeria/core'; css.create({ a: () => ({ color: 'red' }) });`,
      { syntax: 'typescript' },
    );
    const call = (ast.body[1] as any).expression;
    const arrow = call.arguments[0].expression.properties[0].value;
    arrow.body = arrow.body.expression;

    expect(() =>
      assertPropertyPolicy(
        ast,
        { reject: 'logical', includeAxes: false },
        '/project/source.ts',
      ),
    ).not.toThrow();
  });

  it('ignores an unknown import specifier AST', () => {
    const ast = parseSync(`import * as css from '@plumeria/core';`, {
      syntax: 'typescript',
    });
    (ast.body[0] as any).specifiers.push({ type: 'UnknownSpecifier' });

    expect(() =>
      assertPropertyPolicy(
        ast,
        { reject: 'logical', includeAxes: false },
        '/project/source.ts',
      ),
    ).not.toThrow();
  });
});

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
