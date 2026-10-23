import * as fs from 'fs';
import * as path from 'path';
import { RuleTester } from 'eslint';
import { parse } from '@typescript-eslint/parser';
import type { Rule } from 'eslint';
import * as scan from '../../src/util/scan';

const files: string[] = [];
jest.mock(
  require.resolve('@rust-gear/glob', {
    paths: [require('path').join(__dirname, '../../../utils')],
  }),
  () => ({ globSync: jest.fn(() => files) }),
);
jest.mock('../../src/util/scan', () => {
  const actual = jest.requireActual('../../src/util/scan');
  return { ...actual, scanTables: jest.fn(actual.scanTables) };
});

import { noStylePropRelay } from '../../src/rules/no-style-prop-relay';
import plugin from '../../src';

const DIR = fs.mkdtempSync(path.join(__dirname, 'fixture-'));
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

const write = (name: string, source: string) => {
  const filePath = path.join(DIR, name);
  fs.writeFileSync(filePath, source);
  files.push(filePath);
  return filePath;
};

const components: Record<string, string> = {
  Applied: `export const Applied = ({ headerStyle }) => <header classStyle={[styles.base, headerStyle]} />;`,
  Renamed: `export const Renamed = ({ headerStyle: s }) => <header classStyle={s} />;`,
  Member: `export const Member = (props) => <header classStyle={props.headerStyle} />;`,
  Used: `export const Used = ({ headerStyle }) => <header className={css.use(headerStyle)} />;`,
  Both: `export const Both = ({ headerStyle }) => <header classStyle={headerStyle}><Title titleStyle={headerStyle} /></header>;`,
  Custom: `export const Custom = ({ headerStyle }) => <header sx={headerStyle} />;`,
  Module: `export const Module = ({ headerStyle }) => <header classStyle={headerStyle}><Header headerStyle={styles.base} /></header>;`,
  Forward: `export const Forward = ({ headerStyle }) => <Header headerStyle={headerStyle} />;`,
  Rename: `export const Rename = ({ headerStyle }) => <Header rootStyle={headerStyle} />;`,
  Merge: `export const Merge = ({ headerStyle }) => <Header headerStyle={[styles.base, headerStyle]} />;`,
  Rest: `export const Rest = ({ children, ...rest }) => <Header {...rest}>{children}</Header>;`,
  Local: `export const Local = ({ headerStyle }) => { const s = headerStyle; return <Header headerStyle={s} />; };`,
  Props: `export const Props = (props) => <Header headerStyle={props.headerStyle} />;`,
  Default: `export default function ({ headerStyle }) { return <Header headerStyle={headerStyle} />; }`,
  Pass: `import { Receiver } from './receiver';\nexport const Pass = ({ headerStyle }) => <Receiver classStyle={headerStyle} />;`,
  PassBoth: `import { Receiver } from './receiver';\nexport const PassBoth = ({ headerStyle }) => <header classStyle={headerStyle}><Receiver classStyle={headerStyle} /></header>;`,
  PassLocal: `const Inner = ({ classStyle } = {}) => <i classStyle={classStyle} />;\nexport const PassLocal = ({ headerStyle }) => <Inner classStyle={headerStyle} />;`,
  PassPlain: `import { Plain } from './receiver';\nexport const PassPlain = ({ headerStyle }) => <Plain classStyle={headerStyle} />;`,
  PassPackage: `import { Menu } from '@headlessui/react';\nexport const PassPackage = ({ headerStyle }) => <Menu classStyle={headerStyle} />;`,
  PassDefault: `import Receiver from './default-receiver';\nexport const PassDefault = ({ headerStyle }) => <Receiver classStyle={headerStyle} />;`,
  PassBroken: `import { Receiver } from './broken';\nexport const PassBroken = ({ headerStyle }) => <Receiver classStyle={headerStyle} />;`,
  PassMember: `import * as ui from './receiver';\nexport const PassMember = ({ headerStyle }) => <ui.Receiver classStyle={headerStyle} />;`,
  PassStatic: `import { Receiver } from './receiver';\nexport const PassStatic = ({ headerStyle }) => <header classStyle={headerStyle}><Receiver classStyle={styles.base} /><Receiver classStyle={styles.base} /></header>;`,
};

write(
  'receiver.jsx',
  `export function Receiver({ classStyle }) { return <div classStyle={classStyle} />; }
export const Plain = (props) => <div classStyle={props.classStyle} />;`,
);
write(
  'default-receiver.jsx',
  `function Receiver({ classStyle }) { return <div classStyle={classStyle} />; }
export default Receiver;`,
);
write(
  'broken.tsx',
  `export const Receiver = ({ classStyle }: Props) => <div classStyle={classStyle} />;`,
);

