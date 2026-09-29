import { RuleTester } from 'eslint';
import { noUnresolvedComposition } from '../../src/rules/no-unresolved-composition';
import plugin from '../../src';

const prefix = "import * as css from '@plumeria/core'; ";
const ruleTester = new RuleTester();

ruleTester.run('no-unresolved-composition', noUnresolvedComposition, {
  valid: [
    ...[
      'css.use(a, b)',
      'css.use(a) + " "',
      '`${css.use(a)} `',
      '[css.use(a)].join(" ")',
      'active ? css.use(a) : css.use(b)',
      '"a " + "b"',
      'function f(css) { return css.use(a) + " b"; }',
      'css[method](a) + " b"',
      'String(css.use(a).length) + "px"',
      'css.use(a, [b, [active && c]])',
      'createElement("div", { className: css.use(a) })',
      'const x = css.use(a); createElement("div", { className: x })',
      'const x = css.use(a); const y = x;',
      'let x = ""; x += " b"',
    ].map((code) => prefix + code),
    'css.use(a) + " b"',
    'import * as css from "other"; css.use(a) + " b"',
    'import { use } from "@plumeria/core"; function f(use) { return use(a) + " b"; }',
  ],
  invalid: [
    ...[
      'clsx(css.use(a), className)',
      'cn(active && css.use(a))',
      'twMerge([css.use(a), "external"])',
      'f(...[css.use(a)])',
      'css.use(css.use(a))',
      'css.use(a, [css.use(b)])',
      'clsx(css.use(a) + " external")',
      'const x = css.use(a); clsx(x, b)',
      'const x = css.use(a); const y = x; clsx(y)',
      'const o = { base: css.use(a) }; clsx(o.base)',
      'const list = [css.use(a)]; clsx(list)',
      'const x = css.use(a); css.use(x)',
    ].map((code) => ({
      code: prefix + code,
      errors: [{ messageId: 'wrapped' }],
      output: null,
    })),
    ...[
      'css.use(a) + " " + css.use(b)',
      '`${css.use(a)} ${css.use(b)}`',
      '[css.use(a), css.use(b)].join(" ")',
      'css.use(a) + " " + (active ? css.use(b) : "")',
      'css.use(a) + " " + css.use(b) + " external"',
      'const x = css.use(a); x + " " + css.use(b)',
      'let x = css.use(a); x += " " + css.use(b)',
    ].map((code) => ({
      code: prefix + code,
      errors: [{ messageId: 'merge' }],
      output: null,
    })),
    ...[
      '"external " + css.use(a)',
      '(active ? css.use(a) : "") + " external"',
      '[active && css.use(a), "external"].join(" ")',
      'css["use"](a) + " external"',
      '[css.use(a), "external"]["join"](" ")',
      '`${css.use(a) + " external"} other`',
    ].map((code) => ({
      code: prefix + code,
      errors: [{ messageId: 'external' }],
      output: null,
    })),
    ...[
      ['css.use(a) + "a b c"', '"a b c"'],
      ['`${css.use(a)} external`', '"external"'],
      ['css.use(a) + " " + props.className', 'props.className'],
      ['[css.use(a), "x", y].join(" ")', '"x", y'],
      ['const x = css.use(a); `${x} external`', '"external"'],
      ['const list = [css.use(a), "x"]; list.join(" ")', '"x"'],
      ['let x = css.use(a); x += " external"', '" external"'],
      ['const o = { base: css.use(a) }; o.base + " " + y', 'y'],
      [`css.use(a) + " ${'b'.repeat(50)}"`, `" ${'b'.repeat(37)}…`],
    ].map(([code, values]) => ({
      code: prefix + code,
      errors: [{ messageId: 'external', data: { values } }],
      output: null,
    })),
    ...[
      'import css from "@plumeria/core"; css.use(a) + " b"',
      'import { use as apply } from "@plumeria/core"; apply(a) + " b"',
      'import { "use" as apply } from "@plumeria/core"; apply(a) + " b"',
      'import * as styles from "@plumeria/core"; styles.use(a) + " b"',
    ].map((code) => ({
      code,
      errors: [{ messageId: 'external' }],
      output: null,
    })),
  ],
});

test('enabled as a warning in recommended', () => {
  expect(plugin.rules['no-unresolved-composition']).toBe(
    noUnresolvedComposition,
  );
  expect(
    plugin.configs.recommended.rules?.['@plumeria/no-unresolved-composition'],
  ).toBe('warn');
});
