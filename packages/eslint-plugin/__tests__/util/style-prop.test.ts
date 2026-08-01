import type { Rule } from 'eslint';
import {
  DEFAULT_STYLE_PROP,
  resolveStyleProp,
  stylePropSchema,
} from '../../src/util/style-prop';

const contextOf = (options: unknown[], settings: object = {}) =>
  ({ options, settings }) as unknown as Rule.RuleContext;

describe('resolveStyleProp', () => {
  it('prefers the name given as a rule option', () => {
    expect(
      resolveStyleProp(
        contextOf([{ styleProp: 'sx' }], { plumeria: { styleProp: 'cx' } }),
      ),
    ).toBe('sx');
  });

  it('falls back to the shared setting', () => {
    expect(
      resolveStyleProp(contextOf([], { plumeria: { styleProp: 'cx' } })),
    ).toBe('cx');
  });

  it('falls back to the default when neither is set', () => {
    expect(resolveStyleProp(contextOf([], {}))).toBe(DEFAULT_STYLE_PROP);
    expect(resolveStyleProp(contextOf([], { plumeria: {} }))).toBe(
      DEFAULT_STYLE_PROP,
    );
  });

  it('falls back to the default when the rule option is empty', () => {
    expect(resolveStyleProp(contextOf([{ styleProp: '' }], {}))).toBe(
      DEFAULT_STYLE_PROP,
    );
  });

  it('falls back to the default when the context carries neither field', () => {
    expect(resolveStyleProp({} as Rule.RuleContext)).toBe(DEFAULT_STYLE_PROP);
  });
});

describe('stylePropSchema', () => {
  it('accepts styleProp and nothing else', () => {
    expect(stylePropSchema).toEqual([
      {
        type: 'object',
        properties: { styleProp: { type: 'string' } },
        additionalProperties: false,
      },
    ]);
  });
});
