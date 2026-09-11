import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  ensureVirtualCssFile,
  resolveVirtualCssPath,
  rewriteImportPath,
  writeCssBlock,
} from '../src/disk-css';

let directory: string;
let cssFile: string;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-disk-css-'));
  cssFile = path.join(directory, 'zero-virtual.css');
});

afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

it('resolves and caches the package virtual stylesheet path', () => {
  const first = resolveVirtualCssPath();
  expect(first).toBe(path.resolve(__dirname, '..', 'zero-virtual.css'));
  expect(resolveVirtualCssPath()).toBe(first);
});

it('creates only a missing virtual stylesheet', () => {
  ensureVirtualCssFile(cssFile);
  expect(fs.readFileSync(cssFile, 'utf-8')).toBe('/** Placeholder file */\n');

  fs.writeFileSync(cssFile, 'existing');
  ensureVirtualCssFile(cssFile);
  expect(fs.readFileSync(cssFile, 'utf-8')).toBe('existing');
});

it('appends, replaces, and removes a source CSS block', () => {
  fs.writeFileSync(cssFile, '/** Placeholder file */\n');

  writeCssBlock(cssFile, 'src/Card.tsx', '  .card { color: red; }  ');
  expect(fs.readFileSync(cssFile, 'utf-8')).toBe(
    '/** Placeholder file */\n\n/* ---start:src/Card.tsx */\n.card { color: red; }\n/* ---end:src/Card.tsx */\n',
  );

  writeCssBlock(cssFile, 'src/Card.tsx', '.card { color: blue; }');
  expect(fs.readFileSync(cssFile, 'utf-8')).toContain('color: blue');
  expect(fs.readFileSync(cssFile, 'utf-8')).not.toContain('color: red');

  writeCssBlock(cssFile, 'src/Card.tsx', '');
  expect(fs.readFileSync(cssFile, 'utf-8')).toBe('/** Placeholder file */\n');
});

it('creates a block when the file or a complete marker pair is missing', () => {
  writeCssBlock(cssFile, 'src/New.tsx', '.new {}');
  expect(fs.readFileSync(cssFile, 'utf-8')).toContain('.new {}');

  fs.writeFileSync(cssFile, '/* ---start:broken */\n');
  writeCssBlock(cssFile, 'broken', '.fixed {}');
  expect(fs.readFileSync(cssFile, 'utf-8')).toContain('.fixed {}');
});

it('normalizes an empty file without appending an empty block', () => {
  writeCssBlock(cssFile, 'src/Empty.tsx', '');
  expect(fs.readFileSync(cssFile, 'utf-8')).toBe('\n');
});

it('does not rewrite identical normalized content', () => {
  writeCssBlock(cssFile, 'src/Card.tsx', '.card {}');
  const before = fs.statSync(cssFile).mtimeMs;

  writeCssBlock(cssFile, 'src/Card.tsx', '.card {}');

  expect(fs.statSync(cssFile).mtimeMs).toBe(before);
});

it('rewrites disk imports as relative module paths', () => {
  expect(
    rewriteImportPath(
      path.join(directory, 'src', 'Card.tsx'),
      path.join(directory, 'zero-virtual.css'),
    ),
  ).toBe('../zero-virtual.css');
  expect(
    rewriteImportPath(
      path.join(directory, 'Card.tsx'),
      path.join(directory, 'zero-virtual.css'),
    ),
  ).toBe('./zero-virtual.css');
});
