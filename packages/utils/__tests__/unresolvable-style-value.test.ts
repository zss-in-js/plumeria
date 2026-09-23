jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));

import { transformSource } from '../src/transform';
import { DEFAULT_STYLE_PROP } from '../src/constants';

const env = (source: string) => ({
  source,
  moduleId: `${__dirname}/fixture.tsx`,
  filePath: `${__dirname}/fixture.tsx`,
  root: process.cwd(),
  styleProp: DEFAULT_STYLE_PROP,
  propertyPolicy: undefined,
  isDev: false,
  collectOndemandSheets: true,
  addDependency: () => {},
});

const run = (body: string) =>
  transformSource(env(`import * as css from '@plumeria/core';\n${body}`));

const UNRESOLVABLE = /Cannot resolve the value of/;

describe('css.create: a value the build cannot resolve', () => {
  it.each([
    [
      'a method chain',
      `const s = css.create({ a: { letterSpacing: ['0.7', '89px'].join('') } });`,
    ],
    [
      'a function call',
      `const read = () => '1px';\nconst s = css.create({ a: { letterSpacing: read() } });`,
    ],
    [
      'a constructor call',
      `const s = css.create({ a: { letterSpacing: new Size() } });`,
    ],
    [
      'a tagged template',
      `const s = css.create({ a: { letterSpacing: size\`1\` } });`,
    ],
    [
      'a ternary',
      `const wide = true;\nconst s = css.create({ a: { letterSpacing: wide ? '2px' : '1px' } });`,
    ],
    [
      'an array literal',
      `const s = css.create({ a: { letterSpacing: [1, 2] } });`,
    ],
    [
      'a local const holding a call',
      `const read = () => '1px';\nconst SIZE = read();\nconst s = css.create({ a: { letterSpacing: SIZE } });`,
    ],
    [
      'a local const holding a method chain',
      `const SIZE = ['0.7', '89px'].join('');\nconst s = css.create({ a: { letterSpacing: SIZE } });`,
    ],
    [
      'an identifier that is declared nowhere',
      `const s = css.create({ a: { letterSpacing: NOPE } });`,
    ],
    [
      'a member expression that resolves to nothing',
      `const s = css.create({ a: { letterSpacing: tokens.size.lg } });`,
    ],
    [
      'a value nested under a selector',
      `const s = css.create({ a: { ':hover': { letterSpacing: read() } } });`,
    ],
  ])('rejects %s', async (_label, body) => {
    await expect(run(body)).rejects.toThrow(UNRESOLVABLE);
  });

  it('still rejects a value a later spread does not overwrite', async () => {
    await expect(
      run(
        `const override = { b: { fontSize: '2px' } };\nconst s = css.create({ a: { letterSpacing: read() }, ...override });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('still rejects a nested value a later spread does not overwrite', async () => {
    await expect(
      run(
        `const override = { color: 'red' };\nconst s = css.create({ a: { ':hover': { letterSpacing: read() }, ...override } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects a value dropped inside the const a style spreads in', async () => {
    await expect(
      run(
        `const tokens = { letterSpacing: read(), fontSize: '2px' };\nconst s = css.create({ a: { ...tokens, color: 'red' } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects it under a selector too', async () => {
    await expect(
      run(
        `const tokens = { letterSpacing: read() };\nconst s = css.create({ a: { ':hover': { ...tokens, color: 'red' } } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('still rejects a value written before a createStatic spread', async () => {
    await expect(
      run(
        `const flexBox = css.createStatic({ display: 'flex' });\nconst s = css.create({ a: { letterSpacing: read(), ...flexBox } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('still rejects a value written after a createStatic spread', async () => {
    await expect(
      run(
        `const flexBox = css.createStatic({ display: 'flex' });\nconst s = css.create({ a: { ...flexBox, letterSpacing: read() } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('still rejects a value a spread written before it cannot reach', async () => {
    await expect(
      run(
        `const override = { b: { fontSize: '2px' } };\nconst s = css.create({ ...override, a: { letterSpacing: read() } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects a stray call beside a parameter in a style function', async () => {
    await expect(
      run(
        `const s = css.create({ a: (w: string) => ({ width: w, letterSpacing: read() }) });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects one nested under a selector in a style function', async () => {
    await expect(
      run(
        `const s = css.create({ a: (w: string) => ({ width: w, ':hover': { letterSpacing: read() } }) });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('names the property and the expression it could not resolve', async () => {
    await expect(
      run(`const s = css.create({ a: { letterSpacing: read() } });`),
    ).rejects.toThrow(/"letterSpacing".*CallExpression/);
  });

  it('points at the function form as the way to pass a runtime value', async () => {
    await expect(
      run(`const s = css.create({ a: { letterSpacing: read() } });`),
    ).rejects.toThrow(
      /css\.create\(\{ name: \(value\) => \(\{ \.\.\. \}\) \}\)/,
    );
  });
});

describe('the other style entry points reject it the same way', () => {
  it('rejects it in createStatic', async () => {
    await expect(
      run(`const s = css.createStatic({ letterSpacing: read() });`),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects it in createTheme', async () => {
    await expect(
      run(
        `const s = css.createTheme('.dark', { size: { default: read(), theme: '1px' } });`,
      ),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects it in keyframes', async () => {
    await expect(
      run(`const s = css.keyframes({ from: { letterSpacing: read() } });`),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it('rejects it in viewTransition', async () => {
    await expect(
      run(`const s = css.viewTransition({ old: { letterSpacing: read() } });`),
    ).rejects.toThrow(UNRESOLVABLE);
  });

  it.each([
    ['createStatic', `const s = css.createStatic({ display: 'flex' });`],
    [
      'createTheme',
      `const s = css.createTheme('.dark', { size: { default: '1px', theme: '2px' } });`,
    ],
    ['keyframes', `const s = css.keyframes({ from: { opacity: 0 } });`],
  ])('leaves a resolvable %s alone', async (_label, body) => {
    await expect(run(body)).resolves.toBeDefined();
  });
});

describe('css.create: values that stay accepted', () => {
  it.each([
    ['a literal', `const s = css.create({ a: { letterSpacing: '1px' } });`],
    ['a numeric literal', `const s = css.create({ a: { lineHeight: 2 } });`],
    ['null', `const s = css.create({ a: { letterSpacing: null } });`],
    [
      'a local const holding a literal',
      `const SIZE = '0.5px';\nconst s = css.create({ a: { letterSpacing: SIZE } });`,
    ],
    [
      'a template literal built from resolvable parts',
      `const SIZE = 4;\nconst s = css.create({ a: { letterSpacing: \`\${SIZE}px\` } });`,
    ],
    [
      'a nested selector',
      `const s = css.create({ a: { ':hover': { letterSpacing: '1px' } } });`,
    ],
    [
      'a media query',
      `const s = css.create({ a: { '@media screen and (min-width: 800px)': { letterSpacing: '1px' } } });`,
    ],
    [
      'a style function, which is how a runtime value is passed',
      `const s = css.create({ a: (width: string) => ({ letterSpacing: width }) });`,
    ],
    [
      'a style function reading a destructured parameter',
      `const s = css.create({ a: ({ w }: { w: string }) => ({ width: w }) });`,
    ],
    [
      'a style function with a default parameter',
      `const s = css.create({ a: (n: number = 0) => ({ width: \`\${n}%\` }) });`,
    ],
    [
      'a call inside a style function that reads the parameter',
      `const s = css.create({ a: (n: number) => ({ width: String(n) }) });`,
    ],
    [
      'a spread of a resolvable object',
      `const base = { color: 'red' };\nconst s = css.create({ a: { ...base, letterSpacing: '1px' } });`,
    ],
    [
      'a computed key',
      `const name = 'a';\nconst s = css.create({ [name]: { letterSpacing: '1px' } });`,
    ],
    [
      'a key a later spread overrides',
      `const override = { a: { fontSize: '2px' } };\nconst s = css.create({ a: { color: 'red' }, ...override });`,
    ],
    [
      'a nested key a later spread overrides',
      `const override = { ':hover': { fontSize: '2px' } };\nconst s = css.create({ a: { ':hover': { color: 'red' }, ...override } });`,
    ],
    [
      'a key written twice, where the later one wins',
      `const s = css.create({ a: { color: 'red' }, a: { fontSize: '2px' } });`,
    ],
    [
      'a const spread whose own values all resolve',
      `const tokens = { fontSize: '2px' };\nconst s = css.create({ a: { ...tokens, color: 'red' } });`,
    ],
    [
      'a const that is never spread into a style',
      `const misc = { x: read() };\nexport const keep = misc;\nconst s = css.create({ a: { color: 'red' } });`,
    ],
    [
      'a createStatic spread that carries the key',
      `const flexBox = css.createStatic({ display: 'flex' });\nconst s = css.create({ a: { ...flexBox, color: 'red' } });`,
    ],
    [
      'a key a spread written before it does not reach',
      `const override = { b: { fontSize: '2px' } };\nconst s = css.create({ ...override, a: { color: 'red' } });`,
    ],
  ])('accepts %s', async (_label, body) => {
    await expect(run(body)).resolves.toBeDefined();
  });
});
