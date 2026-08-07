import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findStylesheets, plan, targetPath, write } from '../src/migrate';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-codemod-'));

beforeAll(() => {
  fs.mkdirSync(path.join(DIR, 'src', 'node_modules'), { recursive: true });
  fs.writeFileSync(
    path.join(DIR, 'src', 'Card.module.css'),
    '.card { padding: 16px }\n.card .title { color: red }\n.item + .item { margin: 1px }\n',
  );
  fs.writeFileSync(
    path.join(DIR, 'src', 'node_modules', 'Skip.module.css'),
    '.x { color: red }',
  );
});

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

describe('migrate', () => {
  it('finds stylesheets and skips ignored directories', () => {
    const found = findStylesheets([DIR]);
    expect(found).toHaveLength(1);
    expect(found[0].endsWith('src/Card.module.css')).toBe(true);
  });

  it('names the generated module beside the stylesheet', () => {
    expect(targetPath('/a/Card.module.css')).toBe('/a/Card.styles.ts');
  });

  it('builds a module map keyed by the stylesheet file name', () => {
    const { modules } = plan([DIR]);
    expect(modules['Card.module.css'].source).toBe('./Card.styles');
    expect(modules['Card.module.css'].names).toEqual({
      card: 'card',
      title: 'title',
    });
  });

  it('carries the unconverted rules through as reports', () => {
    const { stylesheets } = plan([DIR]);
    expect(stylesheets[0].reports.map((r) => r.kind)).toEqual([
      'sibling-combinator',
    ]);
  });

  it('writes the module', () => {
    const { stylesheets } = write([DIR]);
    const code = fs.readFileSync(stylesheets[0].target, 'utf-8');
    expect(code).toContain("import * as css from '@plumeria/core';");
    expect(code).toContain("...css.marker('card', ':defined'),");
  });
});
