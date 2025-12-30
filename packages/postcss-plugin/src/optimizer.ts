import postcss from 'postcss';
import combineMediaQuery from 'postcss-combine-media-query';
import { transform as lightningCSSTransform } from 'lightningcss';

export async function optimizeCSS(cssCode: string): Promise<string> {
  const merged = await postcss([combineMediaQuery()]).process(cssCode, {
    from: undefined,
  });

  const light = lightningCSSTransform({
    filename: 'stylesheet.css',
    code: Buffer.from(merged.css),
    minify: process.env.NODE_ENV === 'production',
    targets: {
      safari: 16,
      edge: 110,
      firefox: 110,
      chrome: 110,
    },
  });

  return Buffer.from(light.code).toString('utf-8');
}
