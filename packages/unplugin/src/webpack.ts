import { createWebpackPlugin } from 'unplugin';
import { unpluginFactory, type PluginOptions } from './core';
import * as path from 'path';

const ZERO_CSS_SUFFIX = '(?:$|\\?|%3F)';
const VIRTUAL_CSS_PATH = new RegExp(`\\.zero\\.css${ZERO_CSS_SUFFIX}`);

export function attachWebpackHooks(plugin: any) {
  const { setDev, setRoot } = plugin.__plumeriaInternal;

  plugin.transformInclude = (id: string) => {
    const [pathId] = id.split('?', 1);
    return (
      /\.(ts|tsx|js|jsx)$/.test(pathId) &&
      !pathId.includes('node_modules') &&
      !pathId.endsWith('.html')
    );
  };

  plugin.loadInclude = (id: string) => {
    const [pathId] = id.split('?', 1);
    return pathId.endsWith('.zero.css');
  };

  const originalTransform = plugin.transform;
  plugin.transform = async function (this: any, code: string, id: string) {
    const result = await originalTransform.call(this, code, id);
    if (result && typeof result === 'object' && result.code) {
      const { cssFileLookup } = plugin.__plumeriaInternal;
      result.code = result.code.replace(
        /import\s+"(\/[^"]+\.zero\.css)";/g,
        (_match: string, cssPath: string) => {
          const absoluteCssPath = cssFileLookup.get(cssPath);
          if (!absoluteCssPath) return _match;
          let rel = path
            .relative(path.dirname(id), absoluteCssPath)
            .replace(/\\/g, '/');
          if (!rel.startsWith('.')) rel = `./${rel}`;
          return `import "${rel}?t=${Date.now()}";`;
        },
      );
    }
    return result;
  };

  plugin.resolveId = function (id: string, importer?: string) {
    const [pathId, query] = id.split('?');
    const { cssLookup } = plugin.__plumeriaInternal;

    if (pathId.endsWith('.zero.css')) {
      let resolvedAbsolute: string | null = null;

      if (cssLookup.has(pathId)) {
        resolvedAbsolute = pathId;
      } else if (importer) {
        const resolved = path
          .resolve(path.dirname(importer), pathId)
          .replace(/\\/g, '/');
        if (cssLookup.has(resolved)) {
          resolvedAbsolute = resolved;
        }
      }

      if (resolvedAbsolute) {
        return query ? `${resolvedAbsolute}?${query}` : resolvedAbsolute;
      }
    }
    return null;
  };

  plugin.load = function (this: any, id: string) {
    const [pathId] = id.split('?', 1);
    const { cssLookup, targets } = plugin.__plumeriaInternal;

    const sourceTarget = targets.find(
      (t: any) =>
        `${t.id.replace(/\.(ts|tsx|js|jsx)$/, '')}.zero.css` === pathId,
    );
    if (sourceTarget && typeof this.addDependency === 'function') {
      this.addDependency(sourceTarget.id);
    }

    const css = cssLookup.get(pathId);
    if (css == null) return null;

    return { code: css, moduleType: 'css' };
  };

  const hookFn = (compiler: any) => {
    if (compiler.isChild()) return;

    setRoot(compiler.context);
    if (compiler.options.mode === 'development') {
      setDev(true);
    }
    const rules = compiler.options.module?.rules;

    if (rules && Array.isArray(rules)) {
      const cssRule = rules.find(
        (rule: any) =>
          rule &&
          rule.test &&
          rule.test instanceof RegExp &&
          rule.test.test('test.css'),
      );

      if (cssRule) {
        rules.unshift({
          ...cssRule,
          test: VIRTUAL_CSS_PATH,
          type: 'css/auto',
          enforce: 'pre',
        });
      } else {
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i] as any;
          if (
            rule &&
            rule.type === 'javascript/auto' &&
            Array.isArray(rule.use) &&
            rule.use.some(
              (u: any) => u?.loader && String(u.loader).includes('load.mjs'),
            )
          ) {
            const origInclude = rule.include;
            rule.include = (id: string) => {
              if (VIRTUAL_CSS_PATH.test(id)) return false;
              return typeof origInclude === 'function' ? origInclude(id) : true;
            };

            rules.unshift({
              include: (id: string) => {
                if (!VIRTUAL_CSS_PATH.test(id)) return false;
                return typeof origInclude === 'function'
                  ? origInclude(id)
                  : true;
              },
              enforce: rule.enforce,
              use: rule.use,
              type: 'css/auto',
            });
            break;
          }
        }
      }
    }
  };

  return {
    ...plugin,
    webpack: hookFn,
    rspack: hookFn,
  };
}

export default createWebpackPlugin<PluginOptions | undefined>(
  (options, meta) => {
    return attachWebpackHooks(unpluginFactory(options, meta));
  },
);
