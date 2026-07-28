import type { Rule } from 'eslint';

export const DEFAULT_STYLE_PROP = 'styleName';

export const stylePropSchema = [
  {
    type: 'object',
    properties: {
      styleProp: { type: 'string' },
    },
    additionalProperties: false,
  },
];

interface StylePropOption {
  styleProp?: string;
}

export function resolveStyleProp(context: Rule.RuleContext): string {
  const fromRule = (context.options?.[0] as StylePropOption | undefined)
    ?.styleProp;
  if (fromRule) return fromRule;

  const fromSettings = (
    context.settings as { plumeria?: StylePropOption } | undefined
  )?.plumeria?.styleProp;

  return fromSettings ?? DEFAULT_STYLE_PROP;
}