const prelude = `import * as css from '@plumeria/core';\nconst styles = css.create({ base: { color: 'red' } });\n`;
const paths: Record<string, string> = {};
for (const [name, body] of Object.entries(components)) {
  paths[name] = write(`${name}.jsx`, prelude + body);
}
write(
  'App.jsx',
  `import * as css from '@plumeria/core';
${Object.keys(components)
  .map((name) =>
    name === 'Default'
      ? `import Default from './Default';`
      : `import { ${name} } from './${name}';`,
  )
  .join('\n')}
const styles = css.create({ a: { color: 'teal' } });
export const App = () => (
  <>
${Object.keys(components)
  .map((name) => `    <${name} headerStyle={styles.a} />`)
  .join('\n')}
  </>
);`,
);

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
});

const valid = (name: string, settings?: Record<string, unknown>) => ({
  code: fs.readFileSync(paths[name], 'utf8'),
  filename: paths[name],
  ...(settings ? { settings } : {}),
});

const invalid = (name: string) => ({
  code: fs.readFileSync(paths[name], 'utf8'),
  filename: paths[name],
  errors: [
    {
      messageId: 'relay',
      data: { prop: 'headerStyle', styleProp: 'classStyle' },
    },
  ],
});

const passed = (name: string) => ({
  code: fs.readFileSync(paths[name], 'utf8'),
  filename: paths[name],
  errors: [
    {
      messageId: 'receiver',
      data: { prop: 'headerStyle', styleProp: 'classStyle' },
    },
  ],
});

ruleTester.run('no-style-prop-relay', noStylePropRelay, {
  valid: [
    valid('Applied'),
    valid('Renamed'),
    valid('Member'),
    valid('Used'),
    valid('Both'),
    valid('Module'),
    valid('PassPlain'),
    valid('PassPackage'),
    valid('PassStatic'),
    valid('PassBroken'),
    valid('PassMember'),
  ],
  invalid: [
    invalid('Forward'),
    invalid('Rename'),
    invalid('Merge'),
    invalid('Rest'),
    invalid('Local'),
    invalid('Props'),
    invalid('Default'),
    invalid('Custom'),
    passed('Pass'),
    passed('PassBoth'),
    passed('PassLocal'),
    passed('PassDefault'),
  ],
});

new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
}).run('no-style-prop-relay with a parseForESLint parser', noStylePropRelay, {
  valid: [valid('PassPlain')],
  invalid: [passed('Pass')],
});

test('skips an imported component when no parser is available', () => {
  write(
    'unparsed.jsx',
    `export const Receiver = ({ classStyle }) => <div classStyle={classStyle} />;`,
  );
  expect(
    reportsFor(
      `import { Receiver } from './unparsed';\nexport const Pass = ({ headerStyle }) => <Receiver classStyle={headerStyle} />;`,
      paths.Pass,
    ),
  ).toHaveLength(0);
});

test('enabled as an error in recommended', () => {
  expect(plugin.rules['no-style-prop-relay']).toBe(noStylePropRelay);
  expect(
    plugin.configs.recommended.rules?.['@plumeria/no-style-prop-relay'],
  ).toBe('error');
});

const reportsForProgram = (program: unknown, filename = paths.Forward) => {
  const reports: Rule.ReportDescriptor[] = [];
  const context = {
    cwd: DIR,
    filename,
    options: [],
    settings: {},
    report: (descriptor: Rule.ReportDescriptor) => reports.push(descriptor),
  } as unknown as Rule.RuleContext;
  noStylePropRelay.create(context).Program?.(program as never);
  return reports;
};

const reportsFor = (source: string, filename = paths.Forward) =>
  reportsForProgram(
    parse(source, {
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
    }),
    filename,
  );

test('reports a file linted under a path that is not its real one', () => {
  const linked = path.join(DIR, 'linked-Forward.jsx');
  fs.symlinkSync(paths.Forward, linked);
  const reports = reportsFor(fs.readFileSync(paths.Forward, 'utf8'), linked);
  expect(reports).toHaveLength(1);
});

test.each([
  [
    'function declaration',
    'function Forward({ headerStyle }) { return <Header headerStyle={headerStyle} />; }',
  ],
  [
    'defaulted props',
    'const Forward = ({ headerStyle } = {}) => <Header headerStyle={headerStyle} />;',
  ],
  [
    'defaulted property',
    'const Forward = ({ headerStyle = null }) => <Header headerStyle={headerStyle} />;',
  ],
  [
    'quoted property',
    "const Forward = ({ 'headerStyle': style }) => <Header headerStyle={style} />;",
  ],
  [
    'numeric property',
    'const Forward = ({ 1: value, headerStyle }) => <Header headerStyle={headerStyle} />;',
  ],
  [
    'nested property',
    'const Forward = ({ headerStyle: { value } }) => <Header headerStyle={value} />;',
  ],
  [
    'wrapped component',
    'const Forward = memo(config, observer(({ headerStyle }) => <Header headerStyle={headerStyle} />));',
  ],
])('reports relayed style props in %s', (_name, source) => {
  const reports = reportsFor(source);
  expect(reports).toHaveLength(1);
  expect(reports[0].data).toEqual({
    prop: 'headerStyle',
    styleProp: 'classStyle',
  });
});

