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
  SpreadElement,
  ExportDeclaration,
  JSXOpeningElement,
  MemberExpression,
} from '@swc/core';
import * as path from 'path';
import {
  applyCssValue,
  genBase36Hash,
  camelToKebabCase,
  isAtRule,
} from 'zss-engine';
import type { CSSProperties } from 'zss-engine';
import {
  traverse,
  resolvePropertyPolicy,
  assertPropertyPolicy,
  collectReferenceIdentifiers,
  getStyleRecords,
  getStateWeights,
  collectLocalConsts,
  objectExpressionToObject,
  t,
  getRootIdentifier,
  unwrapExpression,
  extractOndemandStyles,
  deepMerge,
  scanAll,
  resolveFileError,
  resolveImportPath,
  getLeadingCommentLength,
  optimizer,
  styleFunctionsOf,
  isUnitlessProp,
  resolveDynamicStyle,
  themeHashOf,
  getFileDependencies,
  resolveExport,
  resolveComponentKey,
  resolveThemeSelector,
  DEFAULT_STYLE_PROP,
} from '@plumeria/utils';
import type {
  PropertyPolicyOptions,
  NamedParam,
  StyleFunctions,
  DynamicStyleTables,
} from '@plumeria/utils';
import type {
  StyleRecord,
  StyleSource,
  StaticTable,
  KeyframesHashTable,
  ViewTransitionHashTable,
  CreateHashTable,
  CreateThemeHashTable,
  CreateStaticHashTable,
  CSSObject,
} from '@plumeria/utils';

