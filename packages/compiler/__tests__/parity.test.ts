import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIRECTORY = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-parity-'));
let fixturePath = '';

// Both passes glob: compileCSS for its `include`, scanAll for the project. The
// parity claim only holds if they see the same project, so both answer with the
// fixture under test.
jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(() => [fixturePath]),
}));

import { compileCSS } from '../src/index';
import { transformSource, DEFAULT_STYLE_PROP } from '@plumeria/utils';

const definedClasses = (css: string) =>
  new Set([...css.matchAll(/\.(x[0-9a-z]{4,})/g)].map((match) => match[1]));

// A style handed to a component compiles to a lookup key that shares the shape
// of a class name, so the keys of the tables it is looked up in are subtracted.
// Every fixture below renders its own components, so each key is in this output.
const lookupKeys = (code: string) =>
  new Set([...code.matchAll(/"([^"\\]*)"\s*:/g)].map((match) => match[1]));

// Every class the transformed module can put on an element: the literal ones
// and the values of the lookup tables a conditional compiles to.
const referencedClasses = (code: string) => {
  const keys = lookupKeys(code);
  return new Set(
    [...code.matchAll(/"([^"\\]*)"/g)]
      .flatMap((match) => match[1].split(/\s+/))
      .filter((token) => /^x[0-9a-z]{4,}$/.test(token) && !keys.has(token)),
  );
};

let count = 0;

const both = async (source: string) => {
  fixturePath = path.join(DIRECTORY, `fixture-${count++}.tsx`);
  fs.writeFileSync(fixturePath, source, 'utf-8');

  const compiled = compileCSS({
    include: [path.basename(fixturePath)],
    exclude: ['**'],
    cwd: DIRECTORY,
  });

  const transformed = await transformSource({
    source,
    moduleId: fixturePath,
    filePath: fixturePath,
    root: DIRECTORY,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
  });

  return { compiled, transformed };
};

afterAll(() => fs.rmSync(DIRECTORY, { recursive: true, force: true }));

const CASES: Array<[string, string]> = [
  [
    'a conditional entry in a classStyle array',
    `
    import * as css from '@plumeria/core';
    const s = css.create({
      base: { color: 'green' },
      on: { color: 'purple', fontSize: '20px' },
    });
    export const A = ({ on }: { on: boolean }) => (
      <div classStyle={[s.base, on && s.on]} />
    );
    `,
  ],
  [
    'two bracket groups colliding over one property',
    `
    import * as css from '@plumeria/core';
    const size = css.create({
      small: { fontSize: '12px', padding: '4px' },
      large: { fontSize: '20px', padding: '8px' },
    });
    const tone = css.create({
      calm: { fontSize: '14px', color: 'teal' },
      loud: { color: 'crimson' },
    });
    export const A = ({ s, t }: { s: 'small' | 'large'; t: 'calm' | 'loud' }) => (
      <div classStyle={[size[s], tone[t]]} />
    );
    `,
  ],
  [
    'a bracket group whose option sets none of the colliding properties',
    `
    import * as css from '@plumeria/core';
    const a = css.create({
      one: { color: 'green' },
      two: { color: 'purple' },
    });
    const b = css.create({
      none: { margin: '4px' },
      some: { color: 'teal' },
    });
    export const A = ({ x, y }: { x: 'one' | 'two'; y: 'none' | 'some' }) => (
      <div classStyle={[a[x], b[y]]} />
    );
    `,
  ],
  [
    'two bracket groups that collide over nothing',
    `
    import * as css from '@plumeria/core';
    const a = css.create({
      one: { color: 'green' },
      two: { color: 'purple' },
    });
    const b = css.create({
      thin: { borderWidth: '1px' },
      thick: { borderWidth: '4px' },
    });
    export const A = ({ x, y }: { x: 'one' | 'two'; y: 'thin' | 'thick' }) => (
      <div classStyle={[a[x], b[y]]} />
    );
    `,
  ],
  [
    'a conditional over a pseudo state',
    `
    import * as css from '@plumeria/core';
    const s = css.create({
      base: { color: 'green', ':hover': { color: 'purple' } },
      on: { color: 'teal', ':hover': { color: 'crimson' } },
    });
    export const A = ({ on }: { on: boolean }) => (
      <div classStyle={[s.base, on && s.on]} />
    );
    `,
  ],
  [
    'a conditional inside a media query',
    `
    import * as css from '@plumeria/core';
    const s = css.create({
      base: { color: 'green', '@media (width >= 600px)': { color: 'purple' } },
      on: { color: 'teal', '@media (width >= 600px)': { color: 'crimson' } },
    });
    export const A = ({ on }: { on: boolean }) => (
      <div classStyle={[s.base, on && s.on]} />
    );
    `,
  ],
  [
    'a dynamic style function',
    `
    import * as css from '@plumeria/core';
    const s = css.create({
      box: (w: number) => ({ width: w, color: 'green' }),
    });
    export const A = ({ w }: { w: number }) => <div classStyle={s.box(w)} />;
    `,
  ],
  [
    'a bracket group relayed through css.use',
    `
    import * as css from '@plumeria/core';
    const s = css.create({
      one: { color: 'green', padding: '4px' },
      two: { color: 'purple', padding: '8px' },
    });
    export const cls = ({ k }: { k: 'one' | 'two' }) => css.use(s[k]);
    `,
  ],
  [
    'a style prop relayed into a child component',
    `
    import * as css from '@plumeria/core';
    const s = css.create({
      base: { color: 'green' },
      loud: { color: 'crimson', fontWeight: 700 },
    });
    const Card = ({ classStyle }: { classStyle?: css.Style }) => (
      <div classStyle={[s.base, classStyle]} />
    );
    export const A = ({ on }: { on: boolean }) => <Card classStyle={on && s.loud} />;
    `,
  ],
  [
    'three groups colliding in a chain',
    `
    import * as css from '@plumeria/core';
    const a = css.create({ p: { color: 'green' }, q: { color: 'purple' } });
    const b = css.create({ p: { color: 'teal', margin: '2px' }, q: { margin: '4px' } });
    const c = css.create({ p: { margin: '6px' }, q: { margin: '8px' } });
    export const A = ({ x, y, z }: { x: 'p' | 'q'; y: 'p' | 'q'; z: 'p' | 'q' }) => (
      <div classStyle={[a[x], b[y], c[z]]} />
    );
    `,
  ],
];

describe('compileCSS covers what transformSource emits', () => {
  it.each(CASES)('%s', async (_name, source) => {
    const { compiled, transformed } = await both(source);
    const defined = definedClasses(compiled);

    const missingRules = [...definedClasses(transformed.sheets.join('\n'))]
      .filter((name) => !defined.has(name))
      .sort();
    expect(missingRules).toEqual([]);

    const missingReferences = [...referencedClasses(transformed.code)]
      .filter((name) => !defined.has(name))
      .sort();
    expect(missingReferences).toEqual([]);
  });
});
