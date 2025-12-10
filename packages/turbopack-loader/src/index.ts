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

interface TurbopackLoaderContext {
  resourcePath: string;
  rootContext: string;
  context: string;
  clearDependencies: () => void;
  addDependency: (path: string) => void;
  async: () => (
    err: Error | null,
    content?: string | Buffer,
    sourceMap?: any,
  ) => void;
}

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
fs.writeFileSync(VIRTUAL_FILE_PATH, '');

export default function loader(this: TurbopackLoaderContext, source: string) {
  const callback = this.async();

  if (this.resourcePath.includes('node_modules')) {
    return callback(null, source);
  }

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

  // --- Turbopack specific: Write directly to zero-virtual.css ---

  const VIRTUAL_CSS_PATH = require.resolve(VIRTUAL_FILE_PATH);

  function stringifyRequest(
    loaderContext: TurbopackLoaderContext,
    request: string,
  ) {
    const context = loaderContext.context || loaderContext.rootContext;
    const relativePath = path.relative(context, request);
    const requestPath = relativePath.startsWith('.')
      ? relativePath
      : './' + relativePath;
    return JSON.stringify(requestPath);
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

  // Note: We don't use urlParams for data passing in Turbopack as we write directly
  const virtualCssRequest = stringifyRequest(this, `${VIRTUAL_CSS_PATH}`);
  const postfix = `\nimport ${virtualCssRequest};`;

  // Read current CSS to check for duplicates
  let css = '';
  try {
    css = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
  } catch (e) {
    e;
    // File might not exist yet
  }

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

  if (orderedCSS) {
    if (!css.includes(orderedCSS))
      fs.appendFileSync(VIRTUAL_FILE_PATH, orderedCSS + '\n');
  }

  callback(null, source + postfix);
}
