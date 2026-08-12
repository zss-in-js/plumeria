import postcss from 'postcss';
import { transform as lightningCSSTransform } from 'lightningcss';
import { mergeRules } from './mergeRules';

export async function optimizer(cssCode: string): Promise<string> {
  const merged = await postcss([mergeRules()]).process(cssCode, {
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
