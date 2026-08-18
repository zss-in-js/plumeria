import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  findStylesheets,
  formatReports,
  plan,
  targetPath,
  write,
} from '../src/migrate';

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

  it('accepts a stylesheet directly and ignores missing paths', () => {
    expect(
      findStylesheets([
        path.join(DIR, 'missing'),
        path.join(DIR, 'src', 'Card.module.css'),
      ]),
    ).toEqual([path.join(DIR, 'src', 'Card.module.css')]);
  });

  it('names the generated module beside the stylesheet', () => {
    expect(targetPath('/a/Card.module.css')).toBe('/a/Card.styles.ts');
  });

  it('builds a module map keyed by the stylesheet path', () => {
    const { modules } = plan([DIR]);
    const key = path.join(DIR, 'src', 'Card.module.css');
    expect(modules[key].source).toBe('./Card.styles');
    expect(modules[key].names).toEqual({
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

  it('formats actionable reports and skips clean stylesheets', () => {
    const source = path.join(DIR, 'src', 'Card.module.css');
    expect(
      formatReports(
        [
          {
            source: path.join(DIR, 'clean.module.css'),
            target: '',
            reports: [],
          },
          {
            source,
            target: '',
            reports: [
              {
                line: 3,
                column: 1,
                kind: 'sibling-combinator',
                source: '.item + .item',
                hint: 'Rewrite the relationship manually.',
              },
            ],
          },
        ],
        DIR,
      ),
    ).toEqual([
      'src/Card.module.css',
      '  3:1  sibling-combinator  .item + .item',
      '        Rewrite the relationship manually.',
    ]);
  });

  it('uses the absolute source when it cannot make a relative report path', () => {
    const source = path.join(DIR, 'src', 'Card.module.css');
    expect(
      formatReports(
        [
          {
            source,
            target: '',
            reports: [
              { line: 1, column: 1, kind: 'kind', source: '.x', hint: 'hint' },
            ],
          },
        ],
        source,
      )[0],
    ).toBe(source);
  });
});

describe('a target that already exists', () => {
  const OWN = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-codemod-own-'));
  const HAND_WRITTEN = "export const kept = 'do not lose me';\n";

  beforeAll(() => {
    fs.writeFileSync(
      path.join(OWN, 'Card.module.css'),
      '.card { color: red }\n',
    );
    fs.writeFileSync(path.join(OWN, 'Card.styles.ts'), HAND_WRITTEN);
  });

  afterAll(() => fs.rmSync(OWN, { recursive: true, force: true }));

  it('is reported rather than overwritten', () => {
    const { stylesheets } = plan([OWN]);
    expect(stylesheets[0].reports.map((r) => r.kind)).toEqual([
      'target-exists',
    ]);
    expect(stylesheets[0].reports[0].hint).toBe(
      'Card.styles.ts already exists and was not overwritten.',
    );
  });

  it('keeps the stylesheet out of the module map, so no consumer is pointed at it', () => {
    expect(plan([OWN]).modules).toEqual({});
  });

  it('leaves the file it would have written alone', () => {
    write([OWN]);
    expect(fs.readFileSync(path.join(OWN, 'Card.styles.ts'), 'utf-8')).toBe(
      HAND_WRITTEN,
    );
  });

  it('formats the report without a source of its own', () => {
    expect(formatReports(plan([OWN]).stylesheets, OWN)).toEqual([
      'Card.module.css',
      '  0:0  target-exists',
      '        Card.styles.ts already exists and was not overwritten.',
    ]);
  });
});
