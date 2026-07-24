import postcss from 'postcss';
import combineMediaQuery from 'postcss-combine-media-query';
import { transform as lightningCSSTransform } from 'lightningcss';

function isMediaRule(rule: string): boolean {
  let i = 0;

  while (i < rule.length) {
    const char = rule[i];

    if (char === '/' && rule[i + 1] === '*') {
      const end = rule.indexOf('*/', i + 2);
      if (end === -1) return false;
      i = end + 2;
      continue;
    }

    if (
      char === ' ' ||
      char === '\n' ||
      char === '\t' ||
      char === '\r' ||
      char === '\f'
    ) {
      i++;
      continue;
    }

    break;
  }

  return rule.startsWith('@media', i);
}

export function orderMediaLast(rules: string[]): string[] {
  const base: string[] = [];
  const media: string[] = [];

  for (const rule of rules) {
    (isMediaRule(rule) ? media : base).push(rule);
  }

  return [...base, ...media];
}

export async function optimizer(cssCode: string): Promise<string> {
  const merged = await postcss([combineMediaQuery()]).process(cssCode, {
    from: undefined,
  });

  const light = lightningCSSTransform({
    filename: 'global.css',
    code: Buffer.from(merged.css),
    minify: process.env.NODE_ENV === 'production',
    targets: {
      safari: 16 << 16,
      edge: 110 << 16,
      firefox: 110 << 16,
      chrome: 110 << 16,
    },
  });

  return Buffer.from(light.code).toString('utf-8');
}
