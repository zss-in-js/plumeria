import postcss from 'postcss';
import { mergeRules } from '../src/mergeRules';

const merge = async (css: string) =>
  (await postcss([mergeRules()]).process(css, { from: undefined })).root;

describe('mergeRules', () => {
  it('merges identical selectors at their first position', async () => {
    const root = await merge('.a{color:red}.b{color:blue}.a{display:block}');

    expect(root.nodes).toHaveLength(2);
    expect(root.toString()).toBe('.a{color:red;display:block}.b{color:blue}');
  });

  it('merges identical at-rules recursively and moves them after base rules', async () => {
    const root = await merge(
      '@container (min-width:400px){.a{color:red}}' +
        '.base{color:black}' +
        '@container (min-width:400px){.a{display:block}.b{color:blue}}',
    );

    expect(root.nodes).toHaveLength(2);
    expect(root.toString()).toBe(
      '.base{color:black}' +
        '@container (min-width:400px){.a{color:red;display:block}.b{color:blue}}',
    );
  });

  it.each(['media', 'container', 'supports', 'layer', 'scope'])(
    'moves @%s after ordinary rules while preserving at-rule order',
    async (name) => {
      const root = await merge(
        `@${name} first{.a{color:red}}` +
          '.base{color:black}' +
          `@${name} second{.b{color:blue}}`,
      );

      expect(root.toString()).toBe(
        '.base{color:black}' +
          `@${name} first{.a{color:red}}` +
          `@${name} second{.b{color:blue}}`,
      );
    },
  );

  it('does not move unrelated at-rules', async () => {
    const root = await merge(
      '@font-face{font-family:test;src:url(test.woff2)}.base{color:black}',
    );

    expect(root.toString()).toBe(
      '@font-face{font-family:test;src:url(test.woff2)}.base{color:black}',
    );
  });

  it('does not merge different at-rule names with identical parameters', async () => {
    const root = await merge(
      '@media foo{.m{color:red}}' +
        '@supports foo{.s{color:blue}}' +
        '@container foo{.c{color:green}}' +
        '@layer foo{.l{color:black}}',
    );

    expect(root.nodes).toHaveLength(4);
    expect(
      root.nodes.map((node) => node.type === 'atrule' && node.name),
    ).toEqual(['media', 'supports', 'container', 'layer']);
  });

  it.each(['media', 'container', 'supports', 'layer', 'scope'])(
    'merges identical @%s rules',
    async (name) => {
      const root = await merge(
        `@${name} condition{.a{color:red}}` +
          `.base{color:black}` +
          `@${name} condition{.b{color:blue}}`,
      );

      expect(
        root.nodes.filter(
          (node) => node.type === 'atrule' && node.name === name,
        ),
      ).toHaveLength(1);
    },
  );

  it('does not merge the same at-rule under different parents', async () => {
    const root = await merge(
      '@supports (display:grid){@container (width > 400px){.a{color:red}}}' +
        '@media (width > 600px){@container (width > 400px){.b{color:blue}}}',
    );

    expect(root.nodes).toHaveLength(2);
    expect(root.toString()).toContain('@supports');
    expect(root.toString()).toContain('@media');
  });
});

