import type { PluginCreator, Root, AtRule } from 'postcss';
import { optimizeCSS } from './optimizer';
import { compileCSS } from '@plumeria/compiler';

interface PlumeriaOptions {
  include?: string;
  exclude?: string[];
  cwd?: string;
}

const plugin: PluginCreator<PlumeriaOptions> = (options = {}) => {
  return {
    postcssPlugin: 'postcss-plumeria',
    async Once(root: Root) {
      // Replace the @plumeria at-rule with the generated CSS
      const plumeriaAtRules: AtRule[] = [];

      root.walkAtRules('plumeria', (atRule) => {
        plumeriaAtRules.push(atRule);
      });

      if (plumeriaAtRules.length === 0) {
        return;
      }

      const {
        cwd = process.cwd(),
        exclude = ['**/node_modules/**', '**/dist/**', '**/.next/**'],
        include = '**/*.{js,jsx,ts,tsx}',
      } = options;

      const genCSS = compileCSS({
        include: include,
        exclude: exclude,
        cwd: cwd,
      });
      const optInCSS = await optimizeCSS(genCSS);

      plumeriaAtRules.forEach((atRule) => {
        atRule.replaceWith(optInCSS);
      });
    },
  };
};

plugin.postcss = true;
module.exports = plugin;
