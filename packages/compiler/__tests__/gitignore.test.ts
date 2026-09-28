import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { compileCSS } from '../index';

const temporary = () =>
  fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-gitignore-')),
  );

const HOME = temporary();
const PROJECT = path.join(HOME, 'project');
const MONOREPO = temporary();
const APP = path.join(MONOREPO, 'apps', 'web');

const source = (color: string) => `
import * as css from '@plumeria/core';

const styles = css.create({
  box: { color: '${color}' },
});

export const Box = () => <div classStyle={styles.box} />;
`;

const write = (file: string, contents: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
};

beforeAll(() => {
  fs.mkdirSync(path.join(HOME, '.git'));
  write(path.join(HOME, '.gitignore'), '*\n');
  write(path.join(PROJECT, '.gitignore'), 'ignored/\n');
  write(path.join(PROJECT, 'kept.tsx'), source('red'));
  write(path.join(PROJECT, 'ignored', 'skipped.tsx'), source('blue'));

  fs.mkdirSync(path.join(MONOREPO, '.git'));
  write(path.join(MONOREPO, '.gitignore'), 'apps/web/generated/\n');
  write(path.join(APP, 'page.tsx'), source('green'));
  write(path.join(APP, 'generated', 'output.tsx'), source('purple'));
});

afterAll(() => {
  fs.rmSync(HOME, { recursive: true, force: true });
  fs.rmSync(MONOREPO, { recursive: true, force: true });
});

const compile = (cwd: string) =>
  compileCSS({
    include: ['**/*.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**'],
    cwd,
  });

describe('compiler: .gitignore', () => {
  it('compiles a project that a parent .gitignore ignores as a whole', () => {
    expect(compile(PROJECT)).toContain('color: red');
  });

  it('still honors a .gitignore inside that project', () => {
    expect(compile(PROJECT)).not.toContain('color: blue');
  });

  it('honors the repository .gitignore for an app inside a monorepo', () => {
    const css = compile(APP);
    expect(css).toContain('color: green');
    expect(css).not.toContain('color: purple');
  });
});
