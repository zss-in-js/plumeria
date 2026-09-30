import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { implementations } from '../compiler-implementations';

describe.each(implementations)('$name', ({ compileCSS }) => {
  const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
  const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixture.tsx');

  const compile = (selector: string) => {
    fs.writeFileSync(
      FIXTURE_PATH,
      `
import * as css from '@plumeria/core';

export const styles = css.create({
  box: { ${JSON.stringify(selector)}: { color: 'red' } },
});
`,
      'utf-8',
    );
    return compileCSS({
      cwd: FIXTURE_DIR,
      include: ['fixture.tsx'],
      exclude: [],
    });
  };

  afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

  describe('compiler: same-name pseudo function nesting', () => {
    it.each([
      ':is(:where(:not(:has(.a))))',
      ':is(.a):is(.b)',
      ':not([data-x=":not(:not(a))"])',
    ])('compiles %s', (selector) => {
      expect(() => compile(selector)).not.toThrow();
    });

    it.each([
      [':where(:where(.a), .b)', ':where'],
      [':is(:where(:is(.a)))', ':is'],
      [':not(.x, :not(.a))', ':not'],
      ['::part(::part(label))', '::part'],
    ])('rejects %s', (selector, name) => {
      expect(() => compile(selector)).toThrow(
        `"${name}()" cannot be nested inside another "${name}()"`,
      );
    });
  });
});
