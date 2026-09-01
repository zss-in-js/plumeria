// A component may receive a style through a prop and apply it to the element it
// renders, on its own or merged under a base. Passing that prop on to another
// component is where it stops: the style would have to be resolved across an
// arbitrary chain of wrappers, so it is rejected at build time instead.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const STYLES = path.join(DIR, 'styles.ts');
const LEAF = path.join(DIR, 'Leaf.tsx');
const MERGED = path.join(DIR, 'Merged.tsx');
const RELAY = path.join(DIR, 'Relay.tsx');
const RENAMED = path.join(DIR, 'Renamed.tsx');
const PASSTHROUGH = path.join(DIR, 'Passthrough.tsx');
const VIA_LOCAL = path.join(DIR, 'ViaLocal.tsx');
const COHABIT = path.join(DIR, 'Cohabit.tsx');
const MASKED = path.join(DIR, 'Masked.tsx');
const RENAMED_BINDING = path.join(DIR, 'RenamedBinding.tsx');
const TWINS = path.join(DIR, 'Twins.tsx');
const DEFAULT_TWINS = path.join(DIR, 'DefaultTwins.tsx');
const WRAPPED = path.join(DIR, 'Wrapped.tsx');
const WRAPPED_RELAY = path.join(DIR, 'WrappedRelay.tsx');
const WRAPPED_UNUSED = path.join(DIR, 'WrappedUnused.tsx');
const PARENT = path.join(DIR, 'Parent.tsx');

jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
const mockedGlob = jest.requireMock<{ globSync: jest.Mock }>('@rust-gear/glob');

import { unpluginFactory } from '../src/core';
import { getStyleRecords, deepMerge } from '@plumeria/utils';

const RED = { padding: 4, color: 'red' };
const BLUE = { padding: 8, color: 'blue' };
const BASE = { padding: 24, fontWeight: 700, color: 'green' };

const files: Record<string, string> = {
  [STYLES]: `
import * as css from '@plumeria/core';
export const styles = css.create(${JSON.stringify({
    red: RED,
    blue: BLUE,
    base: BASE,
  })});
`,
  [LEAF]: `
import * as css from '@plumeria/core';
export const Leaf = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
`,
  [MERGED]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
export const Merged = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={[styles.base, styleArray]} />
);
`,
  [RELAY]: `
import * as css from '@plumeria/core';
import { Leaf } from './Leaf';
export const Relay = ({ styleArray }: { styleArray?: css.Style }) => (
  <Leaf styleArray={styleArray} />
);
`,
  [RENAMED]: `
import * as css from '@plumeria/core';
import { Leaf } from './Leaf';
export const Renamed = ({ styleArray }: { styleArray?: css.Style }) => (
  <Leaf styleArray={[styleArray]} />
);
`,
  [COHABIT]: `
import * as css from '@plumeria/core';
import { Leaf } from './Leaf';
export const Applies = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
export const Forwards = ({ styleArray }: { styleArray?: css.Style }) => (
  <Leaf styleArray={styleArray} />
);
`,
  [MASKED]: `
import * as css from '@plumeria/core';
import { Leaf } from './Leaf';
const wrap = (component: unknown) => component;
export const WrappedApplies = wrap(({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
));
export const MaskedForwards = ({ styleArray }: { styleArray?: css.Style }) => (
  <Leaf styleArray={styleArray} />
);
`,
  [VIA_LOCAL]: `
import * as css from '@plumeria/core';
export const ViaLocal = ({ styleArray }: { styleArray?: css.Style }) => {
  const applied = styleArray;
  return <div classStyle={applied} />;
};
`,
  [RENAMED_BINDING]: `
import * as css from '@plumeria/core';
import { Leaf } from './Leaf';
export const RenamedBinding = ({ styleArray: s }: { styleArray?: css.Style }) => (
  <Leaf styleArray={s} />
);
`,
  [PASSTHROUGH]: `
import '@plumeria/core';
import { Leaf } from './Leaf';
export const Passthrough = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Leaf aria-label={label} onClick={onPress} />
);
`,
  [TWINS]: `
import * as css from '@plumeria/core';
export const TwinA = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
export const TwinB = ({ styleArray }: { styleArray?: css.Style }) => (
  <span classStyle={styleArray} />
);
`,
  [DEFAULT_TWINS]: `
import * as css from '@plumeria/core';
export default function TwinDefault({ styleArray }: { styleArray?: css.Style }) {
  return <div classStyle={styleArray} />;
}
export const TwinNamed = ({ styleArray }: { styleArray?: css.Style }) => (
  <section classStyle={styleArray} />
);
`,
  [WRAPPED]: `
