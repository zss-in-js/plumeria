import {
  __private,
  convertPlumeriaModule,
  extractPlumeriaAnimations,
  extractPlumeriaThemes,
} from '../src/transforms/from-plumeria';

describe('convertPlumeriaModule', () => {
  it('covers static-expression boundary nodes', () => {
    const values = new Map<string, unknown>([
      ['token', 'red'],
      ['object', { nested: 'blue' }],
    ]);

    expect(__private.propertyKey(undefined)).toBeUndefined();
    expect(
      __private.propertyKey({ type: 'PrivateIdentifier' }),
    ).toBeUndefined();
    expect(
      __private.memberPath({
        type: 'MemberExpression',
        object: { type: 'Literal', value: 'not-an-object' },
        computed: false,
        property: { type: 'Literal', value: 'key' },
      }),
    ).toBeUndefined();
    expect(
      __private.memberPath({
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'object' },
        computed: true,
        property: { type: 'CallExpression' },
      }),
    ).toBeUndefined();
    expect(__private.evaluate(undefined, values)).toBeUndefined();
    expect(
      __private.evaluate(
        {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'object' },
          computed: true,
          property: { type: 'CallExpression' },
        },
        values,
      ),
    ).toBeUndefined();
    expect(
      __private.evaluate(
        {
          type: 'TemplateLiteral',
          quasis: [{ value: { cooked: '' } }, { value: { cooked: '' } }],
          expressions: [{ type: 'Identifier', name: 'object' }],
        },
        values,
      ),
    ).toBeUndefined();
    expect(
      __private.evaluate(
        {
          type: 'ObjectExpression',
          properties: [
            {
              type: 'Property',
              kind: 'init',
              computed: true,
              key: { type: 'Literal', value: true },
              value: { type: 'Identifier', name: 'token' },
            },
          ],
        },
        values,
      ),
    ).toBeUndefined();
  });
  it('exports flat, pseudo, and media styles with CSS value semantics', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const breakpoints = css.createStatic({ tablet: '(width >= 768px)' });
      export const styles = css.create({
        card: {
          padding: 16,
          lineHeight: 1.5,
          ':hover': { color: 'blue' },
          [\`@media \${breakpoints.tablet}\`]: { padding: 24 },
        },
      });
    `);

    expect(result).toEqual(
      expect.objectContaining({ binding: 'styles', keys: ['card'] }),
    );
    expect(result?.css).toContain('padding: 16px;');
    expect(result?.css).toContain('line-height: 1.5;');
    expect(result?.css).toContain('.card:hover');
    expect(result?.css).toContain('@media (width >= 768px)');
    expect(result?.reports).toEqual([]);
  });

  it('returns null when the module has no create call', () => {
    expect(convertPlumeriaModule('export const value = 1;')).toBeNull();
  });

  it('exports createTheme to global CSS and keeps its variables in styles', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      export const theme = css.createTheme('@media (prefers-color-scheme: dark)', {
        textColor: { default: '#222', theme: '#eee' },
      });
      export const styles = css.create({ card: { color: theme.textColor } });
    `);

    expect(result?.globalCss).toContain(':where(:root)');
    expect(result?.globalCss).toContain('@media (prefers-color-scheme: dark)');
    expect(result?.globalCss).toContain('#222');
    expect(result?.globalCss).toContain('#eee');
    expect(result?.css).toMatch(/color: var\(--.+-text-color\);/);
    expect(result?.reports).toEqual([]);
  });

  it('reports constructs that cannot be exported without changing meaning', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const styles = css.create({
        ...shared,
        dynamic: ({ color }: { color: string }) => ({ color }),
        card: { ...other, color: getColor() },
      });
    `);

    expect(result?.reports.map((report) => report.kind)).toEqual([
      'spread-create',
      'function-style',
      'spread-style',
      'dynamic-value',
    ]);
  });

  it('writes a shorthand before the longhand that narrows it', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const styles = css.create({
        inner: { paddingTop: 2, padding: 1 },
      });
    `);

    // Plumeria ranks the longhand above the shorthand by specificity, which a
    // stylesheet can only answer with the order it writes them in.
    expect(result?.css.indexOf('padding: 1px')).toBeLessThan(
      result?.css.indexOf('padding-top: 2px') as number,
    );
  });

  it('writes a base longhand after the shorthand an at-rule sets', () => {
    const result = convertPlumeriaModule(
      `
      import * as css from '@plumeria/core';
      const styles = css.create({
        edge: { paddingTop: 4 },
        box: { '@media (min-width: 600px)': { padding: 40 } },
      });
    `,
      {},
      [
        {
          parts: [
            { binding: 'styles', key: 'edge' },
            { binding: 'styles', key: 'box' },
          ],
          slots: [
            [{ binding: 'styles', key: 'edge' }],
            [{ binding: 'styles', key: 'box' }],
          ],
          file: 'C.tsx',
          line: 1,
          column: 1,
        },
      ],
    );

    // `padding-top` carries one rank step more than the at-rule `padding`, so
    // it has to be written last however the call site composes the two.
    expect(result?.css.indexOf('padding: 40px')).toBeLessThan(
      result?.css.indexOf('padding-top: 4px') as number,
    );
  });

  it('writes a narrower condition after the one it implies', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const styles = css.create({
        box: {
          '@media (min-width: 900px)': { color: 'red' },
          '@media (min-width: 600px)': { color: 'blue' },
        },
      });
    `);

    expect(result?.css.indexOf('min-width: 600px')).toBeLessThan(
      result?.css.indexOf('min-width: 900px') as number,
    );
  });

  it('folds a composition reaching into another module into one class', () => {
    const result = convertPlumeriaModule(
      `
      import * as css from '@plumeria/core';
      const styles = css.create({ edge: { paddingTop: 4 } });
    `,
      {},
      [],
      {
        target: '/app/A.module.css',
        foldings: [
          {
            signature: '/app/A.module.css#edge|/app/B.module.css#box',
            parts: [
              { binding: 'styles', key: 'edge' },
              { binding: 'other', key: 'box', source: '/app/B.ts' },
            ],
          },
        ],
        foreign: {
          '/app/B.ts': {
            text: `
              import * as css from '@plumeria/core';
              export const other = css.create({
                box: { '@media (min-width: 600px)': { padding: 40 } },
              });
            `,
            values: {},
          },
        },
      },
    );

    // Two stylesheets have no order that reaches both, so the members are
    // written into one class where the same rank applies again.
    expect(result?.merges).toEqual({
      '/app/A.module.css#edge|/app/B.module.css#box': 'edgeBox',
    });
    expect(result?.css).toContain('.edgeBox');
    expect(result?.css.indexOf('padding: 40px')).toBeLessThan(
      result?.css.lastIndexOf('padding-top: 4px') as number,
    );
  });

  it('turns function style parameters into custom properties', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const styles = css.create({
        size: (width: number, color: string) => ({
          width,
          color,
          ':hover': { transform: \`translateX(\${width}px)\` },
        }),
      });
    `);

    expect(result?.functions.size.params).toEqual(['width', 'color']);
    expect(result?.functions.size.variables).toEqual([
      '--styles-size-width',
      '--styles-size-color',
    ]);
    expect(result?.css).toContain('width: var(--styles-size-width);');
    expect(result?.css).toContain('color: var(--styles-size-color);');
    expect(result?.css).toContain(
      'transform: translateX(var(--styles-size-width)px);',
    );
  });

  it('exports keyframes and view transitions with their generated names', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const fade = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
      const crossFade = css.viewTransition({
        old: { animationName: fade, animationDuration: '1s' },
        new: { animationName: fade },
      });
      const styles = css.create({
        card: { animationName: fade, viewTransitionName: crossFade },
      });
    `);

    expect(result?.globalCss).toMatch(/@keyframes kf-[a-z\d]+/);
    expect(result?.globalCss).toMatch(/::view-transition-old\(vt-[a-z\d]+\)/);
    expect(result?.globalCss).toMatch(/animation-name: kf-[a-z\d]+;/);
    expect(result?.css).toMatch(/animation-name: kf-[a-z\d]+;/);
    expect(result?.css).toMatch(/view-transition-name: vt-[a-z\d]+;/);
    expect(result?.reports).toEqual([]);
  });

  it('reports dynamic theme and animation definitions without emitting CSS', () => {
    const themes = extractPlumeriaThemes(`
      import * as css from '@plumeria/core';
      const badSelector = css.createTheme(getSelector(), { color: { default: 'red', theme: 'blue' } });
      const badPair = css.createTheme('.dark', { color: 'red' });
      const missingValue = css.createTheme('.light', { color: { default: 'red' } });
      const spread = css.createTheme('.spread', { ...tokens });
    `);
    const animations = extractPlumeriaAnimations(`
      import * as css from '@plumeria/core';
      const fade = css.keyframes(getFrames());
      const transition = css.viewTransition({ old: { animationName: fade } });
    `);

    expect(themes.bindings).toEqual({});
    expect(themes.globalCss).toBe('');
    expect(themes.reports.map((report) => report.kind)).toEqual([
      'dynamic-create-theme',
      'dynamic-create-theme',
      'dynamic-create-theme',
      'dynamic-create-theme',
    ]);
    expect(animations.bindings).toEqual({});
    expect(animations.globalCss).toBe('');
    expect(animations.reports.map((report) => report.kind)).toEqual([
      'dynamic-keyframes',
      'dynamic-view-transition',
    ]);
  });

  it('emits every view-transition part and selector form used by themes', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const named = css.createTheme('dark', { size: { default: 1, theme: 2 } });
      const byId = css.createTheme('#contrast', { color: { default: 'black', theme: 'white' } });
      const byPseudo = css.createTheme(':root.dark', { gap: { default: 2, theme: 4 } });
      const byAttribute = css.createTheme('[data-dark]', { radius: { default: 3, theme: 6 } });
      const fade = css.keyframes({ '0%': { opacity: 0 }, '100%': { opacity: 1 } });
      const transition = css.viewTransition({
        group: { animationDuration: '1s', disabled: false },
        imagePair: { isolation: 'isolate' },
        old: { animationName: fade },
        new: { opacity: 1 },
        ignored: null,
      });
      const styles = css.create({ card: {
        width: named.size,
        color: byId.color,
        gap: byPseudo.gap,
        borderRadius: byAttribute.radius,
        viewTransitionName: transition,
      } });
    `);

    expect(result?.globalCss).toContain('.dark {');
    expect(result?.globalCss).toContain('#contrast {');
    expect(result?.globalCss).toContain(':root.dark {');
    expect(result?.globalCss).toContain('[data-dark] {');
    expect(result?.globalCss).toContain('::view-transition-group(');
    expect(result?.globalCss).toContain('::view-transition-image-pair(');
    expect(result?.globalCss).toContain('::view-transition-old(');
    expect(result?.globalCss).toContain('::view-transition-new(');
  });

  it('reports unsafe create shapes and accepts block function styles', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const brokenStatic = css.createStatic(getValues());
      const first = css.create({
        [getName()]: { color: 'red' },
        dynamicStyle: shared,
        card: {
          [getProperty()]: 'red',
          color: brokenStatic.missing,
        },
        size: function (width) { return { width }; },
      });
      const second = css.create(getStyles());
      const third = css.create({ other: { color: 'blue' } });
    `);

    expect(result?.functions.size).toEqual({
      params: ['width'],
      variables: ['--first-size-width'],
      lengths: [true],
    });
    expect(result?.reports.map((report) => report.kind)).toEqual([
      'dynamic-create-static',
      'dynamic-create',
      'dynamic-style-key',
      'dynamic-style',
      'dynamic-key',
      'dynamic-value',
    ]);
    expect(result?.aliases).toEqual({ third: { other: 'other' } });
    expect(result?.css).toContain('.other {\n  color: blue;\n}');
  });

  it('rejects computed objects, booleans, templates, and unresolved paths', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      const constants = css.createStatic({ nested: { value: 'red' } });
      const styles = css.create({
        [{ name: 'card' }]: { color: 'red' },
        [true]: { color: 'blue' },
        card: {
          [false]: 'red',
          color: constants.missing.value,
          content: \`value-\${constants.nested}\`,
        },
      });
    `);

    expect(result?.reports.map((report) => report.kind)).toEqual([
      'dynamic-style-key',
      'dynamic-style-key',
      'dynamic-key',
      'dynamic-value',
      'dynamic-value',
    ]);
  });

  it('handles empty output and unsupported declaration forms safely', () => {
    const result = convertPlumeriaModule(`
      import * as css from '@plumeria/core';
      export { css };
      const { create } = css;
      const styles = css.create({
        empty: {},
        noReturn: () => {},
        invalid: (value = 1) => ({ width: value }),
      });
    `);

    expect(result?.css).toBe('');
    expect(result?.keys).toEqual(['empty']);
    expect(result?.reports.map((report) => report.kind)).toEqual([
      'function-style',
      'function-style',
    ]);
  });
});
