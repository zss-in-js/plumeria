import { RuleTester } from 'eslint';
import type { Rule } from 'eslint';
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
      'const styles = css.create({ a: {} }); css.use(styles.a)',
      'const styles = css.create({ a: {} }); css.use(styles.a, active && styles.b)',
      'css.use(other.palette(color))',
      'getCss().use(a) + " b"',
      'css.use(4)',
      'const o = { [key]: css.use(a) }; clsx(o.base)',
      'const o = { base: css.use(a) }; clsx(o[method])',
      'const o = { base: css.use(a) }; clsx(o.other)',
      'const list = [a]; list.slice().join(" ")',
      'let x = x; clsx(x)',
      'const styles = css.create({ p: (c) => ({ color: c }) }); createElement("div", { classStyle: styles.p(c) })',
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
      'const o = { "base": css.use(a) }; clsx(o.base)',
      'const o = { 1: css.use(a) }; clsx(o[1])',
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
      'css.use(styles.p(c))',
      'css.use(styles["p"](c))',
      'css.use(a, active && styles.p(c))',
      'css.use(a, [b, [styles.p(c)]])',
      'css.use(active ? styles.p(c) : a)',
      'css.use(active ? a : styles.p(c))',
      'css.use(...[styles.p(c)])',
      'const d = styles.p(c); css.use(a, d)',
      'const o = { d: styles.p(c) }; css.use(o.d)',
    ].map((code) => ({
      code:
        prefix +
        'const styles = css.create({ p: (c) => ({ color: c }) }); ' +
        code,
      errors: [{ messageId: 'dynamic' }],
      output: null,
    })),
    {
      code:
        prefix +
        'const styles = css.create({ p: (c) => ({ color: c }) }); css.use(styles.p(c))',
      options: [{ styleProp: 'sx' }],
      errors: [
        {
          messageId: 'dynamic',
          data: { source: 'styles.p(c)', styleProp: 'sx' },
        },
      ],
      output: null,
    },
    {
      code: 'import { create, use } from "@plumeria/core"; const styles = create({ p: (c) => ({ color: c }) }); use(styles.p(c))',
      errors: [{ messageId: 'dynamic' }],
      output: null,
    },
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

const directListener = (variables: Map<string, unknown>) => {
  const reports: Rule.ReportDescriptor[] = [];
  const context = {
    options: [],
    settings: {},
    sourceCode: {
      getScope: () => ({ set: variables, upper: null }),
      getText: () => '',
    },
    report: (descriptor: Rule.ReportDescriptor) => reports.push(descriptor),
  } as unknown as Rule.RuleContext;
  return { listener: noUnresolvedComposition.create(context), reports };
};

const coreImport = {
  defs: [
    {
      type: 'ImportBinding',
      parent: { source: { value: '@plumeria/core' } },
      node: { type: 'ImportNamespaceSpecifier' },
    },
  ],
};

test('stops resolving a cyclic variable without ranges', () => {
  const x = { type: 'Identifier', name: 'x' };
  const variables = new Map<string, unknown>([
    ['css', coreImport],
    ['x', { defs: [{ type: 'Variable' }], references: [{ writeExpr: x }] }],
  ]);
  const { listener, reports } = directListener(variables);
  listener.CallExpression?.({
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'css' },
      property: { type: 'Identifier', name: 'use' },
    },
    arguments: [x],
  } as never);
  expect(reports).toHaveLength(0);
});

test('ignores an object property with an unsupported key', () => {
  const object = {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'Property',
        computed: false,
        key: { type: 'Unsupported' },
        value: { type: 'Identifier', name: 'value' },
      },
    ],
    range: [0, 10],
  };
  const variables = new Map<string, unknown>([
    [
      'o',
      { defs: [{ type: 'Variable' }], references: [{ writeExpr: object }] },
    ],
  ]);
  const { listener, reports } = directListener(variables);
  listener.CallExpression?.({
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'clsx' },
    arguments: [
      {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'o', range: [20, 21] },
        property: { type: 'Identifier', name: 'base' },
      },
    ],
  } as never);
  expect(reports).toHaveLength(0);
});

test('uses raw text when a template element has no cooked value', () => {
  const { listener, reports } = directListener(new Map([['css', coreImport]]));
  listener.TemplateLiteral?.({
    type: 'TemplateLiteral',
    expressions: [
      {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'css' },
          property: { type: 'Identifier', name: 'use' },
        },
        arguments: [],
      },
    ],
    quasis: [
      { type: 'TemplateElement', value: { cooked: null, raw: 'external' } },
      { type: 'TemplateElement', value: { cooked: '', raw: '' } },
    ],
  } as never);
  expect(reports).toHaveLength(1);
  expect(reports[0]).toMatchObject({
    messageId: 'external',
    data: { values: '"external"' },
  });
});
