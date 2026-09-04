import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
let current = '';

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [current]),
}));

import { compileCSS } from '../src/index';

let n = 0;
const compile = (
  body: string,
  options: Record<string, unknown> = {},
): string => {
  current = path.join(FIXTURE_DIR, `f${n++}.tsx`);
  fs.writeFileSync(current, body, 'utf-8');
  return compileCSS({ include: ['**'], exclude: [], ...options });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

const style = (declaration: string) => `
import * as css from '@plumeria/core';
export const s = css.create({ a: { ${declaration} } });
export const A = () => <div classStyle={s.a} />;
`;

describe('compiler: withoutLogicalProperties', () => {
  it('stops the build on a logical property', () => {
    expect(() =>
      compile(style(`marginBlockStart: 0`), {
        withoutLogicalProperties: true,
      }),
    ).toThrow(/'marginBlockStart' is the logical name of this property/);
  });

  it('names the physical property to write instead', () => {
    expect(() =>
      compile(style(`insetInlineStart: 0`), {
        withoutLogicalProperties: true,
      }),
    ).toThrow(/use 'left'/);
  });

  it('names the file the property was written in', () => {
    expect(() =>
      compile(style(`marginBlockStart: 0`), {
        withoutLogicalProperties: true,
      }),
    ).toThrow(/\(f\d+\.tsx\)/);
  });

  it('leaves the physical spelling alone', () => {
    expect(
      compile(style(`marginTop: 0`), { withoutLogicalProperties: true }),
    ).toContain('margin-top');
  });
});

describe('compiler: withoutPhysicalProperties', () => {
  it('stops the build on a physical property', () => {
    expect(() =>
      compile(style(`marginTop: 0`), { withoutPhysicalProperties: true }),
    ).toThrow(/'marginTop' is the physical name of this property/);
  });

  it('names the logical property to write instead', () => {
    expect(() =>
      compile(style(`marginTop: 0`), { withoutPhysicalProperties: true }),
    ).toThrow(/Write it as 'marginBlockStart'/);
  });

  it('leaves the logical spelling alone', () => {
    expect(
      compile(style(`marginBlockStart: 0`), {
        withoutPhysicalProperties: true,
      }),
    ).toContain('margin-block-start');
  });
});

describe('compiler: the property policy is off by default', () => {
  it('compiles either spelling when neither option is set', () => {
    const css = compile(style(`marginTop: 0, insetInlineStart: 0`));
    expect(css).toContain('margin-top');
    expect(css).toContain('inset-inline-start');
  });
});

describe('compiler: the sizes option', () => {
  it('leaves an axis property alone by default', () => {
    expect(
      compile(style(`blockSize: 10`), { withoutLogicalProperties: true }),
    ).toContain('block-size');
  });

  it('rejects an axis property when sizes is on', () => {
    expect(() =>
      compile(style(`blockSize: 10`), {
        withoutLogicalProperties: { sizes: true },
      }),
    ).toThrow(/'blockSize' is the logical name of this property/);
  });
});

describe('compiler: where the policy reaches', () => {
  it('reaches a property nested under a selector', () => {
    expect(() =>
      compile(style(`':hover': { marginBlockStart: 0 }`), {
        withoutLogicalProperties: true,
      }),
    ).toThrow(/'marginBlockStart' is the logical name of this property/);
  });

  it('reaches a property nested under an at-rule', () => {
    expect(() =>
      compile(style(`'@media (min-width: 600px)': { insetInlineEnd: 0 }`), {
        withoutLogicalProperties: true,
      }),
    ).toThrow(/'insetInlineEnd' is the logical name of this property/);
  });

  it('reaches a keyframes property', () => {
    expect(() =>
      compile(
        `
import * as css from '@plumeria/core';
export const k = css.keyframes({ from: { marginBlockStart: 0 } });
export const s = css.create({ a: { animationName: k } });
export const A = () => <div classStyle={s.a} />;
`,
        { withoutLogicalProperties: true },
      ),
    ).toThrow(/'marginBlockStart' is the logical name of this property/);
  });

  it('reaches the body of a style function', () => {
    expect(() =>
      compile(
        `
import * as css from '@plumeria/core';
export const s = css.create({ a: (v: number) => ({ marginBlockStart: v }) });
export const A = () => <div classStyle={s.a(0)} />;
`,
        { withoutLogicalProperties: true },
      ),
    ).toThrow(/'marginBlockStart' is the logical name of this property/);
  });

  it('leaves a custom property alone', () => {
    expect(
      compile(style(`'--myVar': 'red', color: 'var(--myVar)'`), {
        withoutLogicalProperties: true,
      }),
    ).toContain('--myVar');
  });
});

describe('compiler: the two options contradict each other', () => {
  it('refuses a configuration that enables both', () => {
    expect(() =>
      compile(style(`color: 'red'`), {
        withoutLogicalProperties: true,
        withoutPhysicalProperties: true,
      }),
    ).toThrow(/contradict each other/);
  });
});