import * as css from '@plumeria/core';
const wrap = (component: unknown) => component;
export const Sibling = ({ styleArray }: { styleArray?: css.Style }) => (
  <div classStyle={styleArray} />
);
export const Wrapped = wrap(({ styleArray }: { styleArray?: css.Style }) => (
  <span classStyle={styleArray} />
));
`,
  [WRAPPED_RELAY]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
const memo = (component: unknown) => component;
export const WrappedRelay = memo(({ styleArray }: { styleArray?: css.Style }) => (
  <Leaf styleArray={styleArray} />
));
export const CallsWrappedRelay = () => <WrappedRelay styleArray={styles.red} />;
`,
  [WRAPPED_UNUSED]: `
import * as css from '@plumeria/core';
import { styles } from './styles';
const memo = (component: unknown) => component;
export const WrappedUnused = memo(({ label }: { label?: string; styleArray?: css.Style }) => (
  <div>{label}</div>
));
export const CallsWrappedUnused = () => <WrappedUnused styleArray={styles.red} />;
`,
  [PARENT]: `
import '@plumeria/core';
import { styles } from './styles';
import { Leaf } from './Leaf';
import { Merged } from './Merged';
import { Relay } from './Relay';
import { Renamed } from './Renamed';
import { ViaLocal } from './ViaLocal';
import { Applies, Forwards } from './Cohabit';
import { WrappedApplies, MaskedForwards } from './Masked';
import { RenamedBinding } from './RenamedBinding';
import { TwinA, TwinB } from './Twins';
import TwinDefault from './DefaultTwins';
import { Sibling, Wrapped } from './Wrapped';
import { TwinNamed } from './DefaultTwins';

export const Parent = () => (
  <div>
    <Leaf styleArray={styles.red} />
    <Merged styleArray={styles.red} />
    <Merged styleArray={styles.blue} />
    <Relay styleArray={styles.blue} />
    <Renamed styleArray={styles.blue} />
    <ViaLocal styleArray={styles.blue} />
    <Applies styleArray={styles.red} />
    <Forwards styleArray={styles.blue} />
    <WrappedApplies styleArray={styles.red} />
    <MaskedForwards styleArray={styles.blue} />
    <RenamedBinding styleArray={styles.blue} />
    <Sibling styleArray={styles.red} />
    <Wrapped styleArray={styles.blue} />
    <TwinNamed styleArray={styles.red} />
    <TwinDefault styleArray={styles.blue} />
    <TwinA styleArray={styles.red} />
    <TwinB styleArray={styles.blue} />
  </div>
);
`,
};

const run = async (file: string): Promise<string> => {
  const plugin = unpluginFactory(undefined, {
    framework: 'vite',
  } as never) as any;
  const result = await plugin.transform.call(
    { addWatchFile: () => {} },
    files[file],
    file,
  );
  return result.code;
};

const classesOf = (style: Record<string, unknown>) =>
  getStyleRecords(style as never)
    .map((r) => r.hash)
    .sort()
    .join(' ');

const norm = (value: string) => value.trim().split(/\s+/).sort().join(' ');

