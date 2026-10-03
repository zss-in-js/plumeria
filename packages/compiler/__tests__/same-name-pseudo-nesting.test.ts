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
      '[data-a]:is(:hover, :focus-visible)',
      ':not(.x, :not(.a))',
      ':not(:not(.a), .b)',
    ])('compiles %s', (selector) => {
      expect(() => compile(selector)).not.toThrow();
    });

    it.each([
      [':where(:where(.a), .b)', ':where'],
      [':is(:where(:is(.a)))', ':is'],
      [':not(:not(:is(:is(.a))))', ':is'],
      ['::part(::part(label))', '::part'],
      ['[data-a]:is(:is(.a), .b)', ':is'],
    ])('rejects %s', (selector, name) => {
      expect(() => compile(selector)).toThrow(
        `"${name}()" cannot be nested inside another "${name}()"`,
      );
    });
  });
  describe('compiler: selector nesting limit', () => {
    const nest = (open: string, levels: number) =>
      open.repeat(levels) + '.a' + ')'.repeat(levels);

    it.each([nest(':not(', 16), `:is(${nest('(', 15)})`])(
      'compiles 16 levels of %s',
      (selector) => {
        expect(() => compile(selector)).not.toThrow();
      },
    );

    it.each([
      nest(':not(', 17),
      `:is(${nest('(', 16)})`,
      Array.from({ length: 17 }, (_, i) => `:x${i}(`).join('') + '.a',
      nest(':not(/*)*/', 17),
    ])('rejects more than 16 levels of %s', (selector) => {
      expect(() => compile(selector)).toThrow(
        'Selector nests deeper than 16 levels',
      );
    });
  });
  describe('compiler: comments in selector keys', () => {
    it('ignores parentheses inside a comment', () => {
      expect(() => compile(':not(/*' + '('.repeat(17) + '*/.a)')).not.toThrow();
    });
  });
  describe('compiler: quotes in selector keys', () => {
    it.each([':lang("en")', '[data-x="a"]:hover', ":is([data-x='a'], .b)"])(
      'compiles %s',
      (selector) => {
        expect(() => compile(selector)).not.toThrow();
      },
    );

    it.each([':hover":is(:is(:is(:is(.x', '[data-a]"x"', ':lang("en)'])(
      'rejects %s',
      (selector) => {
        expect(() => compile(selector)).toThrow(
          `Unexpected quote in selector: "${selector}"`,
        );
      },
    );
  });
});
