import type { UnpluginFactory } from 'unplugin';
import { createFilter } from '@rollup/pluginutils';
import { parseSync } from '@swc/core';
import type {
  Expression,
  HasSpan,
  ImportSpecifier,
  ImportDeclaration,
  ObjectExpression,
  Identifier,
  CallExpression,
  VariableDeclaration,
  VariableDeclarator,
  JSXAttributeOrSpread,
  JSXAttribute,
  Statement,
  SpreadElement,
  ExportDeclaration,
  JSXOpeningElement,
  MemberExpression,
} from '@swc/core';
import * as path from 'path';
import {
  applyCssValue,
  genBase36Hash,
  exceptionCamelCase,
  camelToKebabCase,
  isAtRule,
} from 'zss-engine';
import type { CSSProperties } from 'zss-engine';
import {
  traverse,
  collectReferenceIdentifiers,
  getStyleRecords,
  getStateWeights,
  collectLocalConsts,
  objectExpressionToObject,
  t,
  getRootIdentifier,
  extractOndemandStyles,
  deepMerge,
  scanAll,
  resolveImportPath,
  getLeadingCommentLength,
  optimizer,
  getFileDependencies,
  resolveExport,
  resolveComponentKey,
  DEFAULT_STYLE_PROP,
} from '@plumeria/utils';
import type {
  StyleRecord,
  StyleSource,
  StaticTable,
  KeyframesHashTable,
  ViewTransitionHashTable,
  CreateHashTable,
  VariantsHashTable,
  CreateThemeHashTable,
  CreateStaticHashTable,
  CSSObject,
} from '@plumeria/utils';

export interface PluginOptions {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
  devEmitToDisk?: boolean;
  styleProp?: string;
}

type CreateStyleValue = {
  name: string;
  type: 'create' | 'constant';
  obj: CSSObject;
  hashMap: Record<string, Record<string, string>> | CSSObject;
  isExported: boolean;
  initSpan: { start: number; end: number };
  declSpan: { start: number; end: number };
  functions?: Record<
    string,
    { params: string[]; named?: NamedParam[]; body: ObjectExpression }
  >;
};

interface StyleConditional {
  test: Expression;
  testString?: string;
  testLHS?: string;
  truthy: CSSObject;
  falsy: CSSObject;
  groupId?: number;
  groupName?: string;
  valueName?: string;
  varName?: string;
  ownKeys?: boolean;
  // Position among the sources of one styling prop. Later sources win, so the
  // conflict table has to merge them in this order and not by kind.
  order?: number;
}

export const TARGET_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];
export const EXTENSION_PATTERN = /\.(ts|tsx|js|jsx)$/;

// A named argument folds into the style only when its value is written out in
// full. Anything the parser can only read in part -- a template literal with an
// interpolation, an expression -- has to reach the element as a custom property
// instead, or the missing piece is silently baked into the rule.
const isStaticArgValue = (node: Expression): boolean =>
  node.type === 'StringLiteral' ||
  node.type === 'NumericLiteral' ||
  node.type === 'BooleanLiteral' ||
  (node.type === 'TemplateLiteral' && node.expressions.length === 0) ||
  t.isIdentifier(node) ||
  t.isMemberExpression(node);

type NamedParam = { key: string; local: string };

// A dynamic style function may name its parameters by destructuring them, in
// which case the call passes one object and the key it uses is not necessarily
// the name the body reads.
const namedParamsOf = (params: unknown[]): NamedParam[] | undefined => {
  if (params.length !== 1) return undefined;
  const first = params[0] as { type?: string; pat?: { type?: string } };
  const pattern = (first?.pat ?? first) as {
    type?: string;
    properties?: any[];
  };
  if (pattern?.type !== 'ObjectPattern') return undefined;

  const named: NamedParam[] = [];
  for (const prop of pattern.properties ?? []) {
    if (
      prop.type === 'AssignmentPatternProperty' &&
      t.isIdentifier(prop.key) &&
      !prop.value
    ) {
      named.push({ key: prop.key.value, local: prop.key.value });
    } else if (
      prop.type === 'KeyValuePatternProperty' &&
      t.isIdentifier(prop.key) &&
      t.isIdentifier(prop.value)
    ) {
      named.push({ key: prop.key.value, local: prop.value.value });
    } else {
      return undefined;
    }
  }
  return named.length > 0 ? named : undefined;
};

type StyleFunctions = NonNullable<CreateStyleValue['functions']>;

const styleFunctionsOf = (objExpr: ObjectExpression): StyleFunctions => {
  const styleFunctions: StyleFunctions = {};

  objExpr.properties.forEach((prop) => {
    if (prop.type !== 'KeyValueProperty' || prop.key.type !== 'Identifier')
      return;

    const func = prop.value;
    if (
      func.type !== 'ArrowFunctionExpression' &&
      func.type !== 'FunctionExpression'
    )
      return;

    const params: string[] = func.params.map((p: any) => {
      if (t.isIdentifier(p)) return p.value;
      if (
        typeof p === 'object' &&
        p !== null &&
        'pat' in p &&
        t.isIdentifier(p.pat)
      )
        return p.pat.value;
      return 'arg';
    });

    let actualBody: Expression | Statement | undefined = func.body;
    if (actualBody?.type === 'ParenthesisExpression')
      actualBody = actualBody.expression;
    if (actualBody?.type === 'BlockStatement') {
      const first = actualBody.stmts?.[0];
      if (first?.type === 'ReturnStatement') actualBody = first.argument;
      if (actualBody?.type === 'ParenthesisExpression')
        actualBody = actualBody.expression;
    }

    if (actualBody && actualBody.type === 'ObjectExpression') {
      styleFunctions[prop.key.value] = {
        params,
        named: namedParamsOf(func.params),
        body: actualBody as ObjectExpression,
      };
    }
  });
  return styleFunctions;
};

type DynamicVar = {
  cssVar: string;
  valueExpr: string;
  test?: string;
  order?: number;
};

const foldDynamicVars = (vars: DynamicVar[]): string[] => {
  const grouped = new Map<string, DynamicVar[]>();
  [...vars]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((entry) => {
      const list = grouped.get(entry.cssVar);
      if (list) list.push(entry);
      else grouped.set(entry.cssVar, [entry]);
    });

  return [...grouped].map(([cssVar, entries]) => {
    let value = 'undefined';
    entries.forEach((entry) => {
      value = entry.test
        ? `((${entry.test}) ? ${entry.valueExpr} : ${value})`
        : entry.valueExpr;
    });
    return `"${cssVar}": ${value}`;
  });
};

const findVarProp = (style: CSSObject, cssVar: string): string | undefined => {
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(cssVar)) return prop;
    if (value !== null && typeof value === 'object') {
      const nested = findVarProp(value as CSSObject, cssVar);
      if (nested) return nested;
    }
  }
  return undefined;
};

