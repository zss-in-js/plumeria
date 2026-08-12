import { getStyleRecords } from '../../utils/src/create';
import { optimizer } from '../../utils/src/optimizer';
import { splitCssRules } from '../src/split-css-rules';
import type { CSSProperties } from 'zss-engine';

/**
 * The dev loader accumulates rules from separate module compiles into one
 * shared file. The whole accumulated stylesheet is optimized after new rules
 * are added so identical selectors and at-rules also merge across modules.
 */

const MEDIA_STYLE: CSSProperties = {
  '@media (min-width: 600px)': { padding: 40 },
} as CSSProperties;
const BASE_STYLE: CSSProperties = { paddingTop: 4 } as CSSProperties;
const BOTH_STYLE: CSSProperties = { ...MEDIA_STYLE, ...BASE_STYLE };
const OTHER_MEDIA_STYLE: CSSProperties = {
  '@media (min-width: 600px)': { margin: 8 },
} as CSSProperties;

const sheetsOf = (style: CSSProperties) =>
  getStyleRecords(style)
    .map((record) => record.sheet)
    .join('');

/** Replays the loader's write path for one module compile. */
const compileModule = async (currentCss: string, style: CSSProperties) => {
  const ruleSet = new Set(splitCssRules(currentCss));
  let hasNewRule = false;

  for (const rule of splitCssRules(await optimizer(sheetsOf(style)))) {
    if (!ruleSet.has(rule)) {
      ruleSet.add(rule);
      hasNewRule = true;
    }
  }

  if (!hasNewRule) return currentCss;
  return optimizer(Array.from(ruleSet).join('\n\n'));
};

describe('shared virtual CSS rule order', () => {
  it('moves a merged at-rule after base rules', async () => {
    // module A uses only the @media style, so it lands in the file alone
    let css = await compileModule('', MEDIA_STYLE);
    // module B puts both atoms on one element; only the base rule is new
    css = await compileModule(css, BOTH_STYLE);

    const base = css.indexOf('padding-top: 4px');
    const media = css.indexOf('@media (min-width: 600px)');

    expect(base).toBeGreaterThanOrEqual(0);
    expect(media).toBeGreaterThan(base);
  });

  it('does not duplicate rules when a module is recompiled', async () => {
    // two modules contributing different atoms under the same query
    let css = await compileModule('', MEDIA_STYLE);
    css = await compileModule(css, OTHER_MEDIA_STYLE);
    const afterFirstPass = css;

    // HMR: module A is saved again and contributes nothing new
    for (let i = 0; i < 3; i++) {
      css = await compileModule(css, MEDIA_STYLE);
    }

    expect(css).toBe(afterFirstPass);
    expect(css.match(/padding: 40px/g)).toHaveLength(1);
  });

  it('keeps a standalone comment out of the rule that follows it', async () => {
    // next-plugin resets the shared file to a placeholder comment. A comment
    // glued onto the next rule would make that rule's text differ from the
    // freshly generated one, so @media ordering has to survive it too.
    const rules = splitCssRules(
      '/** Placeholder file */\n\n@media (min-width: 600px) { .m { padding: 40px; } }\n\n.b { padding-top: 4px; }\n',
    );

    expect(rules[0]).toBe('/** Placeholder file */');
    expect(rules[1]).toContain('@media');

    const optimized = await optimizer(rules.join('\n\n'));

    expect(optimized).toContain('@media');
    expect(optimized).toContain('padding-top');
  });

  it('re-matches the rule after a comment instead of appending it twice', async () => {
    // The module that owns the first rule in the file recompiles on every save
    // and offers the same CSS again. If the placeholder comment were attached to
    // that rule, the offer would never match and the rule would pile up.
    const moduleCss = await optimizer(sheetsOf(BASE_STYLE));

    let css = '/** Placeholder file */\n';
    for (let save = 0; save < 3; save++) {
      const ruleSet = new Set(splitCssRules(css));
      for (const rule of splitCssRules(moduleCss)) ruleSet.add(rule);
      css = await optimizer(Array.from(ruleSet).join('\n\n'));
    }

    expect(css.match(/padding-top: 4px/g)).toHaveLength(1);
  });

  it('moves supported at-rules after base rules in their original order', async () => {
    const css = [
      '.a { color: red; }',
      '@supports (display: grid) { .s { color: green; } }',
      '@container (min-width: 400px) { .c { color: blue; } }',
      '@media (min-width: 600px) { .m { color: navy; } }',
      '.z { color: gray; }',
    ].join('\n\n');

    const optimized = splitCssRules(await optimizer(css));
    expect(optimized[0]).toContain('.a');
    expect(optimized[1]).toContain('.z');
    expect(optimized[2]).toContain('@supports');
    expect(optimized[3]).toContain('@container');
    expect(optimized[4]).toContain('@media');
  });
});
