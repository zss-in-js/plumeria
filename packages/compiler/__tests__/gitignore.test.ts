import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { compileCSS } from '../index';

const PARENT = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-gitignore-')),
);
const PROJECT = path.join(PARENT, 'project');

const source = (color: string) => `
import * as css from '@plumeria/core';

const styles = css.create({
  box: { color: '${color}' },
});

export const Box = () => <div classStyle={styles.box} />;
`;

beforeAll(() => {
  fs.mkdirSync(path.join(PARENT, '.git'));
  fs.writeFileSync(path.join(PARENT, '.gitignore'), '*\n');
  fs.mkdirSync(path.join(PROJECT, 'ignored'), { recursive: true });
  fs.writeFileSync(path.join(PROJECT, '.gitignore'), 'ignored/\n');
  fs.writeFileSync(path.join(PROJECT, 'kept.tsx'), source('red'));
  fs.writeFileSync(
    path.join(PROJECT, 'ignored', 'skipped.tsx'),
    source('blue'),
  );
});

afterAll(() => fs.rmSync(PARENT, { recursive: true, force: true }));

describe('compiler: .gitignore', () => {
  const compile = () =>
    compileCSS({
      include: ['**/*.{js,jsx,ts,tsx}'],
      exclude: ['**/node_modules/**'],
      cwd: PROJECT,
    });

  it('ignores a .gitignore above the project directory', () => {
    expect(compile()).toContain('color: red');
  });

  it('still honors a .gitignore inside the project directory', () => {
    expect(compile()).not.toContain('color: blue');
  });
});