describe('mergeRules: media queries that contain one another', () => {
  const merge = async (css: string) =>
    (await postcss([mergeRules()]).process(css, { from: undefined })).root;

  it('puts the narrower min-width last whichever order it arrived in', async () => {
    const root = await merge(
      '@media (min-width:900px){.a{color:blue}}@media (min-width:600px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '@media (min-width:600px){.a{color:red}}@media (min-width:900px){.a{color:blue}}',
    );
  });

  it('puts the narrower max-width last, which is the smaller one', async () => {
    const root = await merge(
      '@media (max-width:600px){.a{color:red}}@media (max-width:900px){.a{color:blue}}',
    );

    expect(root.toString()).toBe(
      '@media (max-width:900px){.a{color:blue}}@media (max-width:600px){.a{color:red}}',
    );
  });

  it('orders a ladder of three', async () => {
    const root = await merge(
      '@media (min-width:1200px){.a{color:green}}' +
        '@media (min-width:600px){.a{color:red}}' +
        '@media (min-width:900px){.a{color:blue}}',
    );

    expect(root.toString()).toBe(
      '@media (min-width:600px){.a{color:red}}' +
        '@media (min-width:900px){.a{color:blue}}' +
        '@media (min-width:1200px){.a{color:green}}',
    );
  });

  it.each([
    ['@media print{.a{color:red}}@media screen{.a{color:blue}}'],
    [
      '@media (min-width:40em){.a{color:red}}@media (min-width:600px){.a{color:blue}}',
    ],
    [
      '@media (min-width:900px){.a{color:red}}@media (min-height:600px){.a{color:blue}}',
    ],
    [
      '@media (min-width:600px) and (max-width:900px){.a{color:red}}' +
        '@media (min-width:700px) and (max-width:1000px){.a{color:blue}}',
    ],
    [
      '@supports (display:grid){.a{color:red}}@supports (display:flex){.a{color:blue}}',
    ],
    [
      '@media (min-width:900px){.a{color:red}}@container (min-width:600px){.a{color:blue}}',
    ],
  ])('leaves a pair it cannot compare where it found it: %s', async (css) => {
    const root = await merge(css);

    expect(root.toString()).toBe(css);
  });

  it('keeps the conditions after the base rules it was already hoisting', async () => {
    const root = await merge(
      '@media (min-width:900px){.a{color:blue}}' +
        '.base{color:black}' +
        '@media (min-width:600px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '.base{color:black}' +
        '@media (min-width:600px){.a{color:red}}' +
        '@media (min-width:900px){.a{color:blue}}',
    );
  });

  /**
   * Reordering one pair has to move something past a query it cannot compare
   * with, because no arrangement satisfies the constraint and leaves every
   * other pair alone. The relative order of two incomparable queries survives
   * only while no comparable pair forces a move.
   */
  it('moves an incomparable query when a comparable pair leaves no choice', async () => {
    const root = await merge(
      '@media (min-width:900px){.a{color:blue}}' +
        '@media print{.a{color:black}}' +
        '@media (min-width:600px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '@media print{.a{color:black}}' +
        '@media (min-width:600px){.a{color:red}}' +
        '@media (min-width:900px){.a{color:blue}}',
    );
  });
});

describe('mergeRules: container queries', () => {
  const merge = async (css: string) =>
    (await postcss([mergeRules()]).process(css, { from: undefined })).root;

  it('orders unnamed container queries, which resolve against one container per element', async () => {
    const root = await merge(
      '@container (min-width:800px){.a{color:blue}}@container (min-width:400px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '@container (min-width:400px){.a{color:red}}@container (min-width:800px){.a{color:blue}}',
    );
  });

  it('orders two queries naming the same container', async () => {
    const root = await merge(
      '@container card (min-width:800px){.a{color:blue}}' +
        '@container card (min-width:400px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '@container card (min-width:400px){.a{color:red}}' +
        '@container card (min-width:800px){.a{color:blue}}',
    );
  });

  it.each([
    '@container card (min-width:800px){.a{color:blue}}@container sidebar (min-width:400px){.a{color:red}}',
    '@container card (min-width:800px){.a{color:blue}}@container (min-width:400px){.a{color:red}}',
    '@container style(--card: 1){.a{color:blue}}@container (min-width:400px){.a{color:red}}',
  ])('leaves two containers it cannot compare alone: %s', async (css) => {
    const root = await merge(css);

    expect(root.toString()).toBe(css);
  });
});

describe('mergeRules: ranges the shared parser reads', () => {
  const merge = async (css: string) =>
    (await postcss([mergeRules()]).process(css, { from: undefined })).root;

  it('orders a bounded range under the open one containing it', async () => {
    const root = await merge(
      '@media (min-width:600px) and (max-width:900px){.a{color:blue}}' +
        '@media (min-width:600px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '@media (min-width:600px){.a{color:red}}' +
        '@media (min-width:600px) and (max-width:900px){.a{color:blue}}',
    );
  });

  it('orders the range syntax the same way', async () => {
    const root = await merge(
      '@media (width >= 900px){.a{color:blue}}@media (width >= 600px){.a{color:red}}',
    );

    expect(root.toString()).toBe(
      '@media (width >= 600px){.a{color:red}}@media (width >= 900px){.a{color:blue}}',
    );
  });

  it('leaves two ranges that cross without containing each other', async () => {
    const css =
      '@media (min-width:600px) and (max-width:900px){.a{color:blue}}' +
      '@media (min-width:700px) and (max-width:1000px){.a{color:red}}';
    const root = await merge(css);

    expect(root.toString()).toBe(css);
  });
});