export interface PluginOptions extends PropertyPolicyOptions {
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
    {
      params: string[];
      named?: NamedParam[];
      defaults?: Record<string, Expression>;
      body: ObjectExpression;
    }
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

const unwrapExport = (node: any): any => {
  if (node?.type === 'ExportDeclaration') return node.declaration;
  if (node?.type === 'ExportDefaultDeclaration') return node.decl;
  if (node?.type === 'ExportDefaultExpression') return node.expression;
  return node;
};

const isFunctionNode = (
  node: any,
): node is HasSpan & { params: unknown[]; identifier?: Identifier } =>
  node?.type === 'FunctionDeclaration' ||
  node?.type === 'FunctionExpression' ||
  node?.type === 'ArrowFunctionExpression';

const componentFunctionOf = (
  node: any,
): (HasSpan & { params: unknown[]; identifier?: Identifier }) | undefined => {
  if (isFunctionNode(node)) return node;
  if (node?.type === 'CallExpression') {
    for (const arg of node.arguments ?? []) {
      const fn = componentFunctionOf(arg.expression);
      if (fn) return fn;
    }
  }
  return undefined;
};

const unwrapPatternDefault = (pattern: any): any =>
  pattern?.type === 'AssignmentPattern' ? pattern.left : pattern;

const destructuredPropAliases = (fn: {
  params: unknown[];
}): Map<string, string> => {
  const aliases = new Map<string, string>();
  const first = fn.params[0] as any;
  const pattern = unwrapPatternDefault(first?.pat ?? first);
  if (pattern?.type !== 'ObjectPattern') return aliases;
  for (const item of pattern.properties ?? []) {
    if (item.type !== 'KeyValuePatternProperty') continue;
    const local = unwrapPatternDefault(item.value);
    const key = item.key;
    if (!t.isIdentifier(local)) continue;
    if (!t.isIdentifier(key) && !t.isStringLiteral(key)) continue;
    const name = String(key.value);
    if (name !== local.value) aliases.set(local.value, name);
  }
  return aliases;
};

const propDefaultMessage = (source: string): string =>
  `Plumeria: A style prop default must be a defined style: "${source}". ` +
  `Apply a conditional or dynamic style where the element is styled.`;

const spreadStyleMessage = (source: string): string =>
  `Plumeria: Spread elements in a style array are not supported: "...${source}". ` +
  `List each style explicitly.`;

type LocalStyleAlias = { expression: Expression; context: number };

const resolveLocalStyleAlias = (
  aliases: Record<string, LocalStyleAlias[]>,
  expression: Expression,
): Expression => {
  let current = expression;
  const seen = new Set<string>();
  while (t.isIdentifier(current)) {
    const name = current.value;
    if (seen.has(name)) break;
    seen.add(name);
    const candidates = aliases[name];
    if (!candidates || candidates.length === 0) break;
    const candidate = candidates.find(
      (candidate) =>
        candidate.context === (current as Identifier & { ctxt: number }).ctxt,
    );
    if (!candidate) break;
    current = candidate.expression;
  }
  return current;
};

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

const isNoOpStyle = (node: Expression): boolean =>
  t.isNullLiteral(node) ||
  (t.isBooleanLiteral(node) && node.value === false) ||
  (t.isIdentifier(node) && node.value === 'undefined');

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

export const unpluginFactory: UnpluginFactory<PluginOptions | undefined> = (
  options = {},
  unpluginMeta,
) => {
  const filter = createFilter(options.include, options.exclude);
  const propertyPolicy = resolvePropertyPolicy(options);
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

      assertPropertyPolicy(ast, propertyPolicy, id);

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
            isVisibleReference(node as Expression) &&
            ((localCreateStyles[rootId] !== undefined &&
              localCreateStyles[rootId].type !== 'constant') ||
              mergedCreateTable[rootId] !== undefined);
          if (!isPlumeriaStyle) {
            const origin = rootId ? localImports[rootId] : undefined;
            const failure = origin
              ? resolveFileError(origin.actualPath, origin.importedName)
              : undefined;
            if (failure) {
              throwCompilationError(
                `Plumeria: ${failure.message} (${path.basename(failure.filePath)})`,
              );
            }
            throwCompilationError(
              `Plumeria: Dynamic or unresolvable style object "${getSource(node)}" is not supported.`,
              node,
            );
          }
        }
      };

      const scannedTables = scanAll();
      const ownFailure = resolveFileError(baseId, '');
      if (ownFailure) throwCompilationError(`Plumeria: ${ownFailure.message}`);

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
      const propAliases = new Map<string, Map<string, string>>();
      const propDefaults = new Map<string, Map<string, Expression>>();
      const declaredProps = new Map<string, Set<string>>();
      const addComponent = (
        name: string,
        fn: HasSpan & { params: unknown[] },
      ) => {
        components.push({ name, node: fn });
        const first = fn.params[0] as any;
        const pattern = unwrapPatternDefault(first?.pat ?? first);
        const defaults = new Map<string, Expression>();
        for (const item of pattern?.properties ?? []) {
          if (item.type === 'AssignmentPatternProperty' && item.value)
            defaults.set(item.key.value, item.value);
          if (
            item.type === 'KeyValuePatternProperty' &&
            item.value?.type === 'AssignmentPattern'
          )
            defaults.set(item.key.value, item.value.right);
        }
        propDefaults.set(name, defaults);
        const aliases = destructuredPropAliases(fn);
        if (aliases.size > 0) propAliases.set(name, aliases);
        const declared = new Set<string>();
        for (const item of pattern?.properties ?? []) {
          const key = item.key;
          if (t.isIdentifier(key) || t.isStringLiteral(key))
            declared.add(String(key.value));
        }
        if (declared.size > 0) declaredProps.set(name, declared);
      };
      for (const node of ast.body) {
        const statement = unwrapExport(node);
        if (isFunctionNode(statement)) {
          addComponent(statement.identifier?.value ?? 'default', statement);
        } else if (statement?.type === 'CallExpression') {
          const fn = componentFunctionOf(statement);
          if (fn) addComponent('default', fn);
        } else if (t.isVariableDeclaration(statement)) {
          for (const decl of statement.declarations) {
            if (!t.isIdentifier(decl.id)) continue;
            const fn = componentFunctionOf(decl.init);
            if (fn) addComponent(decl.id.value, fn);
          }
        }
      }

      const appliedStyleProps = new Set<string>();
      const ownerComponentOf = (at: HasSpan) =>
        components.find(
          (c) =>
            at.span.start >= c.node.span.start &&
            at.span.start <= c.node.span.end,
        )?.name;
      const markStylePropApplied = (name: string, at: HasSpan) => {
        const owner = ownerComponentOf(at);
        if (owner) {
          appliedStyleProps.add(`${owner}:${name}`);
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
      const importMap: StaticTable = {};
      const keyframesImportMap: KeyframesHashTable = {};
      const viewTransitionImportMap: ViewTransitionHashTable = {};
      const createImportMap: CreateHashTable = {};
      const createFunctionImportMap: Record<string, StyleFunctions> = {};
      const createThemeImportMap: CreateThemeHashTable = {};
      const createStaticImportMap: CreateStaticHashTable = {};
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

      const dynamicStyleTables: DynamicStyleTables = {
        keyframesHashTable: mergedKeyframesTable,
        viewTransitionHashTable: mergedViewTransitionTable,
        createThemeHashTable: mergedCreateThemeHashTable,
        createThemeObjectTable: scannedTables.createThemeObjectTable,
        createHashTable: mergedCreateTable,
        createStaticHashTable: mergedCreateStaticHashTable,
        createStaticObjectTable: scannedTables.createStaticObjectTable,
      };

      const localCreateStyles: Record<string, CreateStyleValue> = {};
      const localStyleAliases: Record<string, LocalStyleAlias[]> = {};

      const checkStyleAliasAssignment = (decl: VariableDeclarator) => {
        if (!t.isIdentifier(decl.id) || !decl.init) return;
        const init = unwrapExpression(decl.init);
        if (t.isMemberExpression(init) && t.isIdentifier(init.object)) {
          const objName = init.object.value;
          if (
            localCreateStyles[objName] !== undefined ||
            mergedCreateTable[objName] !== undefined
          ) {
            (localStyleAliases[decl.id.value] ??= []).push({
              expression: init,
              context: (decl.id as Identifier & { ctxt: number }).ctxt,
            });
          }
        }
      };

      const replacements: Array<{
        start: number;
        end: number;
        content: string;
      }> = [];

      const deferredSources: Array<{
        token: string;
        start: number;
        end: number;
        stripObject: boolean;
      }> = [];
      const deferSource = (node: HasSpan, stripObject = false): string => {
        const token = `__plumeria_preserved_${deferredSources.length}__`;
        deferredSources.push({
          token,
          start: node.span.start - baseByteOffset,
          end: node.span.end - baseByteOffset,
          stripObject,
        });
        return token;
      };

      const dynamicFnCalls: CallExpression[] = [];
      const processedDecls = new Set<VariableDeclaration>();
      const separatelyExported = new Set<string>();
      for (const statement of ast.body) {
        if (statement.type !== 'ExportNamedDeclaration' || statement.source)
          continue;
        for (const specifier of statement.specifiers) {
          if (
            specifier.type === 'ExportSpecifier' &&
            t.isIdentifier(specifier.orig)
          ) {
            separatelyExported.add(specifier.orig.value);
          }
        }
      }
      const idSpans = new Set<number>();
      const excludedSpans = new Set<number>();
      const referenceIdents = collectReferenceIdentifiers(ast);

      const topLevelDeclarators = new Set<VariableDeclarator>();
      for (const statement of ast.body) {
        const declaration = unwrapExport(statement);
        if (t.isVariableDeclaration(declaration)) {
          declaration.declarations.forEach((decl) =>
            topLevelDeclarators.add(decl),
          );
        }
      }

      const unwrapStyleExpression = (node: any): any => {
        while (
          node &&
          [
            'ParenthesisExpression',
            'TsAsExpression',
            'TsSatisfiesExpression',
            'TsNonNullExpression',
            'TsConstAssertion',
            'TsTypeAssertion',
          ].includes(node.type)
        )
          node = node.expression;
        return node;
      };
      const literalObjectArgument = (
        node: Expression,
        seen = new Set<string>(),
      ): ObjectExpression | null => {
        node = unwrapStyleExpression(node);
        if (t.isObjectExpression(node)) return node;
        if (!t.isIdentifier(node) || seen.has(node.value)) return null;
        seen.add(node.value);
        const declaration = [...topLevelDeclarators].find(
          (decl) =>
            t.isIdentifier(decl.id) &&
            decl.id.value === (node as Identifier).value,
        );
        return declaration?.init
          ? literalObjectArgument(declaration.init, seen)
          : null;
      };
      const registeredStyleCalls = new Set<number>();

      const registerStyle = (
        node: VariableDeclarator,
        declSpan: { start: number; end: number },
        isExported: boolean,
      ) => {
        let propName: string | undefined;
        const init = unwrapStyleExpression(node.init) as Expression | undefined;
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
            ['create', 'createTheme', 'createStatic'].includes(propName) &&
            !topLevelDeclarators.has(node)
          ) {
            throwCompilationError(
              `Plumeria: css.${propName} must be assigned to a top-level variable so its styles can be resolved across files. Move this declaration outside the function or block.`,
              node,
            );
          }
          if (['create', 'createTheme', 'createStatic'].includes(propName)) {
            const argumentIndex = propName === 'createTheme' ? 1 : 0;
            const argument = init.arguments[argumentIndex];
            const object =
              argument && literalObjectArgument(argument.expression);
            if (!object)
              throwCompilationError(
                `Plumeria: css.${propName} needs a style object it can read at build time. Pass an object literal or a top-level constant containing one.`,
                init,
              );
            argument.expression = object!;
            registeredStyleCalls.add(init.span.start);
          }
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

            const selectorExpr = init.arguments[0].expression;
            const selector = resolveThemeSelector(
              selectorExpr,
              mergedStaticTable,
              mergedCreateStaticHashTable,
              scannedTables.createStaticObjectTable,
            );

            if (!selector) {
              throwCompilationError(
                `Plumeria: createTheme needs a selector it can read at build time. ` +
                  `Pass a string literal such as ".dark", or a name this file declares as one.`,
                selectorExpr as HasSpan,
              );
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
            );

            const hash = themeHashOf(selector, obj);
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
                const atomicHash = genBase36Hash(
                  { _theme: hash, [key]: value },
                  1,
                  8,
                );
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
            registerStyle(
              decl,
              node.span,
              node.declarations.length > 1 ||
                (t.isIdentifier(decl.id) &&
                  separatelyExported.has(decl.id.value)),
            );
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
            if (
              ['create', 'createTheme', 'createStatic'].includes(propName) &&
              !registeredStyleCalls.has(node.span.start)
            ) {
              throwCompilationError(
                `Plumeria: css.${propName} must be assigned to a named top-level variable. Destructuring, assignment statements, and default-exported calls cannot be compiled.`,
                node,
              );
            }
            const args = node.arguments;

            if (propName === 'keyframes' && args.length > 0) {
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
              const selectorExpr = args[0].expression;
              const selector = resolveThemeSelector(
                selectorExpr,
                mergedStaticTable,
                mergedCreateStaticHashTable,
                scannedTables.createStaticObjectTable,
              );

              if (!selector) {
                throwCompilationError(
                  `Plumeria: createTheme needs a selector it can read at build time. ` +
                    `Pass a string literal such as ".dark", or a name this file declares as one.`,
                  selectorExpr as HasSpan,
                );
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
              );
              const hash = themeHashOf(selector, obj);
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
      const addFirstParamName = (fn: { params: unknown[] }) => {
        const first = fn.params[0] as any;
        const p = unwrapPatternDefault(first?.pat ?? first);
        if (t.isIdentifier(p)) {
          componentParamNames.add(p.value);
        } else if (p?.type === 'ObjectPattern') {
          for (const item of p.properties) {
            if (item.type === 'RestElement' && t.isIdentifier(item.argument)) {
              componentParamNames.add(item.argument.value);
            }
          }
        }
      };
      for (const node of ast.body) {
        const statement = unwrapExport(node);
        if (isFunctionNode(statement)) {
          addFirstParamName(statement);
        } else if (statement?.type === 'CallExpression') {
          const fn = componentFunctionOf(statement);
          if (fn) addFirstParamName(fn);
        } else if (t.isVariableDeclaration(statement)) {
          for (const decl of statement.declarations) {
            if (!t.isIdentifier(decl.id) || !decl.init) continue;
            const fn = componentFunctionOf(decl.init);
            if (fn) addFirstParamName(fn);
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

      const isVisibleReference = (expr: Expression): boolean => {
        if (t.isIdentifier(expr))
          return referenceIdents.references.has(expr.span.start);
        if (t.isMemberExpression(expr)) return isVisibleReference(expr.object);
        if (
          t.isCallExpression(expr) &&
          expr.callee.type !== 'Super' &&
          expr.callee.type !== 'Import'
        )
          return isVisibleReference(expr.callee);
        return true;
      };

      const resolveStyleObject = (expr: Expression): CSSObject | null => {
        expr = unwrapExpression(expr);
        expr = resolveLocalStyleAlias(localStyleAliases, expr);
        if (!isVisibleReference(expr)) return null;
        if (expr.type === 'ArrayExpression') {
          let merged: CSSObject = {};
          for (const element of expr.elements ?? []) {
            if (!element) continue;
            if (element.spread)
              throwCompilationError(
                spreadStyleMessage(getSource(element.expression)),
                element.expression as HasSpan,
              );
            const style = resolveStyleObject(element.expression);
            if (!style) return null;
            merged = deepMerge(merged, style) as CSSObject;
          }
          return merged;
        }
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
        }
        return null;
      };

      const isStyleFunctionCall = (expr: Expression): boolean => {
        if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
          return false;
        const callee = expr.callee;
        if (!t.isIdentifier(callee.object) || !t.isIdentifier(callee.property))
          return false;
        return Boolean(
          localCreateStyles[callee.object.value]?.functions?.[
            callee.property.value
          ] ??
          createFunctionImportMap[callee.object.value]?.[callee.property.value],
        );
      };

      const carriesStyleReference = (expression: Expression): boolean => {
        const node = unwrapExpression(expression) as Expression;
        if (node.type === 'ArrayExpression')
          return node.elements.some(
            (element) => !!element && carriesStyleReference(element.expression),
          );
        if (isStyleFunctionCall(node)) return true;
        if (t.isObjectExpression(node)) return false;
        return resolveStyleObject(node) !== null;
      };

      const assertNoStyleArraySpread = (expression: Expression) => {
        const node = unwrapExpression(expression) as Expression;
        if (node.type !== 'ArrayExpression') return;
        const spread = node.elements.find((element) => element?.spread);
        if (!spread) return;
        if (carriesStyleReference(node))
          throwCompilationError(
            spreadStyleMessage(getSource(spread.expression)),
            spread.expression as HasSpan,
          );
      };

      // A dynamic call reached through a component prop cannot fold a written-out
      // argument into the rule: the file that only sees the prop has no way to
      // read that value, so both sides have to agree that every parameter travels
      // as a custom property.
      const resolveDynamicCall = (
        expr: Expression,
        forceRuntime = false,
      ): { style: CSSObject; vars: DynamicVar[] } | null => {
        if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
          return null;
        const callee = expr.callee;
        if (!t.isIdentifier(callee.object) || !t.isIdentifier(callee.property))
          return null;

        if (!isVisibleReference(callee.object)) return null;
        const styleInfo = localCreateStyles[callee.object.value];
        const func =
          styleInfo?.functions?.[callee.property.value] ??
          createFunctionImportMap[callee.object.value]?.[callee.property.value];
        if (!func) return null;

        const callArgs = (expr as CallExpression).arguments;
        if (callArgs.some((a) => a.spread)) return null;

        const tempStaticTable = { ...mergedStaticTable };
        const providedParams = new Set<string>();
        const runtime: Array<{ param: string; source: Expression }> = [];

        const resolveObjectArg = (argExpr: ObjectExpression) =>
          objectExpressionToObject(
            {
              ...argExpr,
              properties: argExpr.properties.filter(
                (prop) =>
                  prop.type === 'Identifier' ||
                  (prop.type === 'KeyValueProperty' &&
                    isStaticArgValue(prop.value)),
              ),
            },
            mergedStaticTable,
            mergedKeyframesTable,
            mergedViewTransitionTable,
            mergedCreateThemeHashTable,
            scannedTables.createThemeObjectTable,
            mergedCreateTable,
            mergedCreateStaticHashTable,
            scannedTables.createStaticObjectTable,
          );

        if (func.named) {
          const argExpr = callArgs[0]?.expression;
          if (
            callArgs.length > 1 ||
            (argExpr && argExpr.type !== 'ObjectExpression')
          ) {
            throwCompilationError(
              `Plumeria: ${getSource(expr)} takes one object argument, because ${
                callee.property.value
              } destructures its parameter.`,
              expr as HasSpan,
            );
          }
          const given = new Map<string, Expression>();
          ((argExpr as ObjectExpression)?.properties ?? []).forEach((prop) => {
            if (prop.type === 'Identifier') {
              given.set(prop.value, prop);
            } else if (
              prop.type === 'KeyValueProperty' &&
              (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
              given.set(String(prop.key.value), prop.value);
            }
          });

          const argObj = argExpr
            ? (resolveObjectArg(argExpr as ObjectExpression) ?? {})
            : {};
          func.named.forEach(({ key, local }) => {
            const source = given.get(key);
            if (!source) {
              if (func.defaults?.[local]) return;
              throwCompilationError(
                `Plumeria: ${getSource(expr)} leaves "${key}" unset, and a dynamic style function has no value to fall back on.`,
                expr as HasSpan,
              );
              return;
            }
            if (
              !forceRuntime &&
              isStaticArgValue(source) &&
              argObj[key] !== undefined
            ) {
              tempStaticTable[local] = argObj[key];
              providedParams.add(local);
            } else runtime.push({ param: local, source });
          });
        } else if (
          callArgs.length === 1 &&
          callArgs[0].expression.type === 'ObjectExpression'
        ) {
          if (forceRuntime) return null;
          const argObj =
            resolveObjectArg(callArgs[0].expression as ObjectExpression) ?? {};
          func.params.forEach((p) => {
            if (argObj[p] !== undefined) {
              tempStaticTable[p] = argObj[p];
              providedParams.add(p);
            }
          });
        } else {
          callArgs.forEach((callArg, i) => {
            const p = func.params[i];
            if (!p) return;
            runtime.push({ param: p, source: callArg.expression });
          });
        }

        const resolved = resolveDynamicStyle(
          func,
          runtime.map(({ param }) => param),
          tempStaticTable,
          dynamicStyleTables,
          providedParams,
        );
        if (!resolved) return null;
        const { style, varGroups } = resolved;

        const vars: DynamicVar[] = [];
        runtime.forEach(({ param, source }) => {
          const groups = varGroups.get(param);
          if (!groups?.length) return;

          const argStart = (source as HasSpan).span.start - baseByteOffset;
          const argEnd = (source as HasSpan).span.end - baseByteOffset;
          const argSource = sourceBuffer
            .subarray(argStart, argEnd)
            .toString('utf-8');
          const maybeNumber = Number(argSource);

          groups.forEach(({ cssVar, prop }) => {
            let valueExpr: string;
            const kebabProp = camelToKebabCase(prop);
            if (
              !isNaN(maybeNumber) &&
              argSource.trim() === String(maybeNumber)
            ) {
              valueExpr = JSON.stringify(applyCssValue(maybeNumber, kebabProp));
            } else if (
              (argSource.startsWith('"') && argSource.endsWith('"')) ||
              (argSource.startsWith("'") && argSource.endsWith("'"))
            ) {
              valueExpr = JSON.stringify(
                applyCssValue(argSource.slice(1, -1), kebabProp),
              );
            } else {
              valueExpr = isUnitlessProp(prop)
                ? argSource
                : `(typeof (${argSource}) === 'number' ? (${argSource}) + 'px' : (${argSource}))`;
            }
            vars.push({ cssVar, valueExpr });
          });
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
        propVarSpreads: string[];
      } => {
        args.forEach((arg) => {
          arg.expression = resolveLocalStyleAlias(
            localStyleAliases,
            arg.expression,
          );
        });

        const conditionals: StyleConditional[] = [];
        const dynamicVars: DynamicVar[] = [];
        const propVarSpreads: string[] = [];
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
          if (!isVisibleReference(node.object)) return null;
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
          node = unwrapExpression(node);
          node = resolveLocalStyleAlias(localStyleAliases, node);
          if (isNoOpStyle(node)) return true;
          if (node.type === 'ArrayExpression') {
            return node.elements.every((element) => {
              if (!element) return true;
              if (element.spread)
                throwCompilationError(
                  spreadStyleMessage(getSource(element.expression)),
                  element.expression as HasSpan,
                );
              return collectConditions(
                element.expression,
                currentTestStrings,
                argOrder,
              );
            });
          }
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
            const consequentHandled = collectConditions(
              node.consequent,
              [...currentTestStrings, `(${testSource})`],
              argOrder,
            );
            const alternateHandled = collectConditions(
              node.alternate,
              [...currentTestStrings, `!(${testSource})`],
              argOrder,
            );
            return consequentHandled && alternateHandled;
          } else if (
            node.type === 'BinaryExpression' &&
            node.operator === '&&'
          ) {
            return collectConditions(
              node.right,
              [...currentTestStrings, `(${getSource(node.left)})`],
              argOrder,
            );
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
          const paramObject = isParamMember
            ? ((expr as MemberExpression).object as Identifier).value
            : undefined;
          const isPropsMember = Boolean(
            paramObject &&
            localCreateStyles[paramObject] === undefined &&
            mergedCreateTable[paramObject] === undefined,
          );

          const varName = t.isIdentifier(expr)
            ? expr.value
            : ((expr as MemberExpression).property as Identifier).value;
          const source = t.isIdentifier(expr) ? varName : getSource(expr);
          const owner = ownerComponentOf(expr as HasSpan);
          const propName =
            (t.isIdentifier(expr) && owner
              ? propAliases.get(owner)?.get(varName)
              : undefined) ?? varName;
          markStylePropApplied(propName, expr as HasSpan);

          let possibilities: any[] | undefined = owner
            ? scannedTables.componentPropsTable?.[`${resourcePath}-${owner}`]?.[
                propName
              ]
            : undefined;
          if (!possibilities) {
            const candidates: any[] = [];
            for (const key of Object.keys(
              scannedTables.componentPropsTable || {},
            )) {
              if (!key.startsWith(`${resourcePath}-`)) continue;
              const entries =
                scannedTables.componentPropsTable?.[key]?.[propName];
              if (entries) candidates.push(...entries);
            }
            if (candidates.length > 0) possibilities = candidates;
          }
          const fallback = owner && propDefaults.get(owner)?.get(propName);
          if (fallback && !isNoOpStyle(unwrapExpression(fallback))) {
            const style = resolveStyleObject(fallback);
            if (!style)
              throwCompilationError(
                propDefaultMessage(getSource(fallback)),
                fallback as HasSpan,
              );
            const atoms: Record<string, string> = {};
            getStyleRecords(style as CSSProperties).forEach((record) => {
              atoms[record.key] = record.hash;
            });
            const key = genBase36Hash(Object.values(atoms).join(' '), 1, 8);
            possibilities = [
              ...(possibilities ?? []),
              { key, styleObj: style },
            ];
            const span = (fallback as HasSpan).span;
            for (let index = replacements.length - 1; index >= 0; index--) {
              const replacement = replacements[index];
              if (
                replacement.start >= span.start - baseByteOffset &&
                replacement.end <= span.end - baseByteOffset
              )
                replacements.splice(index, 1);
            }
            excludeSubtreeSpans(fallback);
            replacements.push({
              start: span.start - baseByteOffset,
              end: span.end - baseByteOffset,
              content: JSON.stringify(key),
            });
          }
          if (!possibilities || possibilities.length === 0) {
            return Boolean(
              isPropsMember ||
              (owner && declaredProps.get(owner)?.has(propName)),
            );
          }

          // A style that reached the prop with values beside it arrives as a
          // pair. The key still picks the rule; the values have to be spread on
          // the element, which only the styling prop has room for.
          const carriesVars = possibilities.some((entry) => entry.hasVars);
          if (carriesVars && !isStyleProp) {
            throwCompilationError(
              `Plumeria: "${varName}" carries a dynamic function key, and css.use() returns only a class name. ` +
                `Apply it to ${styleProp} on the element instead.`,
              expr as HasSpan,
            );
          }
          const gate = gates.length ? `(${gates.join(' && ')}) && ` : '';
          if (carriesVars) {
            const spread = `...(${gate}${source} && ${source}.vars)`;
            if (!propVarSpreads.includes(spread)) propVarSpreads.push(spread);
          }

          const token = carriesVars
            ? `((${source} && ${source}.key) || ${source})`
            : source;
          const testLHS = gates.length
            ? `((${gates.join(' && ')}) ? ${token} : "")`
            : token;
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

          if (isNoOpStyle(expr)) continue;

          if (pushPropPossibilities(expr, [])) continue;

          if (t.isCallExpression(expr) && t.isIdentifier(expr.callee)) {
            const varName = expr.callee.value;
            let variantObj: CSSObject | undefined;

            if (isVisibleReference(expr) && localCreateStyles[varName]?.obj)
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
            let variantObj: CSSObject | undefined;

            if (isVisibleReference(expr) && localCreateStyles[varName]?.obj)
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
            const styleObj = isVisibleReference(expr)
              ? resolveCreateObject(varName)
              : null;
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
            propVarSpreads,
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
              .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`)
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
        return {
          classParts,
          isOptimizable,
          baseStyle,
          dynamicVars,
          propVarSpreads,
        };
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
          if (!isVisibleReference(node)) return;
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
              if (node.value?.type === 'JSXExpressionContainer')
                assertNoStyleArraySpread(node.value.expression);
              const list =
                scannedTables.componentPropsTable?.[compKey]?.[attrName];
              if (
                list &&
                node.value &&
                node.value.type === 'JSXExpressionContainer'
              ) {
                const expr = node.value.expression;
                // The key alone names a rule the child already knows. What
                // it cannot know is what the caller put in the variables, so the
                // key travels with them under names no compiled style can answer
                // to -- a Style array the scan could not read still reaches the
                // same prop, and must not be read as a carrier.
                const carrierFor = (
                  subNode: Expression,
                  calls?: Expression[],
                ): string | null => {
                  const vars: DynamicVar[] = [];
                  let unresolved = false;
                  for (const expression of calls ?? [subNode])
                    traverse(expression, {
                      CallExpression({ node: call }: { node: CallExpression }) {
                        if (!isStyleFunctionCall(call)) return;
                        const resolved = resolveDynamicCall(call, true);
                        if (!resolved) {
                          unresolved = true;
                          return;
                        }
                        vars.push(...resolved.vars);
                      },
                    });
                  if (unresolved) return null;
                  return `{ ${foldDynamicVars(vars).join(', ')} }`;
                };
                const replaceWithKey = (subNode: Expression) => {
                  const entries = list.filter(
                    (entry) =>
                      entry.spanStart === (subNode as HasSpan).span.start &&
                      entry.filePath === resourcePath,
                  );
                  if (!entries.length) return false;
                  let content = '""';
                  for (const entry of [...entries].reverse()) {
                    let value = JSON.stringify(entry.key);
                    if (entry.hasVars) {
                      const carrier = carrierFor(subNode, entry.dynamicCalls);
                      if (!carrier) return false;
                      value = `{ key: ${value}, vars: ${carrier} }`;
                    }
                    const condition = entry.conditions
                      ?.map(
                        ({ test, truthy }) =>
                          `${truthy ? '' : '!'}(${getSource(test)})`,
                      )
                      .join(' && ');
                    content = condition
                      ? `((${condition}) ? ${value} : ${content})`
                      : value;
                    processStyleRecords(entry.styleObj);
                  }
                  replacements.push({
                    start: (subNode as HasSpan).span.start - baseByteOffset,
                    end: (subNode as HasSpan).span.end - baseByteOffset,
                    content,
                  });
                  return true;
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
                  CallExpression({ node: subNode }) {
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
                  .filter((el) => el != null)
                  .map((el) => {
                    if (el.spread)
                      throwCompilationError(
                        spreadStyleMessage(getSource(el.expression)),
                        el.expression as HasSpan,
                      );
                    return { expression: el.expression };
                  })
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
              existingClassExpr = `(${deferSource(classNameAttr.value.expression as HasSpan)})`;
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

              if (innerExpr.type === 'ObjectExpression') {
                if (innerExpr.properties.length > 0)
                  existingStyleParts.push(deferSource(innerExpr, true));
              } else {
                existingStyleExpr = `...(${deferSource(innerExpr as HasSpan)})`;
              }
            }
          }

          const {
            classParts,
            isOptimizable,
            baseStyle,
            dynamicVars,
            propVarSpreads,
          } = buildClassParts(args, dynamicClassParts, existingClassExpr, true);

          if (!isOptimizable) {
            throwCompilationError(
              `Plumeria: Dynamic or unresolvable style object "${getSource(expr)}" is not supported.`,
              expr as HasSpan,
            );
          }

          const styleParts = [
            ...existingStyleParts,
            ...foldDynamicVars(dynamicVars),
            ...propVarSpreads,
          ];
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
            const keptClass = existingClassExpr
              ? `className={${existingClassExpr}}`
              : '';
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: `${keptClass}${styleAttr}`,
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

          const { classParts, isOptimizable } = buildClassParts(args);

          if (isOptimizable) {
            const replacement =
              classParts.length > 0 ? classParts.join(' + " " + ') : '""';
            replacements.push({
              start: node.span.start - baseByteOffset,
              end: node.span.end - baseByteOffset,
              content: replacement,
            });
          } else {
            throwCompilationError(
              `Plumeria: Dynamic or unresolvable style object "${getSource(node)}" is not supported.`,
              node,
            );
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

      for (const deferred of deferredSources) {
        let cursor = deferred.start;
        const pieces: string[] = [];
        for (const replacement of [...replacements].sort(
          (a, b) => a.start - b.start || b.end - a.end,
        )) {
          if (replacement.start < cursor || replacement.end > deferred.end)
            continue;
          pieces.push(
            sourceBuffer.subarray(cursor, replacement.start).toString('utf-8'),
            replacement.content,
          );
          cursor = replacement.end;
        }
        pieces.push(
          sourceBuffer.subarray(cursor, deferred.end).toString('utf-8'),
        );
        let content = pieces.join('');
        if (deferred.stripObject) content = content.slice(1, -1).trim();
        for (const replacement of replacements)
          replacement.content = replacement.content.replaceAll(
            deferred.token,
            content,
          );
      }

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