beforeAll(() => {
  for (const [p, src] of Object.entries(files)) fs.writeFileSync(p, src);
  mockedGlob.globSync.mockReturnValue(Object.keys(files));
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('unplugin: a style received through a prop', () => {
  it('applies to the element that received it', async () => {
    await run(PARENT);
    const code = await run(LEAF);
    const table: Record<string, string> = JSON.parse(
      code.match(/\{("\w+":"[\w ]+",?)+\}/)![0],
    );
    expect(Object.values(table).map(norm)).toEqual([classesOf(RED)]);
  });

  it('merges under a base style on that same element', async () => {
    const keys = [...(await run(PARENT)).matchAll(/styleArray={"(\w+)"}/g)].map(
      (m) => m[1],
    );
    const code = await run(MERGED);
    const expr = code.match(/className=\{([\s\S]*?)\}(?= \/>)/)![1];
    const render = (styleArray: unknown) =>
      norm(new Function('styleArray', `return (${expr});`)(styleArray));

    // The parent passes red to Leaf and to Merged, so the keys repeat by
    // content: [Leaf red, Merged red, Merged blue, ...].
    expect(render(keys[1])).toBe(norm(classesOf(deepMerge(BASE, RED))));
    expect(render(keys[2])).toBe(norm(classesOf(deepMerge(BASE, BLUE))));
    expect(render(undefined)).toBe(norm(classesOf(BASE)));
  });

  // Two components in one file that take the same prop name must not share one
  // lookup table: the second would render with the first one's keys.
  it('keeps two components declared in one file apart', async () => {
    const keys = [...(await run(PARENT)).matchAll(/styleArray={"(\w+)"}/g)].map(
      (m) => m[1],
    );
    const code = await run(TWINS);
    const exprs = [...code.matchAll(/className=\{([\s\S]*?)\}(?= \/>)/g)].map(
      (m) => m[1],
    );
    const render = (expr: string, styleArray: unknown) =>
      norm(new Function('styleArray', `return (${expr});`)(styleArray));

    expect(render(exprs[0], keys[keys.length - 2])).toBe(norm(classesOf(RED)));
    expect(render(exprs[1], keys[keys.length - 1])).toBe(norm(classesOf(BLUE)));
  });

  // A default export is registered under the name it is declared with, so a
  // named component sharing its file and its prop name cannot stand in for it.
  // Registered first, that neighbour is what a name-less lookup finds.
  it('keeps a default export apart from a named one in the same file', async () => {
    const keys = [...(await run(PARENT)).matchAll(/styleArray={"(\w+)"}/g)].map(
      (m) => m[1],
    );
    const code = await run(DEFAULT_TWINS);
    const exprs = [...code.matchAll(/className=\{([\s\S]*?)\}(?= \/>)/g)].map(
      (m) => m[1],
    );
    const render = (expr: string, styleArray: unknown) =>
      norm(new Function('styleArray', `return (${expr});`)(styleArray));

    expect(render(exprs[0], keys[keys.length - 3])).toBe(norm(classesOf(BLUE)));
    expect(render(exprs[1], keys[keys.length - 4])).toBe(norm(classesOf(RED)));
  });

  // A wrapper leaves the component as a function argument of a call, which is
  // still the component the styles were handed to.
  it('applies to a component a call wraps', async () => {
    const keys = [...(await run(PARENT)).matchAll(/styleArray={"(\w+)"}/g)].map(
      (m) => m[1],
    );
    const code = await run(WRAPPED);
    const exprs = [...code.matchAll(/className=\{([\s\S]*?)\}(?= \/>)/g)].map(
      (m) => m[1],
    );
    const render = (expr: string, styleArray: unknown) =>
      norm(new Function('styleArray', `return (${expr});`)(styleArray));

    expect(render(exprs[0], keys[keys.length - 6])).toBe(norm(classesOf(RED)));
    expect(render(exprs[1], keys[keys.length - 5])).toBe(norm(classesOf(BLUE)));
  });

  // Wrapping a component used to put it out of reach of this rule, so the same
  // code compiled or not depending on whether a call stood in front of it.
  it('is rejected when a wrapped component passes it on', async () => {
    await expect(run(WRAPPED_RELAY)).rejects.toThrow(
      /"styleArray" is a style received through a prop but is never applied/,
    );
  });

  it('is rejected when a wrapped component never applies it', async () => {
    await expect(run(WRAPPED_UNUSED)).rejects.toThrow(
      /a style prop cannot be passed on to another component/,
    );
  });

  it('is rejected when passed on to another component', async () => {
    await run(PARENT);
    await expect(run(RELAY)).rejects.toThrow(
      /"styleArray" is a style received through a prop but is never applied/,
    );
  });

  it('is rejected inside an array too', async () => {
    await run(PARENT);
    await expect(run(RENAMED)).rejects.toThrow(
      /a style prop cannot be passed on to another component/,
    );
  });

  it('reports where the relay is written', async () => {
    await run(PARENT);
    await expect(run(RELAY)).rejects.toThrow(/\(Relay\.tsx:\d+:\d+\)/);
  });

  it('is rejected when the binding was renamed by destructuring', async () => {
    await run(PARENT);
    await expect(run(RENAMED_BINDING)).rejects.toThrow(/is never applied/);
  });

  it('is rejected when routed through a local variable', async () => {
    await run(PARENT);
    await expect(run(VIA_LOCAL)).rejects.toThrow(
      /Dynamic or unresolvable style object "applied"/,
    );
  });

  it('is rejected even when a sibling component in the same file applies it', async () => {
    await run(PARENT);
    await expect(run(COHABIT)).rejects.toThrow(/is never applied/);
    // Line 7 declares Forwards; Applies sits above it and must not be blamed.
    await expect(run(COHABIT)).rejects.toThrow(/\(Cohabit\.tsx:7:\d+\)/);
  });

  it('is rejected even when a wrapper-invoked component applies the same prop name', async () => {
    await run(PARENT);
    await expect(run(MASKED)).rejects.toThrow(/is never applied/);
  });

  it('leaves ordinary props alone', async () => {
    await run(PARENT);
    await expect(run(PASSTHROUGH)).resolves.toContain('aria-label={label}');
  });
});
