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
