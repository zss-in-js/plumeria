import * as fs from 'fs';
import * as path from 'path';
import { RuleTester } from 'eslint';

const files: string[] = [];
jest.mock(
  require.resolve('@rust-gear/glob', {
    paths: [require('path').join(__dirname, '../../../utils')],
  }),
  () => ({ globSync: jest.fn(() => files) }),
);

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
  Forward: `export const Forward = ({ headerStyle }) => <Header headerStyle={headerStyle} />;`,
  Rename: `export const Rename = ({ headerStyle }) => <Header rootStyle={headerStyle} />;`,
  Merge: `export const Merge = ({ headerStyle }) => <Header headerStyle={[styles.base, headerStyle]} />;`,
  Rest: `export const Rest = ({ children, ...rest }) => <Header {...rest}>{children}</Header>;`,
  Local: `export const Local = ({ headerStyle }) => { const s = headerStyle; return <Header headerStyle={s} />; };`,
  Props: `export const Props = (props) => <Header headerStyle={props.headerStyle} />;`,
  Default: `export default function ({ headerStyle }) { return <Header headerStyle={headerStyle} />; }`,
};

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

const valid = (name: string, settings?: object) => ({
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

ruleTester.run('no-style-prop-relay', noStylePropRelay, {
  valid: [
    valid('Applied'),
    valid('Renamed'),
    valid('Member'),
    valid('Used'),
    valid('Both'),
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
  ],
});

test('enabled as an error in recommended', () => {
  expect(plugin.rules['no-style-prop-relay']).toBe(noStylePropRelay);
  expect(
    plugin.configs.recommended.rules?.['@plumeria/no-style-prop-relay'],
  ).toBe('error');
});