test.each([
  [
    'array spread',
    'const Forward = ({ headerStyle }) => <div classStyle={[...headerStyle]} />;',
  ],
  [
    'conditional',
    'const Forward = ({ headerStyle }) => <div classStyle={ready ? headerStyle : fallback} />;',
  ],
  [
    'logical expression',
    'const Forward = ({ headerStyle }) => <div classStyle={fallback || headerStyle} />;',
  ],
  [
    'type assertion',
    'const Forward = ({ headerStyle }) => <div classStyle={headerStyle as unknown} />;',
  ],
  [
    'non-null assertion',
    'const Forward = ({ headerStyle }) => <div classStyle={headerStyle!} />;',
  ],
  [
    'satisfies expression',
    'const Forward = ({ headerStyle }) => <div classStyle={headerStyle satisfies unknown} />;',
  ],
  [
    'optional member',
    'const Forward = (props) => <div classStyle={props?.headerStyle} />;',
  ],
  [
    'direct use',
    'const Forward = ({ headerStyle }) => <div className={use(headerStyle)} />;',
  ],
  [
    'lowercase local function',
    'const inner = ({ classStyle }) => <i classStyle={classStyle} />; const Forward = ({ headerStyle }) => <inner classStyle={headerStyle} />;',
  ],
  [
    'identifier without destructuring',
    'const Forward = (props) => { const headerStyle = props.headerStyle; return <div classStyle={headerStyle} />; };',
  ],
])('accepts an applied style prop in %s', (_name, source) => {
  expect(reportsFor(source)).toHaveLength(0);
});

test.each([
  [
    'array hole',
    'const Forward = ({ headerStyle }) => <div classStyle={[ , fallback]} />;',
  ],
  [
    'computed use',
    "const Forward = ({ headerStyle }) => <div className={css['use'](headerStyle)} />;",
  ],
  [
    'different method',
    'const Forward = ({ headerStyle }) => <div className={css.apply(headerStyle)} />;',
  ],
])('reports a relay in %s', (_name, source) => {
  expect(reportsFor(source)).toHaveLength(1);
});

test('ignores programs without a matching component or prop table', () => {
  expect(
    reportsFor(
      'const Other = ({ headerStyle }) => <Header headerStyle={headerStyle} />;',
    ),
  ).toHaveLength(0);
  expect(reportsFor('const Forward = null;')).toHaveLength(0);
  expect(reportsFor('const { Forward } = source;')).toHaveLength(0);
  expect(reportsFor('export { Forward };')).toHaveLength(0);
  expect(
    reportsForProgram({ type: 'Identifier', name: 'Forward' }),
  ).toHaveLength(0);
  expect(
    reportsFor(
      'const Forward = ({ headerStyle }) => <Header headerStyle={headerStyle} />;',
      'missing.jsx',
    ),
  ).toHaveLength(0);
});

test('handles a missing component table', () => {
  jest
    .mocked(scan.scanTables)
    .mockReturnValueOnce({} as ReturnType<typeof scan.scanTables>);
  expect(
    reportsFor(
      'const Forward = ({ headerStyle }) => <Header headerStyle={headerStyle} />;',
    ),
  ).toHaveLength(0);
});

test('handles an uninitialized declarator', () => {
  const program = parse('const Forward = null;', { sourceType: 'module' });
  (program.body[0] as any).declarations[0].init = null;
  expect(reportsForProgram(program)).toHaveLength(0);
});

test('finds a component in a top-level call', () => {
  const program = parse(
    'memo(({ headerStyle }) => <Header headerStyle={headerStyle} />);',
    {
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
    },
  );
  (program.body as any)[0] = (program.body[0] as any).expression;
  expect(reportsForProgram(program, paths.Default)).toHaveLength(1);
});

test('ignores a top-level call without a component', () => {
  const program = parse('memo(config);', { sourceType: 'module' });
  (program.body as any)[0] = (program.body[0] as any).expression;
  expect(reportsForProgram(program, paths.Default)).toHaveLength(0);
});

test('ignores expressions that cannot contain an applied style prop', () => {
  const program = parse(
    'const Forward = ({ headerStyle }) => <div classStyle={headerStyle} />;',
    {
      ecmaFeatures: { jsx: true },
      sourceType: 'module',
    },
  );
  const attribute = (program.body[0] as any).declarations[0].init.body
    .openingElement.attributes[0];
  attribute.value.expression = {
    type: 'Unsupported',
    expression: { type: 'Identifier', name: 'headerStyle' },
  };
  expect(reportsForProgram(program)).toHaveLength(1);
});
