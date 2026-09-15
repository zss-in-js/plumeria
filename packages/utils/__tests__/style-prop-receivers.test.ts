// What a style prop compiles to for each kind of receiver. The receiving half
// already works: a component is given a lookup table keyed by the call sites
// that pass it a style, and a prop of its own name is handed the key. Only the
// call site written with the element's own name is not, and 19.1.7 broke three
// releases trying to change that. These assertions are the fence around the
// behaviour any second attempt has to keep.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const files: string[] = [];
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => files) }));

import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const STYLES = path.join(DIR, 'styles.ts');
const RECEIVERS = path.join(DIR, 'Receivers.tsx');
const APP = path.join(DIR, 'App.tsx');
const UNSEEN = path.join(DIR, 'Unseen.tsx');
const VIA_USE = path.join(DIR, 'ViaUse.tsx');

const sources: Record<string, string> = {
  [STYLES]: `import * as css from '@plumeria/core';
export const styles = css.create({
  base: { fontSize: '14px' },
  a: { color: 'teal' },
  b: { color: 'crimson' },
  box: (w: number) => ({ width: w }),
});`,
  [RECEIVERS]: `import * as css from '@plumeria/core';
import { styles } from './styles';
export const Alone = ({ classStyle }: { classStyle?: css.Style }) => (
  <div classStyle={classStyle} />
);
export const Merged = ({ classStyle }: { classStyle?: css.Style }) => (
  <div classStyle={[styles.base, classStyle]} />
);
export const Renamed = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={[styles.base, styleArray]} />
);
`,
  [APP]: `import '@plumeria/core';
import { styles } from './styles';
import Link from 'next/link';
import { Alone, Merged, Renamed } from './Receivers';
import { UseAlone, UseWithBase, UseListed } from './ViaUse';
export const OnElement = () => <div classStyle={styles.a} />;
export const OnForwarder = () => <Link href="/x" classStyle={styles.a} />;
export const OnAlone = () => <Alone classStyle={styles.a} />;
export const OnMerged = () => <Merged classStyle={styles.a} />;
export const OnRenamed = () => <Renamed styleArray={styles.a} />;
export const OnUseAlone = () => <UseAlone classStyle={styles.a} />;
export const OnUseWithBase = () => <UseWithBase classStyle={styles.a} />;
export const OnUseListed = () => <UseListed classStyle={styles.a} />;
export const Conditional = ({ on }: { on: boolean }) => (
  <Merged classStyle={on && styles.a} />
);
export const Dynamic = ({ w }: { w: number }) => (
  <Merged classStyle={styles.box(w)} />
);
export const DynamicListed = ({ w }: { w: number }) => (
  <Merged classStyle={[styles.a, styles.box(w)]} />
);
export const DynamicOnElement = ({ w }: { w: number }) => (
  <div classStyle={styles.box(w)} />
);`,
  [VIA_USE]: `import * as css from '@plumeria/core';
import { styles } from './styles';
export const UseAlone = ({ classStyle }: { classStyle?: css.StaticStyles }) => (
  <span className={css.use(classStyle)} />
);
export const UseWithBase = ({
  classStyle,
}: {
  classStyle?: css.StaticStyles;
}) => <span className={css.use(styles.base, classStyle)} />;
export const UseListed = ({ classStyle }: { classStyle?: css.StaticStyles }) => (
  <span className={css.use([styles.base, classStyle])} />
);`,
  [UNSEEN]: `import '@plumeria/core';
import { styles } from './styles';
import { Alone } from './Receivers';
export const Unseen = () => <Alone classStyle={styles.b} />;`,
};

const compile = async (filePath: string) => {
  const result = await transformSource({
    source: sources[filePath],
    moduleId: filePath,
    filePath,
    root: DIR,
    styleProp: DEFAULT_STYLE_PROP,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
  });
  return result.code;
};

// A declaration can span lines, so it is read from its name to the next one.
const declarationOf = (code: string, name: string) => {
  const start = code.indexOf(`const ${name} =`);
  const next = code.indexOf('\nexport const ', start + 1);
  return code.slice(start, next === -1 ? undefined : next);
};

