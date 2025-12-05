import type { LoaderContext, WebpackPluginInstance } from 'webpack';
import { parseSync, ObjectExpression } from '@swc/core';

import path from 'path';
import fs from 'fs';

import type { CreateStyle, CreateTokens, CSSProperties } from 'zss-engine';
import { transpile } from 'zss-engine';

import type { CSSObject, FileStyles } from '@plumeria/utils';
import {
  createCSS,
  createTokens,
  collectLocalConsts,
  objectExpressionToObject,
  scanForDefineConsts,
  scanForDefineTokens,
  scanForKeyframes,
  scanForViewTransition,
  t,
  tables,
  traverse,
} from '@plumeria/utils';

interface PlumeriaPlugin extends WebpackPluginInstance {
  registerFileStyles(fileName: string, styles: FileStyles): void;
  __plumeriaRegistered?: Map<string, string>;
}

export default function loader(this: LoaderContext<unknown>, source: string) {
  const callback = this.async();

  this.clearDependencies();
  this.addDependency(this.resourcePath);

  tables.constTable = scanForDefineConsts((path) => this.addDependency(path));

  const { keyframesHashTableLocal, keyframesObjectTableLocal } =
    scanForKeyframes((path) => this.addDependency(path));
  tables.keyframesHashTable = keyframesHashTableLocal;
  tables.keyframesObjectTable = keyframesObjectTableLocal;

  const { viewTransitionHashTableLocal, viewTransitionObjectTableLocal } =
    scanForViewTransition((path) => this.addDependency(path));
  tables.viewTransitionHashTable = viewTransitionHashTableLocal;
  tables.viewTransitionObjectTable = viewTransitionObjectTableLocal;

  const { tokensTableLocal, defineTokensObjectTableLocal } =
    scanForDefineTokens((path) => this.addDependency(path));

  tables.tokensTable = tokensTableLocal;
  tables.defineTokensObjectTable = defineTokensObjectTableLocal;

  const extractedObjects: CSSObject[] = [];
  let ast;
  try {
    ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });
  } catch (err) {
    console.log(err);
    callback(null, source);
    return;
  }

  const localConsts = collectLocalConsts(ast);
  Object.assign(tables.constTable, localConsts);

  let hasCssCreate = false;

  traverse(ast, {
    CallExpression({ node }) {
      const callee = node.callee;
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'css' }) &&
        t.isIdentifier(callee.property)
      ) {
        const args = node.arguments;
        if (
          callee.property.value === 'create' &&
          args.length === 1 &&
          t.isObjectExpression(args[0].expression)
        ) {
          hasCssCreate = true;
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            tables.constTable,
            tables.keyframesHashTable,
            tables.viewTransitionHashTable,
            tables.tokensTable,
          );
          if (obj) {
            extractedObjects.push(obj);
          }
        }
      }
    },
  });

  const fileStyles: FileStyles = {};
  if (extractedObjects.length > 0) {
    const combinedStyles = extractedObjects.reduce<CSSObject>(
      (acc, obj) => Object.assign(acc, obj),
      {},
    );

    const base = createCSS(combinedStyles as CreateStyle);
    if (base) {
      fileStyles.baseStyles = base;
    }
  }

  if (Object.keys(tables.keyframesObjectTable).length > 0) {
    fileStyles.keyframeStyles = Object.entries(tables.keyframesObjectTable)
      .map(
        ([hash, obj]) =>
          transpile({ [`@keyframes kf-${hash}`]: obj }, undefined, '--global')
            .styleSheet,
      )
      .join('\n');
  }

  if (Object.keys(tables.viewTransitionObjectTable).length > 0) {
    fileStyles.viewTransitionStyles = Object.entries(
      tables.viewTransitionObjectTable,
    )
      .map(
        ([hash, obj]) =>
          transpile(
            {
              [`::view-transition-group(vt-${hash})`]:
                obj.group as CSSProperties,
              [`::view-transition-image-pair(vt-${hash})`]:
                obj.imagePair as CSSProperties,
              [`::view-transition-old(vt-${hash})`]: obj.old as CSSProperties,
              [`::view-transition-new(vt-${hash})`]: obj.new as CSSProperties,
            },
            undefined,
            '--global',
          ).styleSheet,
      )
      .join('\n');
  }

  if (Object.keys(tables.defineTokensObjectTable).length > 0) {
    fileStyles.tokenStyles = Object.values(tables.defineTokensObjectTable)
      .map(
        (obj) =>
          transpile(createTokens(obj as CreateTokens), undefined, '--global')
            .styleSheet,
      )
      .join('\n');
  }

  // --- Register it in the plugin (this is the only point of contact between the loader and the plugin)

  const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
  const VIRTUAL_CSS_PATH = require.resolve(VIRTUAL_FILE_PATH);

  function stringifyRequest(
    loaderContext: LoaderContext<unknown>,
    request: string,
  ) {
    return JSON.stringify(
      loaderContext.utils.contextify(
        loaderContext.context || loaderContext.rootContext,
        request,
      ),
    );
  }

  const virtualCssImportPath = path.posix.join(
    path.posix.relative(
      path.dirname(this.resourcePath),
      path.resolve(__dirname, '..', VIRTUAL_CSS_PATH),
    ),
  );

  let importPath = virtualCssImportPath;
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }

  const serializedStyleRules = JSON.stringify(fileStyles);
  const urlParams = new URLSearchParams({
    from: this.resourcePath,
    plumeria: serializedStyleRules,
  });

  const virtualCssRequest = stringifyRequest(
    this,
    `${VIRTUAL_CSS_PATH}?${urlParams.toString()}`,
  );
  const postfix = `\nimport ${virtualCssRequest};`;

  const pluginInstance = this._compiler?.options?.plugins.find(
    (p): p is PlumeriaPlugin => p?.constructor?.name === 'PlumeriaPlugin',
  );

  const fileKey = this.resourcePath;

  if (pluginInstance) {
    if (!pluginInstance?.__plumeriaRegistered) {
      pluginInstance.__plumeriaRegistered = new Map<string, string>();
    }

    const cache = pluginInstance.__plumeriaRegistered;
    const previousRequest = cache.get(fileKey);

    // Replace if previous request is different
    if (previousRequest !== virtualCssRequest) {
      cache.set(fileKey, virtualCssRequest);
      pluginInstance.registerFileStyles(fileKey, fileStyles);
    }
  }

  let css = '';
  css = fs.readFileSync(
    path.resolve(__dirname, '../zero-virtual.css'),
    'utf-8',
  );

  function generateOrderedCSS(styles: typeof fileStyles): string {
    const sections: string[] = [];

    if (styles.keyframeStyles?.trim()) {
      if (!css.includes(styles.keyframeStyles))
        sections.push(styles.keyframeStyles);
    }

    if (styles.viewTransitionStyles?.trim()) {
      if (!css.includes(styles.viewTransitionStyles))
        sections.push(styles.viewTransitionStyles);
    }

    if (styles.tokenStyles?.trim()) {
      if (!css.includes(styles.tokenStyles)) sections.push(styles.tokenStyles);
    }

    if (styles.baseStyles?.trim()) {
      if (!css.includes(styles.baseStyles)) sections.push(styles.baseStyles);
    }

    return sections.join('\n');
  }

  const orderedCSS = generateOrderedCSS(fileStyles);
  const relativeId = path.relative(process.cwd(), this.resourcePath);
  const hmrCode = `
    if (module.hot) {
      module.hot.accept(${virtualCssRequest});

      const styleId = "plumeria-hmr";
      const fileKey = ${JSON.stringify(relativeId)};
      
      let styleEl = document.getElementById(styleId);
      
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        styleEl.setAttribute("data-plumeria-hmr", "");
        document.head.prepend(styleEl);
        styleEl.__plumeriaStyles = {};
      }

      styleEl.__plumeriaStyles[fileKey] = ${JSON.stringify(orderedCSS)};
      styleEl.textContent = Object.values(styleEl.__plumeriaStyles).join('\\n');

      module.hot.dispose(() => {
        if (styleEl && styleEl.__plumeriaStyles) {
          delete styleEl.__plumeriaStyles[fileKey];
          styleEl.textContent = Object.values(styleEl.__plumeriaStyles).join('\\n');
          
          if (Object.keys(styleEl.__plumeriaStyles).length === 0 && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
          }
        }
      });
    }
  `;

  if (hasCssCreate) {
    callback(null, source + hmrCode);
    return;
  }

  const useClientDirective = /^\s*['"]use client['"]/;

  if (!useClientDirective.test(source)) {
    callback(null, source + postfix);
    return;
  }

  callback(null, source);
}
