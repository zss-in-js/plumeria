jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, readFileSync: jest.fn(actual.readFileSync) };
});

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

const box = (color: string) => `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Box = () => <div classStyle={styles.box} />;`;

describe.each(implementations)(
  '$name incremental CSS',
  ({ name, compileCSS, scanAll }) => {
    let dir: string;
    let clock = Date.now() / 1000;
    const write = (file: string, source: string) => {
      const target = path.join(dir, file);
      fs.writeFileSync(target, source);
      fs.utimesSync(target, ++clock, clock);
    };
    const compile = (extra: Record<string, unknown> = {}) =>
      compileCSS({
        cwd: dir,
        include: ['**/*.{ts,tsx}'],
        exclude: [],
        ...extra,
      });
    const reference = () =>
      compile({
        sources: Object.fromEntries(
          fs
            .readdirSync(dir)
            .filter((file) => /\.tsx?$/.test(file))
            .map((file) => [
              path.join(dir, file),
              fs.readFileSync(path.join(dir, file), 'utf8'),
            ]),
        ),
      });
    beforeEach(() => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'development');
      dir = fs.realpathSync(
        fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-css-cache-')),
      );
    });
    afterEach(() => {
      jest.restoreAllMocks();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reuses an unchanged result and replaces only the edited file contributions', () => {
      write('a.tsx', box('red'));
      write('b.tsx', box('green'));
      const initial = compile();
      expect(compile()).toBe(initial);
      write('a.tsx', box('blue'));
      const edited = compile();
      expect(edited).toContain('blue');
      expect(edited).toContain('green');
      expect(edited).not.toContain('red');
      expect(edited).toBe(reference());
    });

    it('does not reread unchanged files, including after an unrelated edit', () => {
      if (name !== 'ts') return; // Native reads are checked in the Rust unit tests.
      write('a.tsx', box('red'));
      write('b.tsx', box('green'));
      compile();
      const read = fs.readFileSync as jest.Mock;
      read.mockClear();
      compile();
      expect(
        read.mock.calls.filter(([file]) => String(file).startsWith(dir)),
      ).toHaveLength(0);
      write('a.tsx', box('blue'));
      compile();
      const reads = read.mock.calls
        .map(([file]) => String(file))
        .filter((file) => file.startsWith(dir));
      expect(reads).toEqual([path.join(dir, 'a.tsx')]);
    });

    it('invalidates importers when a dependency changes, even after another scan', () => {
      write(
        'colors.ts',
        `import * as css from '@plumeria/core'; export const styles = css.create({ box: { color: 'red' } });`,
      );
      write(
        'a.tsx',
        `import * as css from '@plumeria/core';
import { styles } from './colors';
export const Box = () => <div classStyle={styles.box} />;`,
      );
      expect(compile()).toContain('red');
      write(
        'colors.ts',
        `import * as css from '@plumeria/core'; export const styles = css.create({ box: { color: 'blue' } });`,
      );
      scanAll(dir);
      const edited = compile();
      expect(edited).toContain('blue');
      expect(edited).not.toContain('red');
      expect(edited).toBe(reference());
    });

    it('updates an unchanged receiver when its parent supplies a different style', () => {
      write(
        'Child.tsx',
        `export const Child = ({ look }: any) => <div classStyle={look} />;`,
      );
      const parent = (color: string) => `import * as css from '@plumeria/core';
import { Child } from './Child';
const s = css.create({ box: { color: '${color}' } });
export const Parent = () => <Child look={s.box} />;`;
      write('Parent.tsx', parent('red'));
      expect(compile()).toContain('red');
      write('Parent.tsx', parent('blue'));
      const edited = compile();
      expect(edited).toContain('blue');
      expect(edited).not.toContain('red');
      expect(edited).toBe(reference());
    });

    it('drops deleted files and discovers added and recreated files', () => {
      write('a.tsx', box('red'));
      write('b.tsx', box('green'));
      compile();
      fs.unlinkSync(path.join(dir, 'a.tsx'));
      expect(compile()).not.toContain('red');
      write('c.tsx', box('blue'));
      expect(compile()).toContain('blue');
      write('a.tsx', box('purple'));
      const edited = compile();
      expect(edited).toContain('purple');
      expect(edited).not.toContain('red');
      expect(edited).toBe(reference());
    });

    it('handles source overrides changing and disappearing without a disk edit', () => {
      write('a.tsx', box('red'));
      expect(compile()).toContain('red');
      const sources = { [path.join(dir, 'a.tsx')]: box('blue') };
      expect(compile({ sources })).toContain('blue');
      expect(compile({ sources })).not.toContain('red');
      sources[path.join(dir, 'a.tsx')] = box('green');
      expect(compile({ sources })).toContain('green');
      expect(compile()).toContain('red');
      expect(compile()).not.toContain('green');
    });

    it('does not return stale output after an error and recovers after a fix', () => {
      write('a.tsx', box('red'));
      compile();
      write('a.tsx', 'export const broken = ;');
      expect(() => compile()).toThrow();
      expect(() => compile()).toThrow();
      write('a.tsx', box('blue'));
      expect(compile()).toBe(reference());
    });

    it('does not reuse a result across include, styleProp, or policy changes', () => {
      write('a.tsx', box('red'));
      write('b.tsx', box('green').replace('classStyle=', 'sx='));
      compile();
      expect(compile({ include: ['a.tsx'] })).not.toContain('green');
      expect(compile({ styleProp: 'sx' })).toContain('green');
      write('a.tsx', box('red').replace("color: 'red'", 'marginLeft: 1'));
      compile();
      expect(() => compile({ withoutPhysicalProperties: true })).toThrow();
      expect(compile()).toContain('margin-left');
    });

    it('keeps the original CSS order after edits in the opposite file order', () => {
      write(
        'a.tsx',
        box('red').replace(
          "color: 'red'",
          "'@media (min-width: 600px)': { color: 'red' }",
        ),
      );
      write(
        'b.tsx',
        box('blue').replace(
          "color: 'blue'",
          "'@supports (display: grid)': { color: 'blue' }",
        ),
      );
      const first = compile();
      write('b.tsx', fs.readFileSync(path.join(dir, 'b.tsx'), 'utf8') + '\n');
      compile();
      write('a.tsx', fs.readFileSync(path.join(dir, 'a.tsx'), 'utf8') + '\n');
      expect(compile()).toBe(first);
      expect(compile()).toBe(reference());
    });
  },
);