beforeAll(() => {
  for (const [filePath, source] of Object.entries(sources))
    fs.writeFileSync(filePath, source);
  // Unseen.tsx is written but left out of the glob, so the scan has no entry
  // for the call site it holds.
  files.splice(0, files.length, STYLES, RECEIVERS, VIA_USE, APP);
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('the receiving half', () => {
  it('gives a component a table keyed by the styles its callers pass', async () => {
    const code = await compile(RECEIVERS);

    // one entry per style reaching it, whatever the prop is called
    expect(declarationOf(code, 'Alone')).toMatch(
      /className=\{\(\{("\w+":"[\w ]+",?)+\}\[classStyle\] \|\| ""\)\}/,
    );
    expect(declarationOf(code, 'Renamed')).toMatch(/\[styleArray\] \|\| ""/);
  });

  it('keeps the component base outside the table it looks up', async () => {
    const code = await compile(RECEIVERS);
    expect(declarationOf(code, 'Merged')).toMatch(/"\w+" \+ " " \+ \(\{/);
  });
});

describe('the call site', () => {
  it('resolves a style on an element where it stands', async () => {
    expect(declarationOf(await compile(APP), 'OnElement')).toContain(
      'className={"',
    );
  });

  // A component the scan never saw keeps the element's reading, which is what
  // one forwarding `className` to its own element needs.
  it('resolves a style on a component it does not know', async () => {
    expect(declarationOf(await compile(APP), 'OnForwarder')).toContain(
      'className={"',
    );
  });

  // Its own declaration says it applies the prop to the attribute an element
  // takes, so it is handed the key its table is built to look up.
  it('hands the key to a component that applies the prop', async () => {
    const code = await compile(APP);
    expect(declarationOf(code, 'OnAlone')).toMatch(/classStyle=\{"\w+"\}/);
    expect(declarationOf(code, 'OnMerged')).toMatch(/classStyle=\{"\w+"\}/);
  });

  // The same mechanism, reached by a name the element does not take.
  it('hands a component the key when the prop has a name of its own', async () => {
    expect(declarationOf(await compile(APP), 'OnRenamed')).toMatch(
      /styleArray=\{"\w+"\}/,
    );
  });

  it('keeps a conditional a conditional', async () => {
    expect(declarationOf(await compile(APP), 'Conditional')).toMatch(
      /classStyle=\{on && "\w+"\}/,
    );
  });

  // `css.use()` is the other place a received style may be applied, and the
  // call site cannot see which of the two a component chose, nor which shape of
  // the call it used. All of them are the same receiver.
  it.each(['UseAlone', 'UseWithBase', 'UseListed'])(
    'hands the key to %s, which applies it through css.use()',
    async (name) => {
      expect(declarationOf(await compile(APP), `On${name}`)).toMatch(
        /classStyle=\{"\w+"\}/,
      );
      expect(declarationOf(await compile(VIA_USE), name)).toMatch(
        /\[classStyle\] \|\| ""/,
      );
    },
  );

  // Only the base differs between the shapes: the lookup is the same, and the
  // one with no base has nothing concatenated in front of it.
  it('concatenates a base only where the call has one', async () => {
    const code = await compile(VIA_USE);

    expect(declarationOf(code, 'UseAlone')).not.toMatch(/"\w+" \+ " " \+ \(\{/);
    expect(declarationOf(code, 'UseWithBase')).toMatch(/"\w+" \+ " " \+ \(\{/);
    expect(declarationOf(code, 'UseListed')).toMatch(/"\w+" \+ " " \+ \(\{/);
  });

  // A dynamic style resolves to a class name and the custom properties the
  // element carries, so the key travels with them and the receiver spreads them
  // onto the element it renders.
  it('carries the variables of a dynamic style with the key', async () => {
    const code = await compile(APP);

    expect(declarationOf(code, 'Dynamic')).toMatch(
      /classStyle=\{\{ key: "\w+", vars: \{ "--[\w-]+": /,
    );
    expect(declarationOf(code, 'DynamicListed')).toMatch(
      /classStyle=\{\{ key: "\w+", vars: \{/,
    );

    const receivers = await compile(RECEIVERS);
    expect(declarationOf(receivers, 'Merged')).toContain(
      '[((classStyle && classStyle.key) || classStyle)]',
    );
    expect(declarationOf(receivers, 'Merged')).toContain(
      'style={{ ...(classStyle && classStyle.vars) }}',
    );
  });

  it('resolves a dynamic style on an element where it stands', async () => {
    const code = declarationOf(await compile(APP), 'DynamicOnElement');
    expect(code).toContain('className={"');
    expect(code).toMatch(/style=\{\{ "--[\w-]+": /);
  });

  // Without an entry there is no key to hand over. Reading the attribute as the
  // element's leaves the call site where it was, rather than emitting one that
  // nothing resolves.
  it('falls back to the element reading for a call site it has no entry for', async () => {
    fs.writeFileSync(UNSEEN, sources[UNSEEN]);
    const result = await transformSource({
      source: sources[UNSEEN],
      moduleId: UNSEEN,
      filePath: UNSEEN,
      root: DIR,
      styleProp: DEFAULT_STYLE_PROP,
      propertyPolicy: undefined,
      isDev: false,
      collectOndemandSheets: true,
      addDependency: () => {},
    });
    expect(declarationOf(result.code, 'Unseen')).toContain('className={"');
  });
});
