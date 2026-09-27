import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const DIR = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-')),
);
const files: string[] = [];
jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => files) }));

import { transformSource } from '../src/transform';

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

const write = (name: string, source: string) => {
  const filePath = path.join(DIR, name);
  fs.writeFileSync(filePath, source);
  if (!files.includes(filePath)) files.push(filePath);
  return filePath;
};

const transform = (filePath: string, styleProp: string) =>
  transformSource({
    source: fs.readFileSync(filePath, 'utf8'),
    moduleId: filePath,
    filePath,
    root: DIR,
    styleProp,
    propertyPolicy: undefined,
    isDev: false,
    collectOndemandSheets: true,
    addDependency: () => {},
  });

write(
  'styles.ts',
  `import * as css from '@plumeria/core';
export const styles = css.create({ a: { color: 'teal' } });`,
);

it('reaches a receiver from a file that writes the style prop without importing the core package', async () => {
  const receiver = write(
    'Alone.tsx',
    `import * as css from '@plumeria/core';
export const Alone = ({ classStyle }: { classStyle?: css.Style }) => <div classStyle={classStyle} />;`,
  );
  write(
    'App.tsx',
    `import { styles } from './styles';
import { Alone } from './Alone';
export const App = () => <Alone classStyle={styles.a} />;`,
  );

  const { code, sheets } = await transform(receiver, 'classStyle');

  expect(code).not.toContain('className={""}');
  expect(sheets.join('')).toContain('teal');
});

it('rescans every file when the style prop changes', async () => {
  const receiver = write(
    'Boxed.tsx',
    `import * as css from '@plumeria/core';
export const Boxed = ({ sx }: { sx?: css.Style }) => <div sx={sx} />;`,
  );
  write(
    'Uses.tsx',
    `import { styles } from './styles';
import { Boxed } from './Boxed';
export const Uses = () => <Boxed sx={styles.a} />;`,
  );

  await transform(receiver, 'classStyle');
  const { code } = await transform(receiver, 'sx');

  expect(code).not.toContain('className={""}');
  expect(code).toContain('[sx]');
});
