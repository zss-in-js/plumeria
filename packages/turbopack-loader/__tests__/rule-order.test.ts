import { getStyleRecords } from '../../utils/src/create';
import { optimizer, orderMediaLast } from '../../utils/src/optimizer';
import { splitCssRules } from '../src/split-css-rules';
import type { CSSProperties } from 'zss-engine';

/**
 * The dev loader accumulates rules from separate module compiles into one
 * shared file. Each module's own optimizer() pass only orders that module's
 * rules, so the shared file needs the same "@media last" order re-applied.
 *
 * "@media { padding }" and base "paddingTop" both carry one :not(#\#), so they
 * tie on specificity and whichever comes last in the file wins. Production runs
 * optimizer() once over the whole stylesheet and always ends up with @media
 * last; dev has to match that.
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
  return orderMediaLast(Array.from(ruleSet)).join('\n\n') + '\n';
};

describe('shared virtual CSS rule order', () => {
  it('keeps base rules ahead of @media when an earlier module inserted the @media rule first', async () => {
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

  it('is a stable partition', () => {
    const rules = [
      '.a {}',
      '@media (x) { .b {} }',
      '.c {}',
      '@media (y) { .d {} }',
    ];

    expect(orderMediaLast(rules)).toEqual([
      '.a {}',
      '.c {}',
      '@media (x) { .b {} }',
      '@media (y) { .d {} }',
    ]);
    expect(orderMediaLast(orderMediaLast(rules))).toEqual(
      orderMediaLast(rules),
    );
  });

  it('moves an @media rule that splitCssRules prefixed with a comment', () => {
    // next-plugin resets the shared file to a placeholder comment, and
    // splitCssRules attaches a leading comment to the rule that follows it
    const rules = splitCssRules(
      '/** Placeholder file */\n\n@media (min-width: 600px) { .m { padding: 40px; } }\n\n.b { padding-top: 4px; }\n',
    );

    expect(rules[0]).toContain('Placeholder');
    expect(rules[0]).toContain('@media');

    const ordered = orderMediaLast(rules);

    expect(ordered[ordered.length - 1]).toContain('@media');
    expect(ordered[0]).toContain('padding-top');
  });

  it('matches the order optimizer() produces', async () => {
    const css = [
      '.a { color: red; }',
      '@supports (display: grid) { .s { color: green; } }',
      '@container (min-width: 400px) { .c { color: blue; } }',
      '@media (min-width: 600px) { .m { color: navy; } }',
      '.z { color: gray; }',
    ].join('\n\n');

    // optimizer() moves @media to the end and leaves every other at-rule alone,
    // which is exactly what orderMediaLast reproduces. If that ever changes,
    // this fails and orderMediaLast has to be updated with it.
    const optimized = splitCssRules(await optimizer(css));
    const firstMedia = optimized.findIndex((rule) => rule.startsWith('@media'));

    expect(firstMedia).toBe(optimized.length - 1);
    expect(optimized[0].startsWith('@media')).toBe(false);
    expect(orderMediaLast(optimized)).toEqual(optimized);
  });
});