export const unpluginFactory: UnpluginFactory<PluginOptions | undefined> = (
  options = {},
  unpluginMeta,
) => {
  const filter = createFilter(options.include, options.exclude);
  const styleProp = options.styleProp ?? DEFAULT_STYLE_PROP;

  const cssLookup = new Map<string, string>();
  const cssFileLookup = new Map<string, string>();
  const targets: { id: string; dependencies: string[] }[] = [];

  const devCssSheets = new Map<string, Set<string>>();
  let isDev = false;
  let viteRoot: string = process.cwd();

  return {
    name: '@plumeria/unplugin',
    enforce: 'pre',

    // Internal state for bundler-specific hooks
    __plumeriaInternal: {
      cssLookup,
      cssFileLookup,
      targets,
      devCssSheets,
      unpluginMeta,
      setDev(value: boolean) {
        isDev = value;
      },
      setRoot(root: string) {
        viteRoot = root;
      },
    },

    resolveId(id, importer) {
      const [pathId, query] = id.split('?');
      if (pathId.endsWith('.zero.css')) {
        if (pathId.startsWith('/')) {
          return id;
        }
        if (importer && !path.isAbsolute(pathId)) {
          const resolved = path.resolve(path.dirname(importer), pathId);
          return query ? `${resolved}?${query}` : resolved;
        }
        return query ? `${pathId}?${query}` : pathId;
      }
      return null;
    },

    loadInclude(id) {
      const [pathId] = id.split('?');
      return pathId.endsWith('.zero.css');
    },

    load(id) {
      const [pathId] = id.split('?', 1);
      const resolved = cssFileLookup.get(pathId) ?? path.join(viteRoot, pathId);
      return cssLookup.get(resolved) ?? cssLookup.get(pathId) ?? '';
    },

    transformInclude(id) {
      return filter(id);
    },

    async transform(source, id) {
      if (id.includes('node_modules')) return null;
      if (!source.includes('@plumeria/core')) return null;

      const [baseId] = id.split('?');
      if (!filter(baseId)) return null;

      const dependencies: string[] = [];
      const addDependency = (depPath: string) => {
        dependencies.push(depPath);
        if ((this as any).addWatchFile) {
          (this as any).addWatchFile(depPath);
        }
      };

      const ast = parseSync(source, {
        syntax: 'typescript',
        tsx: true,
        target: 'es2022',
      });

      const leadingLen = getLeadingCommentLength(source);
      const sourceBuffer = Buffer.from(source, 'utf-8');
      const leadingBytes = Buffer.byteLength(
        source.slice(0, leadingLen),
        'utf-8',
      );
      const baseByteOffset = ast.span.start - leadingBytes;

      const throwCompilationError = (
        message: string,
        node?: HasSpan,
      ): never => {
        let suffix = '';
        if (node) {
          const offset = node.span.start - baseByteOffset;
          let line = 1;
          let colStart = 0;
          for (let i = 0; i < offset && i < sourceBuffer.length; i++) {
            if (sourceBuffer[i] === 10) {
              line++;
              colStart = i + 1;
            }
          }
          const col = offset - colStart + 1;
          suffix = ` (${path.basename(resourcePath)}:${line}:${col})`;
        }
        const err = new Error(`${message}${suffix}`);
        err.stack = err.message;
        throw err;
      };

      const assertResolvable = (node: HasSpan): void => {
        if (t.isIdentifier(node) && (node as Identifier).value === 'undefined')
          return;
        if (
          t.isMemberExpression(node) ||
          t.isIdentifier(node) ||
          t.isCallExpression(node) ||
          t.isArrowFunctionExpression(node) ||
          t.isFunctionExpression(node)
        ) {
          const rootId = getRootIdentifier(node);
          const isPlumeriaStyle =
            rootId &&
            ((localCreateStyles[rootId] !== undefined &&
              localCreateStyles[rootId].type !== 'constant') ||
              mergedCreateTable[rootId] !== undefined ||
              mergedVariantsTable[rootId] !== undefined);
          if (!isPlumeriaStyle) {
            throwCompilationError(
              `Plumeria: Dynamic or unresolvable style object "${getSource(node)}" is not supported.`,
              node,
            );
          }
        }
      };

      for (const node of ast.body) {
        if (node.type === 'ImportDeclaration') {
          const sourcePath = node.source.value;
          const actualPath = resolveImportPath(sourcePath, id);
          if (actualPath) {
            addDependency(actualPath);
            const transDeps = getFileDependencies(actualPath);
            for (const dep of transDeps) {
              addDependency(dep);
            }
          }
        }
      }

      const scannedTables = scanAll();

      // Reverse edges child -> parents: this file's compiled lookup map
      // depends on prop entries discovered while scanning the parents that
      // render it, so editing a parent must re-transform this file.
      if (scannedTables.componentPropsTable) {
        const parentFiles = new Set<string>();
        for (const compKey of Object.keys(scannedTables.componentPropsTable)) {
          if (!compKey.startsWith(`${id}-`)) continue;
          const props = scannedTables.componentPropsTable[compKey];
          for (const propName of Object.keys(props)) {
            for (const entry of props[propName]) {
              if (entry.filePath !== id) {
                parentFiles.add(entry.filePath);
              }
            }
          }
        }
        for (const parentFile of parentFiles) {
          addDependency(parentFile);
        }
      }

      const components: Array<{ name: string; node: HasSpan }> = [];
      for (const node of ast.body) {
        const statement = t.isExportDeclaration(node) ? node.declaration : node;
        if (statement.type === 'FunctionDeclaration' && statement.identifier) {
          components.push({
            name: statement.identifier.value,
            node: statement,
          });
        } else if (t.isVariableDeclaration(statement)) {
          for (const decl of statement.declarations) {
            if (
              t.isIdentifier(decl.id) &&
              (decl.init?.type === 'ArrowFunctionExpression' ||
                decl.init?.type === 'FunctionExpression')
            ) {
              components.push({ name: decl.id.value, node: decl.init });
            }
          }
        }
      }

      const appliedStyleProps = new Set<string>();
      const markStylePropApplied = (name: string, at: HasSpan) => {
        const owner = components.find(
          (c) =>
            at.span.start >= c.node.span.start &&
            at.span.start <= c.node.span.end,
        );
        if (owner) {
          appliedStyleProps.add(`${owner.name}:${name}`);
        }
      };

      const extractedSheets: string[] = [];
      const addSheet = (sheet: string) => {
        if (!extractedSheets.includes(sheet)) {
          extractedSheets.push(sheet);
        }
      };

      const processStyleRecords = (
        style: CSSObject,
        weights?: Record<string, number>,
      ) => {
        const records = getStyleRecords(style as CSSProperties, weights);
        extractOndemandStyles(style, extractedSheets, scannedTables);
        records.forEach((r: StyleRecord) => {
          addSheet(r.sheet);
        });
        return records;
      };

      const resourcePath = id;
      const localConsts = collectLocalConsts(ast);
      const importMap: Record<string, any> = {};
      const keyframesImportMap: KeyframesHashTable = {};
      const viewTransitionImportMap: ViewTransitionHashTable = {};
      const createImportMap: CreateHashTable = {};
      const createFunctionImportMap: Record<string, StyleFunctions> = {};
      const variantsImportMap: VariantsHashTable = {};
      const createThemeImportMap: Record<string, any> = {};
      const createStaticImportMap: Record<string, any> = {};
      const plumeriaAliases: Record<string, string> = {};
      const localImports: Record<
        string,
        { actualPath: string; importedName: string }
      > = {};

      traverse(ast, {
        ImportDeclaration({ node }: { node: ImportDeclaration }) {
          const sourcePath = node.source.value;

          if (sourcePath === '@plumeria/core') {
            node.specifiers.forEach((specifier) => {
              if (specifier.type === 'ImportNamespaceSpecifier') {
                plumeriaAliases[specifier.local.value] = 'NAMESPACE';
              } else if (specifier.type === 'ImportDefaultSpecifier') {
                plumeriaAliases[specifier.local.value] = 'NAMESPACE';
              } else if (specifier.type === 'ImportSpecifier') {
                const importedName = specifier.imported
                  ? specifier.imported.value
                  : specifier.local.value;
                plumeriaAliases[specifier.local.value] = importedName;
              }
            });
          }

          const actualPath = resolveImportPath(sourcePath, resourcePath);

          if (actualPath) {
            node.specifiers.forEach((specifier: ImportSpecifier) => {
              if (specifier.type === 'ImportNamespaceSpecifier') {
                // `import * as Icons` carries no export name of its own;
                // `<Icons.Foo />` resolves from the module it points at.
                localImports[specifier.local.value] = {
                  actualPath,
                  importedName: '*',
                };
                return;
              }
              if (
                specifier.type === 'ImportSpecifier' ||
                specifier.type === 'ImportDefaultSpecifier'
              ) {
                const importedName =
                  specifier.type === 'ImportDefaultSpecifier'
                    ? 'default'
                    : specifier.imported
                      ? specifier.imported.value
                      : specifier.local.value;
                const localName = specifier.local.value;
                let resolvedKey = `${actualPath}-${importedName}`;
                const resolved = resolveExport(actualPath, importedName);
                if (resolved) {
                  resolvedKey = `${resolved.filePath}-${resolved.localName}`;
                }
                const uniqueKey = resolvedKey;
                localImports[localName] = { actualPath, importedName };

                if (scannedTables.staticTable[uniqueKey]) {
                  importMap[localName] = scannedTables.staticTable[uniqueKey];
                }
                if (scannedTables.keyframesHashTable[uniqueKey]) {
                  keyframesImportMap[localName] =
                    scannedTables.keyframesHashTable[uniqueKey];
                }
                if (scannedTables.viewTransitionHashTable[uniqueKey]) {
                  viewTransitionImportMap[localName] =
                    scannedTables.viewTransitionHashTable[uniqueKey];
                }
                if (scannedTables.createHashTable[uniqueKey]) {
                  createImportMap[localName] =
                    scannedTables.createHashTable[uniqueKey];
                }
                if (scannedTables.createFunctionTable[uniqueKey]) {
                  createFunctionImportMap[localName] = styleFunctionsOf(
                    scannedTables.createFunctionTable[uniqueKey],
                  );
                }
                if (scannedTables.variantsHashTable[uniqueKey]) {
                  variantsImportMap[localName] =
                    scannedTables.variantsHashTable[uniqueKey];
                }
                if (scannedTables.createThemeHashTable[uniqueKey]) {
                  createThemeImportMap[localName] =
                    scannedTables.createThemeHashTable[uniqueKey];
                }
                if (scannedTables.createStaticHashTable[uniqueKey]) {
                  createStaticImportMap[localName] =
                    scannedTables.createStaticHashTable[uniqueKey];
                }
              }
            });
          }
        },
      });

      const mergedStaticTable: StaticTable = {};
      for (const key of Object.keys(scannedTables.staticTable)) {
        mergedStaticTable[key] = scannedTables.staticTable[key];
      }
      for (const key of Object.keys(localConsts)) {
        mergedStaticTable[key] = localConsts[key];
      }
      for (const key of Object.keys(importMap)) {
        mergedStaticTable[key] = importMap[key];
      }

      const mergedKeyframesTable: KeyframesHashTable = {};
      for (const key of Object.keys(scannedTables.keyframesHashTable)) {
        mergedKeyframesTable[key] = scannedTables.keyframesHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedKeyframesTable[varName] = scannedTables.keyframesHashTable[key];
        }
      }
      for (const key of Object.keys(keyframesImportMap)) {
        mergedKeyframesTable[key] = keyframesImportMap[key];
      }

      const mergedViewTransitionTable: ViewTransitionHashTable = {};
      for (const key of Object.keys(scannedTables.viewTransitionHashTable)) {
        mergedViewTransitionTable[key] =
          scannedTables.viewTransitionHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedViewTransitionTable[varName] =
            scannedTables.viewTransitionHashTable[key];
        }
      }
      for (const key of Object.keys(viewTransitionImportMap)) {
        mergedViewTransitionTable[key] = viewTransitionImportMap[key];
      }

      const mergedCreateTable: CreateHashTable = {};
      for (const key of Object.keys(scannedTables.createHashTable)) {
        mergedCreateTable[key] = scannedTables.createHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedCreateTable[varName] = scannedTables.createHashTable[key];
        }
      }
      for (const key of Object.keys(createImportMap)) {
        mergedCreateTable[key] = createImportMap[key];
      }

      const mergedVariantsTable: VariantsHashTable = {};
      for (const key of Object.keys(scannedTables.variantsHashTable)) {
        mergedVariantsTable[key] = scannedTables.variantsHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedVariantsTable[varName] = scannedTables.variantsHashTable[key];
        }
      }
      for (const key of Object.keys(variantsImportMap)) {
        mergedVariantsTable[key] = variantsImportMap[key];
      }

      const mergedCreateThemeHashTable: CreateThemeHashTable = {};
      for (const key of Object.keys(scannedTables.createThemeHashTable)) {
        mergedCreateThemeHashTable[key] =
          scannedTables.createThemeHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedCreateThemeHashTable[varName] =
            scannedTables.createThemeHashTable[key];
        }
      }
      for (const key of Object.keys(createThemeImportMap)) {
        mergedCreateThemeHashTable[key] = createThemeImportMap[key];
      }

      const mergedCreateStaticHashTable: CreateStaticHashTable = {};
      for (const key of Object.keys(scannedTables.createStaticHashTable)) {
        mergedCreateStaticHashTable[key] =
          scannedTables.createStaticHashTable[key];
        if (key.startsWith(`${resourcePath}-`)) {
          const varName = key.slice(resourcePath.length + 1);
          mergedCreateStaticHashTable[varName] =
            scannedTables.createStaticHashTable[key];
        }
      }
      for (const key of Object.keys(createStaticImportMap)) {
        mergedCreateStaticHashTable[key] = createStaticImportMap[key];
      }

      const localCreateStyles: Record<string, CreateStyleValue> = {};
      const localStyleAliases: Record<string, Expression> = {};

      const checkStyleAliasAssignment = (decl: VariableDeclarator) => {
        if (!t.isIdentifier(decl.id) || !decl.init) return;
        const init = decl.init;
        if (t.isMemberExpression(init) && t.isIdentifier(init.object)) {
          const objName = init.object.value;
          if (
            localCreateStyles[objName] !== undefined ||
            mergedCreateTable[objName] !== undefined
          ) {
            localStyleAliases[decl.id.value] = init;
          }
        }
      };

      const replacements: Array<{
        start: number;
        end: number;
        content: string;
      }> = [];

      const dynamicFnCalls: CallExpression[] = [];
      const processedDecls = new Set<VariableDeclaration>();
      const idSpans = new Set<number>();
      const excludedSpans = new Set<number>();
      const referenceIdents = collectReferenceIdentifiers(ast);

      const registerStyle = (
        node: VariableDeclarator,
        declSpan: { start: number; end: number },
        isExported: boolean,
      ) => {
        let propName: string | undefined;
        const init = node.init;
        if (
          t.isIdentifier(node.id) &&
          init &&
          t.isCallExpression(init) &&
          init.arguments.length >= 1
        ) {
          const callee = init.callee;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];

            if (alias === 'NAMESPACE') {
              propName = propertyName;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName) {
              propName = originalName;
            }
          }
        }

        if (propName && init && t.isCallExpression(init)) {
          if (
            propName === 'create' &&
            t.isObjectExpression(init.arguments[0].expression)
          ) {
            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
            );

            if (obj) {
              const hashMap: Record<string, Record<string, string>> = {};
              Object.entries(obj).forEach(([key, style]) => {
                if (typeof style !== 'object' || style === null) return;
                const records = getStyleRecords(style as CSSProperties);
                const atomMap: Record<string, string> = {};
                records.forEach((r) => (atomMap[r.key] = r.hash));
                hashMap[key] = atomMap;
              });

              const styleFunctions = styleFunctionsOf(
                init.arguments[0].expression as ObjectExpression,
              );

              if (t.isIdentifier(node.id)) {
                idSpans.add(node.id.span.start);
              }

              if (t.isIdentifier(node.id)) {
                localCreateStyles[node.id.value] = {
                  name: node.id.value,
                  type: 'create',
                  obj,
                  hashMap,
                  isExported,
                  initSpan: {
                    start: init.span.start - baseByteOffset,
                    end: init.span.end - baseByteOffset,
                  },
                  declSpan: {
                    start: declSpan.start - baseByteOffset,
                    end: declSpan.end - baseByteOffset,
                  },
                  functions: styleFunctions,
                };
              }
            }
          } else if (
            propName === 'createTheme' &&
            init.arguments.length >= 2 &&
            t.isObjectExpression(init.arguments[1].expression)
          ) {
            if (t.isIdentifier(node.id)) {
              idSpans.add(node.id.span.start);
            }

            let selector = '';
            const selectorExpr = init.arguments[0].expression;
            if (t.isStringLiteral(selectorExpr)) {
              selector = selectorExpr.value;
            }

            if (selector.startsWith('@') && !isAtRule(selector)) {
              throwCompilationError(
                `Plumeria: Unsupported at-rule: "${selector}". createTheme only supports nesting at-rules such as @media, @container, @supports, @layer, and @scope.`,
                selectorExpr as HasSpan,
              );
            }

            const obj = objectExpressionToObject(
              init.arguments[1].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
            );

            const hash = genBase36Hash(
              { _themeSelector: selector, ...obj },
              1,
              8,
            );
            if (t.isIdentifier(node.id)) {
              const uniqueKey = `${resourcePath}-${node.id.value}`;

              scannedTables.createThemeHashTable[uniqueKey] = hash;
              scannedTables.createThemeObjectTable[hash] = obj;
              if (scannedTables.createThemeSelectorTable) {
                scannedTables.createThemeSelectorTable[hash] = selector;
              }

              mergedCreateThemeHashTable[node.id.value] = hash;

              const themeHashMap: Record<string, any> = {};
              for (const [key, value] of Object.entries(obj)) {
                const cssVarName = camelToKebabCase(key);
                const atomicHash = genBase36Hash({ [key]: value }, 1, 8);
                themeHashMap[key] = `var(--${atomicHash}-${cssVarName})`;
              }

              localCreateStyles[node.id.value] = {
                name: node.id.value,
                type: 'constant',
                obj,
                hashMap: themeHashMap,
                isExported,
                initSpan: {
                  start: init.span.start - baseByteOffset,
                  end: init.span.end - baseByteOffset,
                },
                declSpan: {
                  start: declSpan.start - baseByteOffset,
                  end: declSpan.end - baseByteOffset,
                },
              };
            }
          } else if (
            propName === 'createStatic' &&
            t.isObjectExpression(init.arguments[0].expression)
          ) {
            if (t.isIdentifier(node.id)) {
              idSpans.add(node.id.span.start);
            }
            const obj = objectExpressionToObject(
              init.arguments[0].expression as ObjectExpression,
              mergedStaticTable,
              mergedKeyframesTable,
              mergedViewTransitionTable,
              mergedCreateThemeHashTable,
              scannedTables.createThemeObjectTable,
              mergedCreateTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
              mergedVariantsTable,
            );
            const hash = genBase36Hash(obj, 1, 8);
            if (t.isIdentifier(node.id)) {
              const uniqueKey = `${resourcePath}-${node.id.value}`;

              scannedTables.createStaticHashTable[uniqueKey] = hash;
              scannedTables.createStaticObjectTable[hash] = obj;
              mergedCreateStaticHashTable[node.id.value] = hash;

              localCreateStyles[node.id.value] = {
                name: node.id.value,
                type: 'constant',
                obj,
                hashMap: obj,
                isExported,
                initSpan: {
                  start: init.span.start - baseByteOffset,
                  end: init.span.end - baseByteOffset,
                },
                declSpan: {
                  start: declSpan.start - baseByteOffset,
                  end: declSpan.end - baseByteOffset,
                },
              };
            }
          }
        }
      };

      traverse(ast, {
        ImportDeclaration({ node }: { node: ImportDeclaration }) {
          if (node.source.value === '@plumeria/core') {
            if (node.typeOnly) return;

            const typeOnlySpecs = node.specifiers.filter(
              (s) => s.type === 'ImportSpecifier' && s.isTypeOnly,
            );

            if (typeOnlySpecs.length > 0) {
              const names = typeOnlySpecs

                .map((s) => {
                  if (s.type !== 'ImportSpecifier') return;
                  const imported = s.imported
                    ? s.imported.value
                    : s.local.value;
                  const local = s.local.value;
                  return imported === local
                    ? imported
                    : `${imported} as ${local}`;
                })
                .join(', ');

              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: `import type { ${names} } from '@plumeria/core'`,
              });
            } else {
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: '',
              });
            }
          }
          node.specifiers.forEach((specifier) => {
            if (specifier.local) {
              excludedSpans.add(specifier.local.span.start);
            }
            if (specifier.type === 'ImportSpecifier' && specifier.imported) {
              excludedSpans.add(specifier.imported.span.start);
            }
          });
        },
        ExportDeclaration({ node }: { node: ExportDeclaration }) {
          if (t.isVariableDeclaration(node.declaration)) {
            processedDecls.add(node.declaration);
            node.declaration.declarations.forEach((decl) => {
              registerStyle(decl, node.span, true);
              checkStyleAliasAssignment(decl);
            });
          }
        },
        VariableDeclaration({ node }: { node: VariableDeclaration }) {
          if (processedDecls.has(node)) return;
          node.declarations.forEach((decl) => {
            registerStyle(decl, node.span, false);
            checkStyleAliasAssignment(decl);
          });
        },

        CallExpression({ node }: { node: CallExpression }) {
          const callee = node.callee;
          let propName: string | undefined;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            const alias = plumeriaAliases[objectName];

            if (alias === 'NAMESPACE') {
              propName = propertyName;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName) {
              propName = originalName;
            }
          }

          if (propName) {
            const args = node.arguments;

            if (propName === 'keyframes') {
              const expr = args[0].expression;
              if (t.isObjectExpression(expr)) {
                const obj = objectExpressionToObject(
                  expr,
                  mergedStaticTable,
                  mergedKeyframesTable,
                  mergedViewTransitionTable,
                  mergedCreateThemeHashTable,
                  scannedTables.createThemeObjectTable,
                  mergedCreateTable,
                  mergedCreateStaticHashTable,
                  scannedTables.createStaticObjectTable,
                  mergedVariantsTable,
                );
                const hash = genBase36Hash(obj, 1, 8);
                scannedTables.keyframesObjectTable[hash] = obj;
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: JSON.stringify(`kf-${hash}`),
                });
              }
            } else if (
              propName === 'viewTransition' &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.viewTransitionObjectTable[hash] = obj;
              replacements.push({
                start: node.span.start - baseByteOffset,
                end: node.span.end - baseByteOffset,
                content: JSON.stringify(`vt-${hash}`),
              });
            } else if (
              propName === 'createTheme' &&
              args.length >= 2 &&
              t.isObjectExpression(args[1].expression)
            ) {
              let selector = '';
              const selectorExpr = args[0].expression;
              if (t.isStringLiteral(selectorExpr)) {
                selector = selectorExpr.value;
              }

              if (selector.startsWith('@') && !isAtRule(selector)) {
                throwCompilationError(
                  `Plumeria: Unsupported at-rule: "${selector}". createTheme only supports nesting at-rules such as @media, @container, @supports, @layer, and @scope.`,
                  selectorExpr as HasSpan,
                );
              }
              const obj = objectExpressionToObject(
                args[1].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(
                { _themeSelector: selector, ...obj },
                1,
                8,
              );
              scannedTables.createThemeObjectTable[hash] = obj;
              if (scannedTables.createThemeSelectorTable) {
                scannedTables.createThemeSelectorTable[hash] = selector;
              }
            } else if (
              propName === 'createStatic' &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.createStaticObjectTable[hash] = obj;
            } else if (
              propName === 'create' &&
              args.length > 0 &&
              t.isObjectExpression(args[0].expression)
            ) {
              const obj = objectExpressionToObject(
                args[0].expression as ObjectExpression,
                mergedStaticTable,
                mergedKeyframesTable,
                mergedViewTransitionTable,
                mergedCreateThemeHashTable,
                scannedTables.createThemeObjectTable,
                mergedCreateTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
                mergedVariantsTable,
              );
              const hash = genBase36Hash(obj, 1, 8);
              scannedTables.createObjectTable[hash] = obj;
            }
          }
        },
      });

      const jsxOpeningElementMap = new Map<
        number,
        { compKey: string | null; attributes: JSXAttributeOrSpread[] }
      >();

      const componentParamNames = new Set<string>();
      for (const node of ast.body) {
        let declarations: VariableDeclarator[] = [];
        if (t.isVariableDeclaration(node)) {
          declarations = node.declarations;
        } else if (
          t.isExportDeclaration(node) &&
          t.isVariableDeclaration(node.declaration)
        ) {
          declarations = node.declaration.declarations;
        }
        for (const decl of declarations) {
          if (!t.isIdentifier(decl.id) || !decl.init) continue;
          const init = decl.init;
          if (
            init.type !== 'ArrowFunctionExpression' &&
            init.type !== 'FunctionExpression'
          )
            continue;
          if (init.params.length > 0) {
            const p = init.params[0];
            if (t.isIdentifier(p)) {
              componentParamNames.add(p.value);
            } else if ((p as any).pat && t.isIdentifier((p as any).pat)) {
              componentParamNames.add((p as any).pat.value);
            }
          }
        }
      }

      const excludeSubtreeSpans = (n: any) => {
        if (!n || typeof n !== 'object') return;
        if (n.span) {
          excludedSpans.add(n.span.start);
        }
        Object.values(n).forEach((val) => excludeSubtreeSpans(val));
      };

      const getSource = (node: Expression): string => {
        const start = (node as HasSpan).span.start - baseByteOffset;
        const end = (node as HasSpan).span.end - baseByteOffset;
        return sourceBuffer.subarray(start, end).toString('utf-8');
      };

      const resolveStyleObject = (expr: Expression): CSSObject | null => {
        if (t.isObjectExpression(expr)) {
          return objectExpressionToObject(
            expr,
            mergedStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedCreateThemeHashTable,
            scannedTables.createThemeObjectTable,
            mergedCreateTable,
            mergedCreateStaticHashTable,
            scannedTables.createStaticObjectTable,
            mergedVariantsTable,
          );
        } else if (
          t.isMemberExpression(expr) &&
          t.isIdentifier(expr.object) &&
          (t.isIdentifier(expr.property) || expr.property.type === 'Computed')
        ) {
          const varName = (expr.object as Identifier).value;
          let propName: string;
          if (expr.property.type === 'Computed') {
            const keyExpr = expr.property.expression;
            if (!t.isStringLiteral(keyExpr)) return null;
            propName = keyExpr.value;
          } else {
            propName = (expr.property as Identifier).value;
          }
          const styleInfo = localCreateStyles[varName];
          if (styleInfo?.obj[propName]) {
            const style = styleInfo.obj[propName];
            if (typeof style === 'object' && style !== null)
              return style as CSSObject;
          }
          const hash = mergedCreateTable[varName];
          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            if (obj?.[propName] && typeof obj[propName] === 'object')
              return obj[propName] as CSSObject;
          }
        } else if (t.isIdentifier(expr)) {
          const varName = (expr as Identifier).value;
          const uniqueKey = `${resourcePath}-${varName}`;
          let hash = scannedTables.createHashTable[uniqueKey];
          if (!hash) hash = mergedCreateTable[varName];
          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            if (obj && typeof obj === 'object') return obj;
          }
          const styleInfo = localCreateStyles[varName];
          if (styleInfo?.obj) return styleInfo.obj;
          const vHash = mergedVariantsTable[varName];
          if (vHash) return scannedTables.variantsObjectTable[vHash];
        }
        return null;
      };

      const resolveDynamicCall = (
        expr: Expression,
      ): { style: CSSObject; vars: DynamicVar[] } | null => {
        if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
          return null;
        const callee = expr.callee;
        if (!t.isIdentifier(callee.object) || !t.isIdentifier(callee.property))
          return null;

        const styleInfo = localCreateStyles[callee.object.value];
        const func =
          styleInfo?.functions?.[callee.property.value] ??
          createFunctionImportMap[callee.object.value]?.[callee.property.value];
        if (!func) return null;

        const callArgs = (expr as CallExpression).arguments;
        if (callArgs.some((a) => a.spread) || callArgs.length === 0)
          return null;

        const tempStaticTable = { ...mergedStaticTable };
        const runtime: Array<{ param: string; source: Expression }> = [];

        const resolveObjectArg = (argExpr: ObjectExpression) =>
          objectExpressionToObject(
            argExpr,
            mergedStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedCreateThemeHashTable,
            scannedTables.createThemeObjectTable,
            mergedCreateTable,
            mergedCreateStaticHashTable,
            scannedTables.createStaticObjectTable,
            mergedVariantsTable,
          );

        if (func.named) {
          const argExpr = callArgs[0].expression;
          if (callArgs.length !== 1 || argExpr.type !== 'ObjectExpression') {
            throwCompilationError(
              `Plumeria: ${getSource(expr)} takes one object argument, because ${
                callee.property.value
              } destructures its parameter.`,
              expr as HasSpan,
            );
          }
          const given = new Map<string, Expression>();
          (argExpr as ObjectExpression).properties.forEach((prop) => {
            if (prop.type === 'Identifier') {
              given.set(prop.value, prop);
            } else if (
              prop.type === 'KeyValueProperty' &&
              (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
              given.set(String(prop.key.value), prop.value);
            }
          });

          const argObj = resolveObjectArg(argExpr as ObjectExpression) ?? {};
          func.named.forEach(({ key, local }) => {
            const source = given.get(key);
            if (!source) {
              throwCompilationError(
                `Plumeria: ${getSource(expr)} leaves "${key}" unset, and a dynamic style function has no value to fall back on.`,
                expr as HasSpan,
              );
              return;
            }
            if (isStaticArgValue(source) && argObj[key] !== undefined)
              tempStaticTable[local] = argObj[key];
            else runtime.push({ param: local, source });
          });
        } else if (
          callArgs.length === 1 &&
          callArgs[0].expression.type === 'ObjectExpression'
        ) {
          const argObj =
            resolveObjectArg(callArgs[0].expression as ObjectExpression) ?? {};
          func.params.forEach((p) => {
            if (argObj[p] !== undefined) tempStaticTable[p] = argObj[p];
          });
        } else {
          callArgs.forEach((callArg, i) => {
            const p = func.params[i];
            if (!p) return;
            runtime.push({ param: p, source: callArg.expression });
          });
        }

        const cssVars: Record<string, string> = {};
        if (runtime.length > 0) {
          runtime.forEach(({ param }) => (tempStaticTable[param] = param));

          const probe = objectExpressionToObject(
            func.body,
            tempStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedCreateThemeHashTable,
            scannedTables.createThemeObjectTable,
            mergedCreateTable,
            mergedCreateStaticHashTable,
            scannedTables.createStaticObjectTable,
            mergedVariantsTable,
          );
          const hash = genBase36Hash(probe ?? {}, 1, 8);

          runtime.forEach(({ param }) => {
            const cssVar = `--${hash}-${param}`;
            tempStaticTable[param] = `var(${cssVar})`;
            cssVars[param] = cssVar;
          });
        }

        const style = objectExpressionToObject(
          func.body,
          tempStaticTable,
          mergedKeyframesTable,
          mergedViewTransitionTable,
          mergedCreateThemeHashTable,
          scannedTables.createThemeObjectTable,
          mergedCreateTable,
          mergedCreateStaticHashTable,
          scannedTables.createStaticObjectTable,
          mergedVariantsTable,
        );
        if (!style) return null;

        const vars: DynamicVar[] = [];
        runtime.forEach(({ param, source }) => {
          const cssVar = cssVars[param];
          const targetProp = cssVar ? findVarProp(style, cssVar) : undefined;
          if (!targetProp) return;

          const argStart = (source as HasSpan).span.start - baseByteOffset;
          const argEnd = (source as HasSpan).span.end - baseByteOffset;
          const argSource = sourceBuffer
            .subarray(argStart, argEnd)
            .toString('utf-8');

          let valueExpr: string;
          const kebabProp = camelToKebabCase(targetProp);
          const isUnitless =
            exceptionCamelCase.includes(targetProp) ||
            targetProp.startsWith('--');
          const maybeNumber = Number(argSource);
          if (!isNaN(maybeNumber) && argSource.trim() === String(maybeNumber)) {
            valueExpr = JSON.stringify(applyCssValue(maybeNumber, kebabProp));
          } else if (
            (argSource.startsWith('"') && argSource.endsWith('"')) ||
            (argSource.startsWith("'") && argSource.endsWith("'"))
          ) {
            valueExpr = JSON.stringify(
              applyCssValue(argSource.slice(1, -1), kebabProp),
            );
          } else {
            valueExpr = isUnitless
              ? argSource
              : `(typeof (${argSource}) === 'number' ? (${argSource}) + 'px' : (${argSource}))`;
          }
          vars.push({ cssVar, valueExpr });
        });

        return { style, vars };
      };

      const buildClassParts = (
        args: Array<{ expression: Expression; order?: number }>,
        dynamicClassParts: string[] = [],
        existingClass: string = '',
        isStyleProp: boolean = false,
      ): {
        classParts: string[];
        isOptimizable: boolean;
        baseStyle: CSSObject;
        dynamicVars: DynamicVar[];
      } => {
        args.forEach((arg) => {
          const expr = arg.expression;
          if (t.isIdentifier(expr) && localStyleAliases[expr.value]) {
            arg.expression = localStyleAliases[expr.value];
          }
        });

        const conditionals: StyleConditional[] = [];
        const dynamicVars: DynamicVar[] = [];
        let groupIdCounter = 0;
        // Every source of this styling prop gets a slot, in the order it was
        // written, so the conflict table can merge them the way the author
        // stacked them.
        let sourceOrder = 0;
        const baseChunks: Array<{ order: number; style: CSSObject }> = [];
        let baseStyle: CSSObject = {};
        let isOptimizable = true;

        const resolveCreateObject = (varName: string): CSSObject | null => {
          const localStyle = localCreateStyles[varName];
          if (localStyle?.type === 'create') return localStyle.obj;

          let hash =
            scannedTables.createHashTable[`${resourcePath}-${varName}`];
          if (!hash) hash = mergedCreateTable[varName];
          if (hash && scannedTables.createObjectTable[hash])
            return scannedTables.createObjectTable[hash];

          return null;
        };

        // `s[k]` with a non-literal key: a set of alternatives selected by one
        // runtime expression.
        const resolveBracketGroup = (
          node: Expression,
        ): { varName: string; keyExpr: Expression; obj: CSSObject } | null => {
          if (
            !t.isMemberExpression(node) ||
            !t.isIdentifier(node.object) ||
            node.property.type !== 'Computed' ||
            // A literal key names one style, not the whole set.
            t.isStringLiteral(node.property.expression)
          ) {
            return null;
          }
          const varName = (node.object as Identifier).value;
          const obj = resolveCreateObject(varName);
          return obj
            ? { varName, keyExpr: node.property.expression, obj }
            : null;
        };

        interface Decision {
          keyExpr: string;
          options: Array<{ value: string; style: CSSObject }>;
          leaves: number;
          hasGroup: boolean;
        }

        // One argument is one decision tree, and its branches are mutually
        // exclusive: only ever one of them applies. So they belong in a single
        // lookup keyed by which branch won -- not one dimension each, which
        // would enumerate combinations that can never occur.
        //
        // `prefix` names the branches that resolve to a fixed style; `off` is
        // the key a false `&&` yields, which no branch claims so the result
        // falls through to the surrounding styles.
        const buildDecision = (
          node: Expression,
          prefix: string,
          off: string,
          counter: { n: number },
          scoped: boolean,
        ): Decision | null => {
          if (node.type === 'ParenthesisExpression') {
            return buildDecision(node.expression, prefix, off, counter, scoped);
          }
          if (node.type === 'ConditionalExpression') {
            const a = buildDecision(
              node.consequent,
              prefix,
              off,
              counter,
              scoped,
            );
            if (!a) return null;
            const b = buildDecision(
              node.alternate,
              prefix,
              off,
              counter,
              scoped,
            );
            if (!b) return null;
            return {
              keyExpr: `((${getSource(node.test)}) ? ${a.keyExpr} : ${b.keyExpr})`,
              options: [...a.options, ...b.options],
              leaves: a.leaves + b.leaves,
              hasGroup: a.hasGroup || b.hasGroup,
            };
          }
          if (node.type === 'BinaryExpression' && node.operator === '&&') {
            const right = buildDecision(
              node.right,
              prefix,
              off,
              counter,
              scoped,
            );
            if (!right) return null;
            return {
              keyExpr: `((${getSource(node.left)}) ? ${right.keyExpr} : ${JSON.stringify(off)})`,
              options: right.options,
              leaves: right.leaves,
              hasGroup: right.hasGroup,
            };
          }
          const group = resolveBracketGroup(node);
          if (group) {
            const tag = scoped ? `${counter.n++}:` : '';
            const keySource = getSource(group.keyExpr);
            return {
              keyExpr: tag
                ? `(${JSON.stringify(tag)} + ${keySource})`
                : keySource,
              options: Object.entries(group.obj).map(([value, style]) => ({
                value: `${tag}${value}`,
                style: style as CSSObject,
              })),
              leaves: 1,
              hasGroup: true,
            };
          }
          const style = resolveStyleObject(node);
          if (!style) return null;
          const value = `${prefix}${counter.n++}`;
          return {
            keyExpr: JSON.stringify(value),
            options: [{ value, style }],
            leaves: 1,
            hasGroup: false,
          };
        };

        const collectGroupKeys = (
          node: Expression,
          acc: Map<string, Set<unknown>>,
        ) => {
          if (node.type === 'ParenthesisExpression') {
            collectGroupKeys(node.expression, acc);
          } else if (node.type === 'ConditionalExpression') {
            collectGroupKeys(node.consequent, acc);
            collectGroupKeys(node.alternate, acc);
          } else if (
            node.type === 'BinaryExpression' &&
            node.operator === '&&'
          ) {
            collectGroupKeys(node.right, acc);
          } else {
            const group = resolveBracketGroup(node);
            if (group)
              Object.entries(group.obj).forEach(([key, style]) => {
                let styles = acc.get(key);
                if (!styles) acc.set(key, (styles = new Set()));
                styles.add(style);
              });
          }
        };

        const resolveDecision = (node: Expression): Decision | null => {
          // Branch names share the lookup with the groups' own keys, so pick a
          // prefix no key starts with and they can never be confused.
          const groupKeys = new Map<string, Set<unknown>>();
          collectGroupKeys(node, groupKeys);
          let prefix = '#';
          while ([...groupKeys.keys()].some((k) => k.startsWith(prefix)))
            prefix += '#';
          const scoped = [...groupKeys.values()].some(
            (styles) => styles.size > 1,
          );
          const off = !scoped && groupKeys.has('') ? `${prefix}off` : '';
          return buildDecision(node, prefix, off, { n: 0 }, scoped);
        };

        const collectConditions = (
          node: Expression,
          currentTestStrings: string[] = [],
          argOrder?: number,
        ): boolean => {
          let branchStyle = resolveStyleObject(node);
          if (!branchStyle) {
            const dynamic = resolveDynamicCall(node);
            if (dynamic) {
              if (!isStyleProp) {
                throwCompilationError(
                  `Plumeria: css.use(${getSource(
                    node,
                  )}) does not support dynamic function keys.`,
                  node as HasSpan,
                );
              }
              branchStyle = dynamic.style;
              dynamic.vars.forEach((v) =>
                dynamicVars.push({
                  ...v,
                  test: currentTestStrings.length
                    ? currentTestStrings.join(' && ')
                    : undefined,
                  order: argOrder,
                }),
              );
            }
          }
          if (branchStyle) {
            const staticStyle = branchStyle;
            if (currentTestStrings.length === 0) {
              baseStyle = deepMerge(baseStyle, staticStyle);
              baseChunks.push({ order: sourceOrder++, style: staticStyle });
            } else {
              conditionals.push({
                test: node,
                testString: currentTestStrings.join(' && '),
                truthy: staticStyle,
                falsy: {},
                varName: undefined,
                order: sourceOrder++,
              });
            }
            return true;
          }
          if (node.type === 'ConditionalExpression') {
            const testSource = getSource(node.test);
            if (currentTestStrings.length === 0) {
              const trueStyle = resolveStyleObject(node.consequent);
              const falseStyle = resolveStyleObject(node.alternate);
              if (trueStyle && falseStyle) {
                conditionals.push({
                  test: node,
                  testString: testSource,
                  truthy: trueStyle,
                  falsy: falseStyle,
                  varName: undefined,
                  order: sourceOrder++,
                });
                return true;
              }
            }
            collectConditions(
              node.consequent,
              [...currentTestStrings, `(${testSource})`],
              argOrder,
            );
            collectConditions(
              node.alternate,
              [...currentTestStrings, `!(${testSource})`],
              argOrder,
            );
            return true;
          } else if (
            node.type === 'BinaryExpression' &&
            node.operator === '&&'
          ) {
            collectConditions(
              node.right,
              [...currentTestStrings, `(${getSource(node.left)})`],
              argOrder,
            );
            return true;
          } else if (node.type === 'ParenthesisExpression') {
            return collectConditions(
              node.expression,
              currentTestStrings,
              argOrder,
            );
          }

          if (pushPropPossibilities(node, currentTestStrings)) return true;

          assertResolvable(node as HasSpan);
          return false;
        };

        const pushPropPossibilities = (
          expr: Expression,
          gates: string[],
        ): boolean => {
          const isParamMember =
            t.isMemberExpression(expr) &&
            t.isIdentifier(expr.object) &&
            componentParamNames.has(expr.object.value) &&
            t.isIdentifier(expr.property);
          if (!t.isIdentifier(expr) && !isParamMember) return false;

          const varName = t.isIdentifier(expr)
            ? expr.value
            : ((expr as MemberExpression).property as Identifier).value;
          const source = t.isIdentifier(expr) ? varName : getSource(expr);
          markStylePropApplied(varName, expr as HasSpan);

          let possibilities: any[] | undefined;
          for (const key of Object.keys(
            scannedTables.componentPropsTable || {},
          )) {
            if (!key.startsWith(`${resourcePath}-`)) continue;
            if (scannedTables.componentPropsTable?.[key]?.[varName]) {
              possibilities = scannedTables.componentPropsTable[key][varName];
              break;
            }
          }
          if (!possibilities || possibilities.length === 0) return false;

          const testLHS = gates.length
            ? `((${gates.join(' && ')}) ? ${source} : "")`
            : source;
          const currentGroupId = ++groupIdCounter;
          const currentOrder = sourceOrder++;

          const seen = new Set<string>();
          const pushOption = (valueName: string, style: CSSObject) => {
            conditionals.push({
              test: expr,
              testLHS,
              testString: `${testLHS} === ${JSON.stringify(valueName)}`,
              truthy: style,
              falsy: {},
              groupId: currentGroupId,
              order: currentOrder,
              groupName: undefined,
              valueName,
              varName,
            });
          };
          possibilities.forEach((entry) => {
            if (seen.has(entry.key)) return;
            seen.add(entry.key);
            pushOption(entry.key, entry.styleObj as CSSObject);
          });
          if (gates.length) pushOption('', {});
          return true;
        };

        for (const arg of args) {
          const expr = arg.expression;

          if (pushPropPossibilities(expr, [])) continue;

          if (t.isCallExpression(expr) && t.isIdentifier(expr.callee)) {
            const varName = expr.callee.value;
            const uniqueKey = `${resourcePath}-${varName}`;
            let variantObj: CSSObject | undefined;

            let hash = scannedTables.variantsHashTable[uniqueKey];
            if (!hash) hash = mergedVariantsTable[varName];
            if (hash && scannedTables.variantsObjectTable[hash])
              variantObj = scannedTables.variantsObjectTable[hash];
            if (!variantObj && localCreateStyles[varName]?.obj)
              variantObj = localCreateStyles[varName].obj;

            if (variantObj) {
              const callArgs = expr.arguments;
              const hasSpread = callArgs.some((a) => {
                if (a.spread) return true;
                if (a.expression.type === 'ObjectExpression') {
                  return (a.expression as ObjectExpression).properties.some(
                    (p) => p.type === 'SpreadElement',
                  );
                }
                return false;
              });
              if (hasSpread) {
                throwCompilationError(
                  `Plumeria: Spread operator in ${getSource(expr)} is not supported. ` +
                    `Please pass specific variant options directly.`,
                  expr,
                );
              }
              if (callArgs.length !== 1) {
                throwCompilationError(
                  `Plumeria: Variant function "${varName}" expects exactly 1 argument, found ${callArgs.length}.`,
                  expr,
                );
              }
              if (callArgs.length === 1 && !callArgs[0].spread) {
                const arg = callArgs[0].expression;
                if (arg.type === 'ObjectExpression') {
                  for (const prop of arg.properties) {
                    let groupName: string | undefined;
                    let valExpr: Expression | undefined;
                    if (
                      prop.type === 'KeyValueProperty' &&
                      prop.key.type === 'Identifier'
                    ) {
                      groupName = prop.key.value;
                      valExpr = prop.value;
                    } else if (prop.type === 'Identifier') {
                      groupName = prop.value;
                      valExpr = prop;
                    }
                    if (groupName && valExpr) {
                      const groupVariants = variantObj[groupName];
                      if (!groupVariants) continue;
                      const currentGroupId = ++groupIdCounter;
                      const currentOrder = sourceOrder++;
                      const valSource = getSource(valExpr);
                      if (valExpr.type === 'StringLiteral') {
                        const groupVariantsAsObj = groupVariants as CSSObject;
                        const picked = groupVariantsAsObj[
                          valExpr.value as string
                        ] as CSSObject | undefined;
                        if (picked) {
                          baseStyle = deepMerge(baseStyle, picked);
                          baseChunks.push({
                            order: sourceOrder++,
                            style: picked,
                          });
                        }
                        continue;
                      }
                      Object.entries(groupVariants as CSSObject).forEach(
                        ([optionName, style]) => {
                          conditionals.push({
                            test: valExpr,
                            testLHS: valSource,
                            testString: `${valSource} === '${optionName}'`,
                            truthy: style as CSSObject,
                            falsy: {},
                            groupId: currentGroupId,
                            order: currentOrder,
                            groupName,
                            valueName: optionName,
                            varName,
                          });
                        },
                      );
                    }
                  }
                  continue;
                }
                const argSource = getSource(arg);
                if (t.isStringLiteral(arg)) {
                  const picked = variantObj[arg.value as string] as
                    | CSSObject
                    | undefined;
                  if (picked) {
                    baseStyle = deepMerge(baseStyle, picked);
                    baseChunks.push({ order: sourceOrder++, style: picked });
                  }
                  continue;
                }
                const currentGroupId = ++groupIdCounter;
                const currentOrder = sourceOrder++;
                Object.entries(variantObj).forEach(([key, style]) => {
                  conditionals.push({
                    test: arg,
                    testLHS: argSource,
                    testString: `${argSource} === '${key}'`,
                    truthy: style as CSSObject,
                    falsy: {},
                    groupId: currentGroupId,
                    order: currentOrder,
                    groupName: undefined,
                    valueName: key,
                    varName,
                  });
                });
                continue;
              }
              isOptimizable = false;
              break;
            }
          } else if (t.isIdentifier(expr)) {
            const varName = expr.value;
            const uniqueKey = `${resourcePath}-${varName}`;
            let variantObj: CSSObject | undefined;

            let hash = scannedTables.variantsHashTable[uniqueKey];
            if (!hash) hash = mergedVariantsTable[varName];
            if (hash && scannedTables.variantsObjectTable[hash])
              variantObj = scannedTables.variantsObjectTable[hash];
            if (!variantObj && localCreateStyles[varName]?.obj)
              variantObj = localCreateStyles[varName].obj;

            if (variantObj) {
              Object.entries(variantObj).forEach(
                ([groupName, groupVariants]) => {
                  if (!groupVariants) return;
                  const currentGroupId = ++groupIdCounter;
                  const currentOrder = sourceOrder++;
                  Object.entries(groupVariants).forEach(
                    ([optionName, style]) => {
                      conditionals.push({
                        test: expr,
                        testLHS: `props["${groupName}"]`,
                        testString: `props["${groupName}"] === '${optionName}'`,
                        truthy: style as CSSObject,
                        falsy: {},
                        groupId: currentGroupId,
                        order: currentOrder,
                        groupName,
                        valueName: optionName,
                        varName,
                      });
                    },
                  );
                },
              );
              continue;
            }
          }

          if (
            t.isMemberExpression(expr) &&
            t.isIdentifier(expr.object) &&
            expr.property.type === 'Computed'
          ) {
            const varName = expr.object.value;
            const styleObj = resolveCreateObject(varName);
            if (styleObj) {
              const dynExpr = expr.property.expression;
              const dynSource = getSource(dynExpr);
              const currentGroupId = ++groupIdCounter;
              const currentOrder = sourceOrder++;
              Object.entries(styleObj).forEach(([optionName, style]) => {
                conditionals.push({
                  test: dynExpr,
                  testLHS: dynSource,
                  testString: `${dynSource} === '${optionName}'`,
                  truthy: style as CSSObject,
                  falsy: {},
                  groupId: currentGroupId,
                  order: currentOrder,
                  groupName: undefined,
                  valueName: optionName,
                  varName,
                  ownKeys: true,
                });
              });
              continue;
            }
          }

          // Fold the branches into one dimension when the flat form would cost
          // more: a group, or more than the two branches a plain ternary emits.
          const decision = resolveDecision(expr);
          if (decision && (decision.hasGroup || decision.leaves > 2)) {
            const groupId = ++groupIdCounter;
            const currentOrder = sourceOrder++;
            decision.options.forEach(({ value, style }) =>
              conditionals.push({
                test: expr,
                testLHS: decision.keyExpr,
                testString: `${decision.keyExpr} === '${value}'`,
                truthy: style,
                falsy: {},
                groupId,
                order: currentOrder,
                groupName: undefined,
                valueName: value,
                varName: undefined,
                ownKeys: true,
              }),
            );
            continue;
          }

          const handled = collectConditions(expr, [], arg.order);
          if (handled) continue;

          assertResolvable(expr as HasSpan);

          isOptimizable = false;
          break;
        }

        if (
          !isOptimizable ||
          (args.length === 0 && Object.keys(baseStyle).length === 0)
        ) {
          return {
            classParts: [...dynamicClassParts],
            isOptimizable,
            baseStyle,
            dynamicVars,
          };
        }

        const stateSources: StyleSource[] = baseChunks.map(
          ({ order, style }) => ({ order, style: style as CSSProperties }),
        );
        conditionals.forEach((c) => {
          const order = c.order ?? 0;
          stateSources.push({ order, style: c.truthy as CSSProperties });
          stateSources.push({ order, style: c.falsy as CSSProperties });
        });
        const stateWeights = getStateWeights(stateSources);

        const participation: Record<string, Set<string>> = {};
        const registerParticipation = (style: CSSObject, sourceId: string) => {
          Object.keys(style).forEach((key) => {
            if (!participation[key]) participation[key] = new Set();
            participation[key].add(sourceId);
          });
        };

        registerParticipation(baseStyle, 'base');
        conditionals
          .filter((c) => c.groupId === undefined)
          .forEach((c, idx) => {
            registerParticipation(c.truthy, `std_${idx}`);
            registerParticipation(c.falsy, `std_${idx}`);
          });

        const variantGroups: Record<number, StyleConditional[]> = {};
        conditionals.forEach((c) => {
          if (c.groupId !== undefined) {
            if (!variantGroups[c.groupId]) variantGroups[c.groupId] = [];
            variantGroups[c.groupId].push(c);
          }
        });
        Object.entries(variantGroups).forEach(([groupId, opts]) => {
          opts.forEach((opt) =>
            registerParticipation(opt.truthy, `var_${groupId}`),
          );
        });

        const conflictingKeys = new Set<string>();
        Object.entries(participation).forEach(([key, sources]) => {
          if (sources.size > 1) conflictingKeys.add(key);
        });

        const baseIndependent: CSSObject = {};
        const baseConflict: CSSObject = {};
        Object.entries(baseStyle).forEach(([key, val]) => {
          if (conflictingKeys.has(key)) baseConflict[key] = val;
          else baseIndependent[key] = val;
        });

        const indepConditionals: StyleConditional[] = [];
        const conflictConditionals: StyleConditional[] = [];
        conditionals.forEach((c) => {
          const truthyIndep: CSSObject = {};
          const truthyConf: CSSObject = {};
          const falsyIndep: CSSObject = {};
          const falsyConf: CSSObject = {};
          let hasIndep = false;
          let hasConf = false;
          Object.entries(c.truthy).forEach(([k, v]) => {
            if (conflictingKeys.has(k)) {
              truthyConf[k] = v;
              hasConf = true;
            } else {
              truthyIndep[k] = v;
              hasIndep = true;
            }
          });
          Object.entries(c.falsy).forEach(([k, v]) => {
            if (conflictingKeys.has(k)) {
              falsyConf[k] = v;
              hasConf = true;
            } else {
              falsyIndep[k] = v;
              hasIndep = true;
            }
          });
          if (hasIndep)
            indepConditionals.push({
              ...c,
              truthy: truthyIndep,
              falsy: falsyIndep,
            });
          if (hasConf)
            conflictConditionals.push({
              ...c,
              truthy: truthyConf,
              falsy: falsyConf,
            });
        });

        const classParts: string[] = [];

        if (existingClass) classParts.push(existingClass);

        if (Object.keys(baseIndependent).length > 0) {
          const className = processStyleRecords(baseIndependent, stateWeights)
            .map((r) => r.hash)
            .join(' ');
          if (className) classParts.push(JSON.stringify(className));
        }

        indepConditionals
          .filter((c) => c.groupId === undefined)
          .forEach((c) => {
            const processBranch = (style: CSSObject) => {
              if (Object.keys(style).length === 0) return '""';
              return JSON.stringify(
                processStyleRecords(style, stateWeights)
                  .map((r) => r.hash)
                  .join(' '),
              );
            };
            const testStr = c.testString ?? getSource(c.test);
            classParts.push(
              `(${testStr} ? ${processBranch(c.truthy)} : ${processBranch(c.falsy)})`,
            );
          });

        const indepVarGroups: Record<number, StyleConditional[]> = {};
        indepConditionals.forEach((c) => {
          if (c.groupId !== undefined) {
            if (!indepVarGroups[c.groupId]) indepVarGroups[c.groupId] = [];
            indepVarGroups[c.groupId].push(c);
          }
        });
        Object.values(indepVarGroups).forEach((options) => {
          const commonTestExpr =
            options[0].testLHS ??
            options[0].testString ??
            getSource(options[0].test);
          const lookupMap: Record<string, string> = {};
          options.forEach((opt) => {
            // `''` is the off slot of a gated group, a real key -- not absence.
            if (opt.valueName !== undefined && opt.truthy) {
              const className = processStyleRecords(opt.truthy, stateWeights)
                .map((r) => r.hash)
                .join(' ');
              if (className) lookupMap[opt.valueName] = className;
            }
          });
          if (Object.keys(lookupMap).length > 0) {
            const entries = Object.entries(lookupMap)
              .map(([k, v]) => `"${k}":"${v}"`)
              .join(',');
            classParts.push(`({${entries}}[${commonTestExpr}] || "")`);
          }
        });

        if (
          Object.keys(baseConflict).length > 0 ||
          conflictConditionals.length > 0
        ) {
          interface Dimension {
            type: 'std' | 'var' | 'const';
            options: Array<{
              value: number | string | undefined;
              style: CSSObject;
              label: string;
            }>;
            testExpr?: string;
            ownKeys?: boolean;
          }
          // Ordered by where each source was written, so `recurse` merges them
          // the way the author stacked them rather than grouping by kind.
          const ordered: Array<{ order: number; dimension: Dimension }> = [];

          // An unconditional style is a source with a single outcome. Giving it
          // a slot of its own is what lets a later one override an earlier
          // condition; having one outcome, it never widens the table.
          baseChunks.forEach(({ order, style }) => {
            const conflicting: CSSObject = {};
            Object.entries(style).forEach(([key, value]) => {
              if (conflictingKeys.has(key)) conflicting[key] = value;
            });
            if (Object.keys(conflicting).length === 0) return;
            ordered.push({
              order,
              dimension: {
                type: 'const',
                options: [
                  { value: undefined, style: conflicting, label: 'base' },
                ],
              },
            });
          });

          conflictConditionals
            .filter((c) => c.groupId === undefined)
            .forEach((c) => {
              ordered.push({
                order: c.order ?? 0,
                dimension: {
                  type: 'std',
                  testExpr: c.testString ?? getSource(c.test),
                  options: [
                    { value: 0, style: c.falsy, label: 'false' },
                    { value: 1, style: c.truthy, label: 'true' },
                  ],
                },
              });
            });

          const conflictVarGroups: Record<number, StyleConditional[]> = {};
          conflictConditionals.forEach((c) => {
            if (c.groupId !== undefined) {
              if (!conflictVarGroups[c.groupId])
                conflictVarGroups[c.groupId] = [];
              conflictVarGroups[c.groupId].push(c);
            }
          });
          // A gated group's off slot can carry no style at all, so the split
          // above drops it. The dimension still needs its key, or combinations
          // where the gate is false have no entry to land on.
          Object.keys(conflictVarGroups).forEach((id) => {
            const groupId = Number(id);
            const opts = conflictVarGroups[groupId];
            if (opts.some((c) => c.valueName === '')) return;
            const off = conditionals.find(
              (c) => c.groupId === groupId && c.valueName === '',
            );
            if (off) opts.push({ ...off, truthy: {}, falsy: {} });
          });
          Object.entries(conflictVarGroups).forEach(([, opts]) => {
            ordered.push({
              order: opts[0].order ?? 0,
              dimension: {
                type: 'var',
                testExpr:
                  opts[0].testLHS ??
                  opts[0].testString ??
                  getSource(opts[0].test),
                options: opts.map((opt) => ({
                  value: opt.valueName,
                  style: opt.truthy,
                  label: opt.valueName || 'default',
                })),
                ownKeys: opts[0].ownKeys,
              },
            });
          });

          ordered.sort((a, b) => a.order - b.order);
          const dimensions: Dimension[] = ordered.map((o) => o.dimension);

          const joined =
            dimensions.filter((dim) => dim.type !== 'const').length > 1;
          dimensions.forEach((dim) => {
            if (!joined || dim.type !== 'var' || !dim.ownKeys) return;
            const numbers: Record<string, string> = {};
            dim.options.forEach((opt, index) => {
              numbers[String(opt.value)] = String(index);
              opt.value = String(index);
            });
            dim.testExpr = `(${JSON.stringify(numbers)}[${dim.testExpr}] || "")`;
          });

          const results: Record<string, string> = {};
          const recurse = (
            dimIndex: number,
            currentStyle: CSSObject,
            keyParts: string[],
          ) => {
            if (dimIndex >= dimensions.length) {
              const className = processStyleRecords(currentStyle, stateWeights)
                .map((r) => r.hash)
                .join(' ');
              if (className) results[keyParts.join('__')] = className;
              return;
            }
            const dimension = dimensions[dimIndex];
            dimension.options.forEach((opt) =>
              recurse(
                dimIndex + 1,
                deepMerge(currentStyle, opt.style),
                // A constant offers no runtime choice, so it claims no part of
                // the key -- it only fixes where its style lands in the merge.
                dimension.type === 'const'
                  ? keyParts
                  : [...keyParts, String(opt.value)],
              ),
            );
          };
          // The constants are dimensions of their own now, so the merge starts
          // from nothing and picks them up in written order.
          recurse(0, {}, []);

          const baseConflictClass =
            Object.keys(baseConflict).length > 0
              ? processStyleRecords(baseConflict, stateWeights)
                  .map((r) => r.hash)
                  .join(' ')
              : '';
          const masterKeyExpr = dimensions
            .filter((dim) => dim.type !== 'const')
            .map((dim) =>
              dim.type === 'std'
                ? `(${dim.testExpr} ? "1" : "0")`
                : dim.testExpr || '""',
            )
            .join(' + "__" + ');

          classParts.push(
            `(${JSON.stringify(results)}[${masterKeyExpr || '""'}] || ${baseConflictClass ? JSON.stringify(baseConflictClass) : '""'})`,
          );
        }

        classParts.push(...dynamicClassParts);
        return { classParts, isOptimizable, baseStyle, dynamicVars };
      };

      // Pass 2: Confirm reference replacement
      traverse(ast, {
        JSXOpeningElement({ node }: { node: JSXOpeningElement }) {
          jsxOpeningElementMap.set(node.span.start, {
            compKey: resolveComponentKey(node.name, resourcePath, localImports),
            attributes: node.attributes,
          });
        },
        MemberExpression({ node }: { node: MemberExpression }) {
          if (
            t.isIdentifier(node.object) &&
            (t.isIdentifier(node.property) || node.property.type === 'Computed')
          ) {
            const varName = node.object.value;
            const uniqueKey = `${resourcePath}-${varName}`;

            if (node.property.type === 'Computed') {
              const dynExpr = node.property.expression;
              const dynSource = getSource(dynExpr);
              const localStyle = localCreateStyles[varName];
              let hashMap: Record<string, any> | undefined;

              if (localStyle) {
                hashMap = localStyle.hashMap;
              } else {
                let hash = scannedTables.createHashTable[uniqueKey];
                if (!hash) {
                  hash = mergedCreateTable[varName];
                }
                if (hash) {
                  const obj = scannedTables.createObjectTable[hash];
                  const atomicMap = scannedTables.createAtomicMapTable[hash];
                  if (obj && atomicMap) {
                    hashMap = {};
                    Object.keys(obj).forEach((key) => {
                      if (atomicMap[key]) {
                        hashMap![key] = atomicMap[key];
                      }
                    });
                  }
                }
              }

              if (hashMap) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `((${JSON.stringify(hashMap)})[${dynSource}] || {})`,
                });
              }
              return;
            }

            const propName = node.property.value;

            // Check localCreateStyles first to ensure HMR updates correctly for local styles
            const localStyle = localCreateStyles[varName];
            if (localStyle && localStyle.type === 'create') {
              const atomMap = localStyle.hashMap[propName];
              if (atomMap) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomMap)})`,
                });
                return;
              }
            }

            let hash = scannedTables.createHashTable[uniqueKey];
            if (!hash) {
              hash = mergedCreateTable[varName];
            }

            if (hash) {
              let atomMap: Record<string, string> | undefined;

              // Check atomic map first
              if (scannedTables.createAtomicMapTable[hash]) {
                atomMap = scannedTables.createAtomicMapTable[hash][propName];
              }

              if (atomMap) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomMap)})`,
                });
              }
            }

            // Check createTheme - prioritize import-resolved table over scannedTables uniqueKey
            // because scannedTables[uniqueKey] may contain stale cached data from the importing file
            let themeHash = mergedCreateThemeHashTable[varName];
            if (!themeHash) {
              themeHash = scannedTables.createThemeHashTable[uniqueKey];
            }

            if (themeHash) {
              const atomicMap = scannedTables.createAtomicMapTable[themeHash];
              if (atomicMap && atomicMap[propName]) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(atomicMap[propName])})`,
                });
              } else {
                const cssVarName = camelToKebabCase(propName);
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(`var(--${themeHash}-${cssVarName})`)})`,
                });
              }
            }

            // Check createStatic - same priority: import-resolved table first
            let staticHash = mergedCreateStaticHashTable[varName];
            if (!staticHash) {
              staticHash = scannedTables.createStaticHashTable[uniqueKey];
            }

            if (staticHash) {
              const staticObj =
                scannedTables.createStaticObjectTable[staticHash];
              if (staticObj && staticObj[propName] !== undefined) {
                replacements.push({
                  start: node.span.start - baseByteOffset,
                  end: node.span.end - baseByteOffset,
                  content: `(${JSON.stringify(staticObj[propName])})`,
                });
              }
            }
          }
        },
        Identifier({ node }: { node: Identifier }) {
          if (excludedSpans.has(node.span.start)) return;
          if (idSpans.has(node.span.start)) return;
          if (!referenceIdents.references.has(node.span.start)) return;

          const prefix = referenceIdents.shorthands.has(node.span.start)
            ? `${node.value}: `
            : '';
          const pushReplacement = (content: string) => {
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: `${prefix}${content}`,
            });
          };

          const styleInfo = localCreateStyles[node.value];
          if (styleInfo) {
            pushReplacement(`(${JSON.stringify(styleInfo.hashMap)})`);
            return;
          }

          const varName = node.value;
          const uniqueKey = `${resourcePath}-${varName}`;

          let hash = mergedCreateTable[varName];
          if (!hash) {
            hash = scannedTables.createHashTable[uniqueKey];
          }

          if (hash) {
            const obj = scannedTables.createObjectTable[hash];
            const atomicMap = scannedTables.createAtomicMapTable[hash];

            if (obj && atomicMap) {
              // Reconstruct hashMap from createObjectTable + createAtomicMapTable
              const hashMap: Record<string, Record<string, string>> = {};
              Object.keys(obj).forEach((key) => {
                if (atomicMap[key]) {
                  hashMap[key] = atomicMap[key];
                }
              });

              pushReplacement(`(${JSON.stringify(hashMap)})`);
            }
          }

          // Check createTheme using atomic map
          let themeHash = mergedCreateThemeHashTable[varName];
          if (!themeHash) {
            themeHash = scannedTables.createThemeHashTable[uniqueKey];
          }

          if (themeHash) {
            // Use createAtomicMapTable to get resolved CSS variables
            const atomicMap = scannedTables.createAtomicMapTable[themeHash];
            if (atomicMap) {
              pushReplacement(`(${JSON.stringify(atomicMap)})`);
              return;
            }
          }

          // Check createStatic
          let staticHash = mergedCreateStaticHashTable[varName];
          if (!staticHash) {
            staticHash = scannedTables.createStaticHashTable[uniqueKey];
          }

          if (staticHash) {
            const staticObj = scannedTables.createStaticObjectTable[staticHash];
            if (staticObj) {
              pushReplacement(`(${JSON.stringify(staticObj)})`);
            }
          }
        },
        JSXAttribute({ node }: { node: JSXAttribute }) {
          if (node.name.type !== 'Identifier') return;
          const attrName = node.name.value;

          if (attrName !== styleProp) {
            let compKey: string | null = null;
            for (const [, val] of jsxOpeningElementMap) {
              const found = val.attributes
                .filter((a): a is JSXAttribute => a.type === 'JSXAttribute')
                .find((a) => a.span.start === node.span.start);
              if (found) {
                compKey = val.compKey;
                break;
              }
            }

            if (compKey) {
              const list =
                scannedTables.componentPropsTable?.[compKey]?.[attrName];
              if (
                list &&
                node.value &&
                node.value.type === 'JSXExpressionContainer'
              ) {
                const expr = node.value.expression;
                const replaceWithKey = (subNode: {
                  span: { start: number; end: number };
                }) => {
                  const entry = list.find(
                    (x) =>
                      x.spanStart === subNode.span.start &&
                      x.filePath === resourcePath,
                  );
                  if (entry) {
                    replacements.push({
                      start: subNode.span.start - baseByteOffset,
                      end: subNode.span.end - baseByteOffset,
                      content: JSON.stringify(entry.key),
                    });
                    // Emit the prop style's CSS from the parent too, so the
                    // rules are live as soon as the parent recompiles even if
                    // the child module hasn't re-transformed yet.
                    processStyleRecords(entry.styleObj);
                    return true;
                  }
                  return false;
                };
                traverse(expr, {
                  MemberExpression({ node: subNode }) {
                    if (replaceWithKey(subNode)) {
                      excludeSubtreeSpans(subNode);
                    }
                  },
                  ArrayExpression({ node: subNode }) {
                    if (replaceWithKey(subNode)) {
                      excludeSubtreeSpans(subNode);
                    }
                  },
                });
              }
            }
            return;
          }

          if (!node.value || node.value.type !== 'JSXExpressionContainer')
            return;

          const expr = node.value.expression;
          const args: Array<{ expression: Expression; order?: number }> =
            expr.type === 'ArrayExpression'
              ? expr.elements
                  .filter((el) => el !== undefined)
                  .map((el) => ({ expression: el.expression }))
              : [{ expression: expr }];

          const dynamicClassParts: string[] = [];
          const existingStyleParts: string[] = [];

          let attributes: Array<JSXAttribute | SpreadElement> = [];
          for (const [, val] of jsxOpeningElementMap) {
            const found = val.attributes
              .filter((a): a is JSXAttribute => a.type === 'JSXAttribute')
              .find((a) => a.span.start === node.span.start);
            if (found) {
              attributes = val.attributes;
              break;
            }
          }

          const classNameAttr = attributes.find(
            (attr): attr is JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'Identifier' &&
              attr.name.value === 'className',
          );
          let existingClassExpr = '';

          if (classNameAttr) {
            replacements.push({
              start: classNameAttr.span.start - baseByteOffset,
              end: classNameAttr.span.end - baseByteOffset,
              content: '',
            });
            if (classNameAttr.value?.type === 'StringLiteral') {
              existingClassExpr = JSON.stringify(classNameAttr.value.value);
            } else if (classNameAttr.value?.type === 'JSXExpressionContainer') {
              const start =
                (classNameAttr.value.expression as HasSpan).span.start -
                baseByteOffset;
              const end =
                (classNameAttr.value.expression as HasSpan).span.end -
                baseByteOffset;
              existingClassExpr = `(${sourceBuffer
                .subarray(start, end)
                .toString('utf-8')})`;
            }
          }

          const styleAttrExisting = attributes.find(
            (attr): attr is JSXAttribute =>
              attr.type === 'JSXAttribute' &&
              attr.name.type === 'Identifier' &&
              attr.name.value === 'style',
          );
          let existingStyleExpr = '';

          if (styleAttrExisting) {
            replacements.push({
              start: styleAttrExisting.span.start - baseByteOffset,
              end: styleAttrExisting.span.end - baseByteOffset,
              content: '',
            });

            if (styleAttrExisting.value?.type === 'JSXExpressionContainer') {
              const innerExpr = styleAttrExisting.value?.expression;
              const start = (innerExpr as HasSpan).span.start - baseByteOffset;
              const end = (innerExpr as HasSpan).span.end - baseByteOffset;
              const innerSource = sourceBuffer
                .subarray(start, end)
                .toString('utf-8');

              if (innerExpr.type === 'ObjectExpression') {
                const stripped = innerSource.slice(1, -1).trim();
                if (stripped) existingStyleParts.push(stripped);
              } else {
                existingStyleExpr = `...(${innerSource})`;
              }
            }
          }

          const { classParts, isOptimizable, baseStyle, dynamicVars } =
            buildClassParts(args, dynamicClassParts, existingClassExpr, true);

          const dynamicStyleParts = foldDynamicVars(dynamicVars);
          const styleParts = [...existingStyleParts, ...dynamicStyleParts];
          const styleAttr =
            styleParts.length > 0 || existingStyleExpr
              ? ` style={{ ${[existingStyleExpr, ...styleParts].filter(Boolean).join(', ')} }}`
              : '';

          if (
            isOptimizable &&
            (args.length > 0 ||
              Object.keys(baseStyle).length > 0 ||
              dynamicClassParts.length > 0)
          ) {
            const replacement =
              classParts.length > 0 ? classParts.join(' + " " + ') : '""';
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: `className={${replacement}}${styleAttr}`,
            });
          } else {
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: styleAttr || '',
            });
          }
        },
        CallExpression({ node }: { node: CallExpression }) {
          const callee = node.callee;
          let isUseCall = false;

          if (
            t.isMemberExpression(callee) &&
            t.isIdentifier(callee.object) &&
            t.isIdentifier(callee.property)
          ) {
            const objectName = callee.object.value;
            const propertyName = callee.property.value;
            if (
              localCreateStyles[objectName]?.functions?.[propertyName] ||
              createFunctionImportMap[objectName]?.[propertyName]
            ) {
              dynamicFnCalls.push(node);
            }
            const alias = plumeriaAliases[objectName];
            if (alias === 'NAMESPACE' && propertyName === 'use') {
              isUseCall = true;
            }
          } else if (t.isIdentifier(callee)) {
            const calleeName = callee.value;
            const originalName = plumeriaAliases[calleeName];
            if (originalName === 'use') {
              isUseCall = true;
            }
          }

          if (!isUseCall) return;

          const args: Array<{ expression: Expression }> = node.arguments;
          for (const arg of args) {
            const expr = arg.expression;
            if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
              continue;
            const callee = expr.callee;
            if (
              !t.isIdentifier(callee.object) ||
              !t.isIdentifier(callee.property)
            )
              continue;

            const varName = callee.object.value;
            const propKey = callee.property.value;
            const styleInfo = localCreateStyles[varName];
            if (styleInfo?.functions?.[propKey]) {
              throwCompilationError(
                `Plumeria: css.use(${getSource(
                  expr,
                )}) does not support dynamic function keys.`,
                expr,
              );
            }
          }

          const { classParts, isOptimizable, baseStyle } =
            buildClassParts(args);

          if (
            isOptimizable &&
            (args.length > 0 || Object.keys(baseStyle).length > 0)
          ) {
            const replacement =
              classParts.length > 0 ? classParts.join(' + " " + ') : '""';
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: replacement,
            });
          }
        },
      });

      for (const { name, node } of components) {
        const props =
          scannedTables.componentPropsTable?.[`${resourcePath}-${name}`];
        for (const propName of Object.keys(props ?? {})) {
          if (appliedStyleProps.has(`${name}:${propName}`)) {
            continue;
          }
          throwCompilationError(
            `Plumeria: "${propName}" is a style received through a prop but is never applied ` +
              `to ${styleProp} or css.use() here. Apply it on an element this component renders; ` +
              `a style prop cannot be passed on to another component.`,
            node,
          );
        }
      }

      const buildExportedInit = (info: CreateStyleValue): string => {
        const keys = Object.keys(info.obj);
        if (!isDev || keys.length === 0) {
          return JSON.stringify('');
        }
        const head = JSON.stringify(`Plumeria: "${info.name}.`);
        const tail = JSON.stringify(
          `" was read at runtime. The file that read it was not compiled ` +
            `because it does not reference "@plumeria/core" — add ` +
            `import '@plumeria/core'; to it (see the stack below). Defined in ` +
            `${path.relative(viteRoot, baseId)}.`,
        );
        return (
          `(()=>{const k=new Set(${JSON.stringify(keys)});` +
          `return new Proxy({},{get(t,p){` +
          `if(typeof p==="string"&&k.has(p))throw new Error(${head}+p+${tail});` +
          `return t[p];}});})()`
        );
      };

      // Confirm the replacement of the styles declaration
      Object.values(localCreateStyles).forEach((info) => {
        if (info.isExported) {
          replacements.push({
            start: info.initSpan.start,
            end: info.initSpan.end,
            content: buildExportedInit(info),
          });
        } else {
          replacements.push({
            start: info.declSpan.start,
            end: info.declSpan.end,
            content: '',
          });
        }
      });

      dynamicFnCalls.forEach((call) => {
        const start = call.span.start - baseByteOffset;
        const end = call.span.end - baseByteOffset;
        const isResolved = replacements.some(
          (r) => r.start <= start && r.end >= end,
        );
        if (!isResolved) {
          throwCompilationError(
            `Plumeria: ${getSource(call)} is only supported in the ${styleProp} prop. ` +
              `A dynamic style function resolves to a class name and a CSS variable on the element itself, ` +
              `so it cannot be passed through another prop or read as a value.`,
            call,
          );
        }
      });

      // Apply replacements
      const buffer = Buffer.from(source);
      let offset = 0;
      const parts: Buffer[] = [];

      replacements
        .sort((a, b) => a.start - b.start || b.end - a.end)
        .forEach((r) => {
          if (r.start < offset) return;
          parts.push(buffer.subarray(offset, r.start));
          parts.push(Buffer.from(r.content));
          offset = r.end;
        });
      parts.push(buffer.subarray(offset));
      const transformedSource = Buffer.concat(parts).toString();
      const optInCSS = await optimizer(extractedSheets.join(''));

      const cssFilename = `${baseId.replace(EXTENSION_PATTERN, '')}.zero.css`;
      const cssId = `/${path.relative(viteRoot, cssFilename).replace(/\\/g, '/')}`;

      if (isDev) {
        if (!devCssSheets.has(cssFilename)) {
          devCssSheets.set(cssFilename, new Set());
        }
        const acc = devCssSheets.get(cssFilename)!;

        // Additive in dev: keep previously emitted sheets so classes still
        // referenced by not-yet-retransformed modules never flash away.
        // Re-adding moves a sheet to the end so latest-wins order is kept
        // for :root/theme rules.
        extractedSheets.forEach((sheet) => {
          acc.delete(sheet);
          acc.add(sheet);
        });

        const accCSS = await optimizer(Array.from(acc).join(''));
        cssLookup.set(cssFilename, accCSS);
      } else {
        cssLookup.set(cssFilename, optInCSS);
      }
      cssFileLookup.set(cssId, cssFilename);

      if (extractedSheets.length > 0) {
        const targetIndex = targets.findIndex((t) => t.id === id);
        if (targetIndex !== -1) {
          targets[targetIndex].dependencies = dependencies;
        } else {
          targets.push({ id, dependencies });
        }

        return {
          code: transformedSource + `\nimport ${JSON.stringify(cssId)};`,
          map: null,
        };
      } else {
        const targetIndex = targets.findIndex((t) => t.id === id);
        if (targetIndex !== -1) {
          targets.splice(targetIndex, 1);
        }

        return {
          code: transformedSource,
          map: null,
        };
      }
    },
  };
};
