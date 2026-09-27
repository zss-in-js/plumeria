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

import { propsRequireImport } from '../../src/rules/props-require-import';

const DIR = fs.mkdtempSync(path.join(__dirname, 'fixture-'));
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

const write = (name: string, source: string) => {
  const filePath = path.join(DIR, name);
  fs.writeFileSync(filePath, source);
  files.push(filePath);
};

write(
  'styles.js',
  `import * as css from '@plumeria/core';
export const styles = css.create({ a: { color: 'teal' } });
export const tokens = css.createStatic({ gap: '8px' });
const main = css.create({ b: { color: 'crimson' } });
export default main;`,
);
write('index.js', `export { styles } from './styles';`);
write('plain.js', `export const routes = { home: '/' };`);

const APP = path.join(DIR, 'App.jsx');

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('props-require-import', propsRequireImport, {
  valid: [
    {
      code: `
          import { styles } from './styles';
          const el = <div classStyle={styles.a} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { styles } from './styles';
          const el = <Box sx={styles.a} />;
        `,
      filename: APP,
      settings: { plumeria: { styleProp: 'sx' } },
    },
    {
      code: `
          import '@plumeria/core';
          import { styles } from './styles';
          const el = <Card styleArray={styles.a} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { tokens } from './styles';
          const el = <Card gap={tokens.gap} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { routes } from './plain';
          const el = <Link href={routes.home} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { styles } from './missing';
          const el = <Card styleArray={styles.a} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { nothing } from './styles';
          const el = <Card styleArray={nothing.a} />;
        `,
      filename: APP,
    },
    {
      code: `
          import * as all from './styles';
          const el = <Card styleArray={all[key]} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { make } from './styles';
          const el = <Card styleArray={make().a} />;
        `,
      filename: APP,
    },
    {
      code: `
          const local = {};
          const el = <Card styleArray={local.a} label="x" {...rest} onClick={() => go()} />;
        `,
      filename: APP,
    },
    {
      code: `
          import { styles } from './styles';
          const el = <rect xlink:href={styles.a} />;
        `,
      filename: APP,
    },
  ],
  invalid: [
    {
      code: `
          import { styles } from './styles';
          const el = <Card styleArray={styles.a} />;
        `,
      filename: APP,
      output: `import "@plumeria/core";\n
          import { styles } from './styles';
          const el = <Card styleArray={styles.a} />;
        `,
      errors: [
        {
          message:
            'styleArray passes a style from "./styles", so this file must import "@plumeria/core".',
        },
      ],
    },
    {
      code: `
          import { styles as s } from './index';
          const el = <Card styleArray={[s.a, on ? s.a : null, on && s.a]} />;
          const other = <Card boxStyle={s.a} />;
        `,
      filename: APP,
      output: `import "@plumeria/core";\n
          import { styles as s } from './index';
          const el = <Card styleArray={[s.a, on ? s.a : null, on && s.a]} />;
          const other = <Card boxStyle={s.a} />;
        `,
      errors: [
        { messageId: 'requiresImport' },
        { messageId: 'requiresImport' },
      ],
    },
    {
      code: `
          import { "styles" as named } from './styles';
          const el = <Card styleArray={[, named.a]} />;
        `,
      filename: APP,
      output: `import "@plumeria/core";\n
          import { "styles" as named } from './styles';
          const el = <Card styleArray={[, named.a]} />;
        `,
      errors: [{ messageId: 'requiresImport' }],
    },
    {
      code: `
          import * as all from './styles';
          const el = <Card styleArray={all.styles.a} />;
        `,
      filename: APP,
      output: `import "@plumeria/core";\n
          import * as all from './styles';
          const el = <Card styleArray={all.styles.a} />;
        `,
      errors: [{ messageId: 'requiresImport' }],
    },
    {
      code: `
          import main from './styles';
          const el = <Card styleArray={main?.b} />;
        `,
      filename: APP,
      output: `import "@plumeria/core";\n
          import main from './styles';
          const el = <Card styleArray={main?.b} />;
        `,
      errors: [{ messageId: 'requiresImport' }],
    },
    {
      code: `
          import { styles } from './styles';
          const el = <div classStyle={styles.a} />;
        `,
      filename: APP,
      settings: { plumeria: { styleProp: 'sx' } },
      output: `import "@plumeria/core";\n
          import { styles } from './styles';
          const el = <div classStyle={styles.a} />;
        `,
      errors: [{ messageId: 'requiresImport' }],
    },
  ],
});
