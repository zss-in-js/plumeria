import { parseSync } from '@swc/core';
import type {
  ObjectExpression,
  Expression,
  ImportSpecifier,
  CallExpression,
  MemberExpression,
  Identifier,
  VariableDeclarator,
  FunctionDeclaration,
  HasSpan,
  JSXAttributeOrSpread,
} from '@swc/core';
import {
  type CSSProperties,
  genBase36Hash,
  camelToKebabCase,
  isAtRule,
} from 'zss-engine';
import * as fs from 'fs';
import * as path from 'path';
import * as rs from '@rust-gear/glob';

import {
  traverse,
  getStyleRecords,
  collectLocalConsts,
  objectExpressionToObject,
  t,
  unwrapExpression,
  getRootIdentifier,
  extractOndemandStyles,
  deepMerge,
  scanAll,
  resolveFileError,
  resolveImportPath,
  resolveExport,
  themeHashOf,
  resolveThemeSelector,
  DEFAULT_STYLE_PROP,
  resolvePropertyPolicy,
  assertPropertyPolicy,
  styleFunctionsOf,
  resolveDynamicStyle,
} from '@plumeria/utils';
import type {
  PropertyPolicyOptions,
  NamedParam,
  StyleFunctions,
  DynamicStyleTables,
} from '@plumeria/utils';
import type {
  StyleRecord,
  CSSObject,
  VariantsHashTable,
  CreateHashTable,
  CreateThemeHashTable,
  CreateStaticHashTable,
  ViewTransitionHashTable,
  KeyframesHashTable,
  StaticTable,
} from '@plumeria/utils';
import { getLeadingCommentLength } from '@plumeria/utils';

interface CompilerOptions extends PropertyPolicyOptions {
  include: string[];
  exclude: string[];
  cwd?: string;
  styleProp?: string;
}

// ===========================================
// Definition of recontext and extraction logic
// ============================================

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

const destructuredPropAliases = (fn: { params: unknown[] }) => {
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

const sourceOf = (
  node: Expression,
  sourceBuffer: Buffer,
  baseByteOffset: number,
): string =>
  sourceBuffer
    .subarray(
      (node as HasSpan).span.start - baseByteOffset,
      (node as HasSpan).span.end - baseByteOffset,
    )
    .toString('utf-8');

const isNoOpStyle = (node: Expression): boolean =>
  t.isNullLiteral(node) ||
  (t.isBooleanLiteral(node) && node.value === false) ||
  (t.isIdentifier(node) && node.value === 'undefined');

const propDefaultError = (source: string, fileName: string): Error =>
  new Error(
    `[plumeria] A style prop default must be a defined style: "${source}". ` +
      `Apply a conditional or dynamic style where the element is styled. (${fileName})`,
  );

const spreadStyleError = (source: string, fileName: string): Error =>
  new Error(
    `[plumeria] Spread elements in a style array are not supported: "...${source}". ` +
      `List each style explicitly. (${fileName})`,
  );

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

interface TraversalContext {
  resourcePath: string;
  mergedStaticTable: StaticTable;
  mergedKeyframesTable: KeyframesHashTable;
  mergedViewTransitionTable: ViewTransitionHashTable;
  mergedCreateThemeHashTable: CreateThemeHashTable;
  mergedCreateStaticHashTable: CreateStaticHashTable;
  mergedCreateTable: CreateHashTable;
  mergedVariantsTable: VariantsHashTable;
  scannedTables: ReturnType<typeof scanAll>;
  createFunctionImportMap: Record<string, StyleFunctions>;
  localCreateStyles: Record<
    string,
    {
      type: 'create' | 'theme';
      obj: CSSObject;
      functions?: Record<
        string,
        {
          params: string[];
          named?: NamedParam[];
          defaults?: Record<string, Expression>;
          body: ObjectExpression;
        }
      >;
    }
  >;
  sourceBuffer: Buffer;
  baseByteOffset: number;
  localStyleAliases?: Record<string, LocalStyleAlias[]>;
}

const dynamicTablesOf = (ctx: TraversalContext): DynamicStyleTables => ({
  keyframesHashTable: ctx.mergedKeyframesTable,
  viewTransitionHashTable: ctx.mergedViewTransitionTable,
  createThemeHashTable: ctx.mergedCreateThemeHashTable,
  createThemeObjectTable: ctx.scannedTables.createThemeObjectTable,
  createHashTable: ctx.mergedCreateTable,
  createStaticHashTable: ctx.mergedCreateStaticHashTable,
  createStaticObjectTable: ctx.scannedTables.createStaticObjectTable,
  variantsHashTable: ctx.mergedVariantsTable,
});

function extractStylesFromExpression(
  expression: Expression,
  ctx: TraversalContext,
): CSSObject[] {
  let expr = expression;
  expr = unwrapExpression(expr);
  if (ctx.localStyleAliases) {
    expr = resolveLocalStyleAlias(ctx.localStyleAliases, expr);
  }

  const results: CSSObject[] = [];

  // This also scans ordinary component props. Only references to Plumeria
  // definitions identify styles here; an object literal may be arbitrary data.
  // Explicit styling expressions are evaluated by resolveStyleObject instead.
  if (t.isMemberExpression(expr)) {
    const memberExpr = expr as MemberExpression;
    if (t.isIdentifier(memberExpr.object)) {
      const variableName = (memberExpr.object as Identifier).value;
      if (t.isIdentifier(memberExpr.property)) {
        const propertyName = (memberExpr.property as Identifier).value;
        const styleSet = ctx.localCreateStyles[variableName];
        if (styleSet && styleSet.obj[propertyName]) {
          results.push(styleSet.obj[propertyName] as CSSObject);
        } else {
          const hash = ctx.mergedCreateTable[variableName];
          if (hash) {
            const object = ctx.scannedTables.createObjectTable[hash];
            if (object && object[propertyName]) {
              results.push(object[propertyName] as CSSObject);
            }
          }
        }
      } else if (memberExpr.property.type === 'Computed') {
        const computedProp = memberExpr.property;
        const innerExpr = computedProp.expression;
        let styleObj: CSSObject | undefined;
        const styleSet = ctx.localCreateStyles[variableName];
        if (styleSet) {
          styleObj = styleSet.obj;
        } else {
          const hash = ctx.mergedCreateTable[variableName];
          if (hash) {
            styleObj = ctx.scannedTables.createObjectTable[hash] as CSSObject;
          }
        }
        if (styleObj) {
          if (t.isStringLiteral(innerExpr)) {
            const key = innerExpr.value;
            if (styleObj[key]) {
              results.push(styleObj[key] as CSSObject);
            }
          } else {
            Object.values(styleObj).forEach((style) => {
              if (style && typeof style === 'object') {
                results.push(style as CSSObject);
              }
            });
          }
        }
      }
    }
  } else if (t.isIdentifier(expr)) {
    const identifier = expr as Identifier;
    const object = ctx.localCreateStyles[identifier.value];
    if (object) results.push(object.obj);
    else {
      const hash = ctx.mergedCreateTable[identifier.value];
      if (hash) {
        const objectFromTable = ctx.scannedTables.createObjectTable[hash];
        if (objectFromTable) results.push(objectFromTable as CSSObject);
      }
    }
  } else if (expr.type === 'ArrayExpression') {
    const spreads: Expression[] = [];
    const elementStyles: CSSObject[] = [];
    for (const element of expr.elements ?? []) {
      if (!element) continue;
      if (element.spread) {
        spreads.push(element.expression);
        continue;
      }
      elementStyles.push(
        ...extractStylesFromExpression(element.expression, ctx),
      );
    }
    for (const spread of spreads) {
      if (
        elementStyles.length > 0 ||
        extractStylesFromExpression(spread, ctx).length > 0
      )
        throw spreadStyleError(
          sourceOf(spread, ctx.sourceBuffer, ctx.baseByteOffset),
          path.basename(ctx.resourcePath),
        );
    }
    results.push(...elementStyles);
  } else if (t.isConditionalExpression(expr)) {
    const condExpr = expr;
    results.push(...extractStylesFromExpression(condExpr.consequent, ctx));
    results.push(...extractStylesFromExpression(condExpr.alternate, ctx));
  } else if (
    t.isBinaryExpression(expr) &&
    ['&&', '||', '??'].includes(expr.operator)
  ) {
    const binaryExpr = expr;
    results.push(...extractStylesFromExpression(binaryExpr.left, ctx));
    results.push(...extractStylesFromExpression(binaryExpr.right, ctx));
  } else if (expr.type === 'ParenthesisExpression') {
    const parenExpr = expr;
    results.push(...extractStylesFromExpression(parenExpr.expression, ctx));
  }

  return results;
}

// ===========================================
// Main compiler function
// ===========================================
export function compileCSS(options: CompilerOptions) {
  const {
    include,
    exclude,
    cwd = process.cwd(),
    styleProp = DEFAULT_STYLE_PROP,
  } = options;
  const propertyPolicy = resolvePropertyPolicy(options);
  const allSheets = new Set<string>();

  const files = rs.globSync(include, {
    cwd,
    exclude: exclude,
    sort: true,
  });

  const scannedTables = scanAll(cwd);

  const processFile = (filePath: string): string[] => {
    const resourcePath = path.resolve(cwd, filePath);
    const source = fs.readFileSync(resourcePath, 'utf-8');
    const extractedSheets: string[] = [];

    const ast = parseSync(source, {
      syntax: 'typescript',
      tsx: true,
      target: 'es2022',
    });

    assertPropertyPolicy(ast, propertyPolicy, resourcePath);

    const leadingLen = getLeadingCommentLength(source);
    const sourceBuffer = Buffer.from(source, 'utf-8');
    const leadingBytes = Buffer.byteLength(
      source.slice(0, leadingLen),
      'utf-8',
    );
    const baseByteOffset = ast.span.start - leadingBytes;

    const localConsts = collectLocalConsts(ast);
    const importMap: StaticTable = {};
    const keyframesImportMap: KeyframesHashTable = {};
    const viewTransitionImportMap: ViewTransitionHashTable = {};
    const createImportMap: CreateHashTable = {};
    const createFunctionImportMap: Record<string, StyleFunctions> = {};
    const variantsImportMap: VariantsHashTable = {};
    const createThemeImportMap: CreateThemeHashTable = {};
    const createStaticImportMap: CreateStaticHashTable = {};
    const plumeriaAliases: Record<string, string> = {};
    const localImports: Record<
      string,
      { actualPath: string; importedName: string }
    > = {};
    const localStyleAliases: Record<string, LocalStyleAlias[]> = {};

    traverse(ast, {
      ImportDeclaration({ node }) {
        const sourcePath = node.source.value;

        if (sourcePath === '@plumeria/core') {
          node.specifiers.forEach((specifier: ImportSpecifier) => {
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

              if (scannedTables.staticTable[uniqueKey])
                importMap[localName] = scannedTables.staticTable[uniqueKey];
              if (scannedTables.keyframesHashTable[uniqueKey])
                keyframesImportMap[localName] =
                  scannedTables.keyframesHashTable[uniqueKey];
              if (scannedTables.viewTransitionHashTable[uniqueKey])
                viewTransitionImportMap[localName] =
                  scannedTables.viewTransitionHashTable[uniqueKey];
              if (scannedTables.createHashTable[uniqueKey])
                createImportMap[localName] =
                  scannedTables.createHashTable[uniqueKey];
              if (scannedTables.createFunctionTable[uniqueKey])
                createFunctionImportMap[localName] = styleFunctionsOf(
                  scannedTables.createFunctionTable[uniqueKey],
                );
              if (scannedTables.variantsHashTable[uniqueKey])
                variantsImportMap[localName] =
                  scannedTables.variantsHashTable[uniqueKey];
              if (scannedTables.createThemeHashTable[uniqueKey])
                createThemeImportMap[localName] =
                  scannedTables.createThemeHashTable[uniqueKey];
              if (scannedTables.createStaticHashTable[uniqueKey])
                createStaticImportMap[localName] =
                  scannedTables.createStaticHashTable[uniqueKey];
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

    const mergedCreateThemeHashTable: CreateThemeHashTable = {};
    for (const key of Object.keys(scannedTables.createThemeHashTable)) {
      mergedCreateThemeHashTable[key] = scannedTables.createThemeHashTable[key];
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

    const ctx: TraversalContext = {
      resourcePath,
      mergedStaticTable,
      mergedKeyframesTable,
      mergedViewTransitionTable,
      mergedCreateThemeHashTable,
      mergedCreateStaticHashTable,
      mergedCreateTable,
      mergedVariantsTable,
      scannedTables,
      createFunctionImportMap,
      localCreateStyles: {},
      sourceBuffer,
      baseByteOffset,
      localStyleAliases,
    };

    const componentParamNames = new Set<string>();
    const addFirstParamName = (fn: { params: unknown[] }) => {
      const first = fn.params[0] as any;
      const p = unwrapPatternDefault(first?.pat ?? first);
      if (t.isIdentifier(p)) {
        componentParamNames.add(p.value);
      } else if (p?.type === 'ObjectPattern') {
        for (const item of p.properties ?? []) {
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
    const ownerComponentOf = (at: HasSpan) =>
      components.find(
        (c) =>
          at.span.start >= c.node.span.start &&
          at.span.start <= c.node.span.end,
      )?.name;

    const processStyle = (style: CSSObject) => {
      extractOndemandStyles(style, extractedSheets, scannedTables);
      const records = getStyleRecords(style as CSSProperties);
      records.forEach((r: StyleRecord) => extractedSheets.push(r.sheet));
    };

    // Common processing for use() and styleProp={}
    const extractAndProcessConditionals = (
      args: Array<{ expression: Expression }>,
    ) => {
      args.forEach((arg) => {
        arg.expression = resolveLocalStyleAlias(
          localStyleAliases,
          arg.expression,
        );
      });

      const conditionals: Array<{
        test: Expression;
        testString?: string;
        testLHS?: string;
        truthy: CSSObject;
        falsy: CSSObject;
        varName: string | undefined;
      }> = [];
      let baseStyle: CSSObject = {};

      const resolveStyleObject = (expr: Expression): CSSObject | null => {
        expr = resolveLocalStyleAlias(
          localStyleAliases,
          unwrapExpression(expr),
        );
        if (expr.type === 'ArrayExpression') {
          let merged: CSSObject = {};
          for (const element of expr.elements ?? []) {
            if (!element) continue;
            if (element.spread)
              throw spreadStyleError(
                getSource(element.expression),
                path.basename(resourcePath),
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
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
        } else if (
          t.isMemberExpression(expr) &&
          t.isIdentifier(expr.object) &&
          (t.isIdentifier(expr.property) || expr.property.type === 'Computed')
        ) {
          const varName = expr.object.value;
          let propName: string;
          if (expr.property.type === 'Computed') {
            const keyExpr = expr.property.expression;
            if (!t.isStringLiteral(keyExpr)) return null;
            propName = keyExpr.value;
          } else {
            propName = expr.property.value;
          }
          const styleInfo = ctx.localCreateStyles[varName];
          if (styleInfo && styleInfo.type === 'create') {
            const style = styleInfo.obj[propName];
            if (typeof style === 'object' && style !== null) {
              return style as CSSObject;
            }
          }
          const hash = ctx.mergedCreateTable[varName];
          if (hash) {
            const obj = ctx.scannedTables.createObjectTable[hash];
            if (obj && obj[propName] && typeof obj[propName] === 'object') {
              return obj[propName] as CSSObject;
            }
          }
        } else if (t.isIdentifier(expr)) {
          const varName = expr.value;
          const styleInfo = ctx.localCreateStyles[varName];
          if (styleInfo && styleInfo.type === 'create') {
            return styleInfo.obj;
          }
          const hash = ctx.mergedCreateTable[varName];
          if (hash) {
            const obj = ctx.scannedTables.createObjectTable[hash];
            if (obj && typeof obj === 'object') {
              return obj;
            }
          }
        }
        return null;
      };

      const getSource = (node: Expression) =>
        sourceOf(node, ctx.sourceBuffer, ctx.baseByteOffset);

      const assertResolvable = (node: Expression): void => {
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
            (ctx.localCreateStyles[rootId] !== undefined ||
              ctx.mergedCreateTable[rootId] !== undefined ||
              ctx.mergedVariantsTable[rootId] !== undefined);
          if (!isPlumeriaStyle) {
            const origin = rootId ? localImports[rootId] : undefined;
            const failure = origin
              ? resolveFileError(origin.actualPath, origin.importedName)
              : undefined;
            throw new Error(
              failure
                ? `[plumeria] ${failure.message} (${path.basename(failure.filePath)})`
                : `[plumeria] Dynamic or unresolvable style object "${getSource(node)}" is not supported. (${path.basename(resourcePath)})`,
            );
          }
        }
      };

      // `s[k]` with a non-literal key. Every key is reachable at runtime, so
      // for CSS emission every key's style counts.
      const resolveBracketGroupStyles = (
        node: Expression,
      ): CSSObject[] | null => {
        if (
          !t.isMemberExpression(node) ||
          !t.isIdentifier(node.object) ||
          node.property.type !== 'Computed' ||
          t.isStringLiteral(node.property.expression)
        ) {
          return null;
        }
        const varName = node.object.value;
        const styleInfo = ctx.localCreateStyles[varName];
        let obj: CSSObject | undefined;
        if (styleInfo && styleInfo.type === 'create') {
          obj = styleInfo.obj;
        } else {
          const hash = ctx.mergedCreateTable[varName];
          if (hash) {
            obj = ctx.scannedTables.createObjectTable[hash] as CSSObject;
          }
        }
        if (!obj) return null;
        return Object.values(obj).filter(
          (v): v is CSSObject => typeof v === 'object' && v !== null,
        );
      };

      const resolveDynamicCall = (expr: Expression): CSSObject | null => {
        if (!t.isCallExpression(expr) || !t.isMemberExpression(expr.callee))
          return null;
        const callee = expr.callee;
        if (!t.isIdentifier(callee.object) || !t.isIdentifier(callee.property))
          return null;

        const styleInfo = ctx.localCreateStyles[callee.object.value];
        const func =
          styleInfo?.functions?.[callee.property.value] ??
          ctx.createFunctionImportMap[callee.object.value]?.[
            callee.property.value
          ];
        if (!func) return null;

        const callArgs = expr.arguments;
        if (callArgs.some((a) => a.spread)) return null;

        const tempStaticTable = { ...ctx.mergedStaticTable };
        const providedParams = new Set<string>();
        const runtime: string[] = [];
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
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );

        if (func.named) {
          const argExpr = callArgs[0]?.expression;
          if (
            callArgs.length > 1 ||
            (argExpr && argExpr.type !== 'ObjectExpression')
          ) {
            throw new Error(
              `[plumeria] ${getSource(expr)} takes one object argument, because ${
                callee.property.value
              } destructures its parameter.\n`,
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
              throw new Error(
                `[plumeria] ${getSource(expr)} leaves "${key}" unset, and a dynamic style function has no value to fall back on.\n`,
              );
            }
            if (isStaticArgValue(source) && argObj[key] !== undefined) {
              tempStaticTable[local] = argObj[key];
              providedParams.add(local);
            } else runtime.push(local);
          });
        } else if (
          callArgs.length === 1 &&
          callArgs[0].expression.type === 'ObjectExpression'
        ) {
          const argObj = resolveObjectArg(callArgs[0].expression) ?? {};
          func.params.forEach((p) => {
            if (argObj[p] !== undefined) {
              tempStaticTable[p] = argObj[p];
              providedParams.add(p);
            }
          });
        } else {
          callArgs.forEach((_callArg: any, i: number) => {
            const p = func.params[i];
            if (!p) return;
            runtime.push(p);
          });
        }

        const resolved = resolveDynamicStyle(
          func,
          runtime,
          tempStaticTable,
          dynamicTablesOf(ctx),
          providedParams,
        );
        if (!resolved) return null;
        const { style } = resolved;

        return style;
      };

      const collectPropStyles = (expr: Expression): boolean => {
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
          ctx.localCreateStyles[paramObject] === undefined &&
          ctx.mergedCreateTable[paramObject] === undefined,
        );

        const varName = t.isIdentifier(expr)
          ? expr.value
          : (expr.property as Identifier).value;
        const owner = ownerComponentOf(expr as HasSpan);
        const propName =
          (t.isIdentifier(expr) && owner
            ? propAliases.get(owner)?.get(varName)
            : undefined) ?? varName;
        const possibilities: any[] = [];
        if (owner) {
          const entries =
            ctx.scannedTables.componentPropsTable?.[
              `${resourcePath}-${owner}`
            ]?.[propName];
          if (entries) possibilities.push(...entries);
        }
        if (possibilities.length === 0) {
          const filePrefix = `${resourcePath}-`;
          for (const key of Object.keys(
            ctx.scannedTables.componentPropsTable || {},
          )) {
            if (!key.startsWith(filePrefix)) continue;
            const entries =
              ctx.scannedTables.componentPropsTable?.[key]?.[propName];
            if (entries) possibilities.push(...entries);
          }
        }
        const fallback = owner && propDefaults.get(owner)?.get(propName);
        if (fallback && !isNoOpStyle(unwrapExpression(fallback))) {
          const style = resolveStyleObject(fallback);
          if (!style)
            throw propDefaultError(
              getSource(fallback),
              path.basename(resourcePath),
            );
          processStyle(style);
        }
        if (possibilities.length > 0) {
          const uniqueEntries: any[] = [];
          possibilities.forEach((entry) => {
            if (!uniqueEntries.some((x) => x.key === entry.key)) {
              uniqueEntries.push(entry);
            }
          });
          uniqueEntries.forEach((entry) => {
            if (entry.styleObj && Object.keys(entry.styleObj).length > 0) {
              processStyle(entry.styleObj);
            }
          });
          return true;
        }
        if (fallback) return true;
        return Boolean(
          isPropsMember || (owner && declaredProps.get(owner)?.has(propName)),
        );
      };

      const collectConditions = (
        node: Expression,
        currentTestStrings: string[] = [],
      ): boolean => {
        node = resolveLocalStyleAlias(
          localStyleAliases,
          unwrapExpression(node),
        );
        if (node.type === 'ArrayExpression') {
          let handled = true;
          for (const element of node.elements ?? []) {
            if (!element) continue;
            if (element.spread)
              throw spreadStyleError(
                getSource(element.expression),
                path.basename(resourcePath),
              );
            handled =
              collectConditions(element.expression, currentTestStrings) &&
              handled;
          }
          return handled;
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
              });
              return true;
            }
          }
          collectConditions(node.consequent, [
            ...currentTestStrings,
            `(${testSource})`,
          ]);
          collectConditions(node.alternate, [
            ...currentTestStrings,
            `!(${testSource})`,
          ]);
          return true;
        } else if (node.type === 'BinaryExpression' && node.operator === '&&') {
          collectConditions(node.right, [
            ...currentTestStrings,
            `(${getSource(node.left)})`,
          ]);
          return true;
        } else if (node.type === 'ParenthesisExpression') {
          return collectConditions(node.expression, currentTestStrings);
        }

        if (collectPropStyles(node)) return true;

        const staticStyle =
          resolveStyleObject(node) ?? resolveDynamicCall(node);
        if (staticStyle) {
          if (currentTestStrings.length === 0) {
            baseStyle = deepMerge(baseStyle, staticStyle);
          } else {
            conditionals.push({
              test: node,
              testString: currentTestStrings.join(' && '),
              truthy: staticStyle,
              falsy: {},
              varName: undefined,
            });
          }
          return true;
        }

        // A group nested under a condition never reaches the fallback below,
        // because the enclosing conditional already reported itself handled.
        if (currentTestStrings.length > 0) {
          const groupStyles = resolveBracketGroupStyles(node);
          if (groupStyles) {
            groupStyles.forEach((style) =>
              conditionals.push({
                test: node,
                testString: currentTestStrings.join(' && '),
                truthy: style,
                falsy: {},
                varName: undefined,
              }),
            );
            return true;
          }
        }

        assertResolvable(node);
        return false;
      };

      for (const arg of args) {
        const expr = arg.expression;

        if (collectPropStyles(expr)) continue;

        const dynamicStyle = resolveDynamicCall(expr);
        if (dynamicStyle) {
          baseStyle = deepMerge(baseStyle, dynamicStyle);
          continue;
        }

        if (collectConditions(arg.expression)) continue;

        assertResolvable(expr);

        const extractedStyles = extractStylesFromExpression(
          arg.expression,
          ctx,
        );
        extractedStyles.forEach(processStyle);
      }

      if (Object.keys(baseStyle).length > 0) processStyle(baseStyle);
      for (const cond of conditionals) {
        if (cond.truthy && Object.keys(cond.truthy).length > 0)
          processStyle(cond.truthy);
        if (cond.falsy && Object.keys(cond.falsy).length > 0)
          processStyle(cond.falsy);
      }
    };

    const processedNodes = new WeakSet<CallExpression>();
    const processCall = (node: CallExpression) => {
      if (processedNodes.has(node)) return;
      processedNodes.add(node);
      const callee = node.callee;
      let propName: string | undefined;

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property)
      ) {
        const objectName = callee.object.value;
        const propertyName = callee.property.value;
        if (plumeriaAliases[objectName] === 'NAMESPACE')
          propName = propertyName;
      } else if (t.isIdentifier(callee)) {
        const originalName = plumeriaAliases[callee.value];
        if (originalName) propName = originalName;
      }

      if (propName) {
        const args = node.arguments;

        if (propName === 'use') {
          extractAndProcessConditionals(args);
        } else if (
          propName === 'keyframes' &&
          args.length > 0 &&
          t.isObjectExpression(args[0].expression)
        ) {
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          ctx.scannedTables.keyframesObjectTable[hash] = obj;
        } else if (
          propName === 'viewTransition' &&
          args.length > 0 &&
          t.isObjectExpression(args[0].expression)
        ) {
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          ctx.scannedTables.viewTransitionObjectTable[hash] = obj;
        } else if (
          propName === 'createTheme' &&
          args.length >= 2 &&
          t.isObjectExpression(args[1].expression)
        ) {
          const selectorExpr = args[0].expression;
          const selector = resolveThemeSelector(
            selectorExpr,
            ctx.mergedStaticTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
          );
          if (!selector) {
            throw new Error(
              `[plumeria] createTheme needs a selector it can read at build time. ` +
                `Pass a string literal such as ".dark", or a name this file declares as one. (${path.basename(resourcePath)})`,
            );
          }
          if (selector.startsWith('@') && !isAtRule(selector)) {
            throw new Error(
              `[plumeria] Unsupported at-rule: "${selector}". createTheme only supports ` +
                `nesting at-rules such as @media, @container, @supports, @layer, and @scope. (${path.basename(resourcePath)})`,
            );
          }
          const obj = objectExpressionToObject(
            args[1].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = themeHashOf(selector, obj);
          ctx.scannedTables.createThemeObjectTable[hash] = obj;
          if (ctx.scannedTables.createThemeSelectorTable) {
            ctx.scannedTables.createThemeSelectorTable[hash] = selector;
          }
        } else if (
          propName === 'createStatic' &&
          args.length > 0 &&
          t.isObjectExpression(args[0].expression)
        ) {
          const obj = objectExpressionToObject(
            args[0].expression as ObjectExpression,
            ctx.mergedStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(obj, 1, 8);
          ctx.scannedTables.createStaticObjectTable[hash] = obj;
        }
      }
    };

    const traverseInternal = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (t.isCallExpression(node)) processCall(node);
      for (const k in node)
        if (k !== 'span' && k !== 'loc') traverseInternal(node[k]);
    };

    // Pass 1: Register all style definitions (create/createTheme/keyframes/viewTransition)
    traverse(ast, {
      VariableDeclarator({ node }: { node: VariableDeclarator }) {
        if (t.isIdentifier(node.id) && node.init) {
          const init = unwrapExpression(node.init);
          if (t.isCallExpression(init)) {
            const callee = init.callee;
            let pName: string | undefined;

            if (
              t.isMemberExpression(callee) &&
              t.isIdentifier(callee.object) &&
              t.isIdentifier(callee.property)
            ) {
              if (plumeriaAliases[callee.object.value] === 'NAMESPACE')
                pName = callee.property.value;
            } else if (
              t.isIdentifier(callee) &&
              plumeriaAliases[callee.value]
            ) {
              pName = plumeriaAliases[callee.value];
            }

            const isTheme = pName === 'createTheme';
            const definitionArg =
              pName === 'createTheme'
                ? init.arguments[1]?.expression
                : init.arguments[0]?.expression;
            const unwrappedDefinitionArg = definitionArg
              ? unwrapExpression(definitionArg)
              : undefined;
            if (
              pName &&
              unwrappedDefinitionArg &&
              t.isObjectExpression(unwrappedDefinitionArg) &&
              ((!isTheme && init.arguments.length === 1) ||
                (isTheme && init.arguments.length >= 2))
            ) {
              const arg = unwrappedDefinitionArg as ObjectExpression;
              const resolveVariable = (name: string) =>
                ctx.localCreateStyles[name]?.obj ||
                (ctx.mergedCreateThemeHashTable[name]
                  ? ctx.scannedTables.createAtomicMapTable[
                      ctx.mergedCreateThemeHashTable[name]
                    ]
                  : undefined);

              if (pName === 'create') {
                const obj = objectExpressionToObject(
                  arg,
                  ctx.mergedStaticTable,
                  ctx.mergedKeyframesTable,
                  ctx.mergedViewTransitionTable,
                  ctx.mergedCreateThemeHashTable,
                  ctx.scannedTables.createThemeObjectTable,
                  ctx.mergedCreateTable,
                  ctx.mergedCreateStaticHashTable,
                  ctx.scannedTables.createStaticObjectTable,
                  ctx.mergedVariantsTable,
                  resolveVariable,
                );

                if (obj) {
                  const styleFunctions = styleFunctionsOf(arg);

                  ctx.localCreateStyles[node.id.value] = {
                    type: 'create',
                    obj,
                    functions: styleFunctions,
                  };
                }
              } else if (pName === 'createTheme') {
                const selectorExpr = init.arguments[0].expression;
                const selector = resolveThemeSelector(
                  selectorExpr,
                  ctx.mergedStaticTable,
                  ctx.mergedCreateStaticHashTable,
                  ctx.scannedTables.createStaticObjectTable,
                );
                if (!selector) {
                  throw new Error(
                    `[plumeria] createTheme needs a selector it can read at build time. ` +
                      `Pass a string literal such as ".dark", or a name this file declares as one. (${path.basename(resourcePath)})`,
                  );
                }
                if (selector.startsWith('@') && !isAtRule(selector)) {
                  throw new Error(
                    `[plumeria] Unsupported at-rule: "${selector}". createTheme only supports ` +
                      `nesting at-rules such as @media, @container, @supports, @layer, and @scope. (${path.basename(resourcePath)})`,
                  );
                }
                const obj = objectExpressionToObject(
                  arg,
                  ctx.mergedStaticTable,
                  ctx.mergedKeyframesTable,
                  ctx.mergedViewTransitionTable,
                  ctx.mergedCreateThemeHashTable,
                  ctx.scannedTables.createThemeObjectTable,
                  ctx.mergedCreateTable,
                  ctx.mergedCreateStaticHashTable,
                  ctx.scannedTables.createStaticObjectTable,
                  ctx.mergedVariantsTable,
                );
                const hash = themeHashOf(selector, obj);
                const uKey = `${resourcePath}-${node.id.value}`;
                ctx.scannedTables.createThemeHashTable[uKey] = hash;
                ctx.scannedTables.createThemeObjectTable[hash] = obj;
                if (ctx.scannedTables.createThemeSelectorTable) {
                  ctx.scannedTables.createThemeSelectorTable[hash] = selector;
                }
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
                ctx.scannedTables.createAtomicMapTable[hash] = themeHashMap;
                ctx.localCreateStyles[node.id.value] = {
                  type: 'create',
                  obj: ctx.scannedTables.createAtomicMapTable[hash],
                };
              } else if (pName === 'createStatic') {
                const obj = objectExpressionToObject(
                  arg,
                  ctx.mergedStaticTable,
                  ctx.mergedKeyframesTable,
                  ctx.mergedViewTransitionTable,
                  ctx.mergedCreateThemeHashTable,
                  ctx.scannedTables.createThemeObjectTable,
                  ctx.mergedCreateTable,
                  ctx.mergedCreateStaticHashTable,
                  ctx.scannedTables.createStaticObjectTable,
                  ctx.mergedVariantsTable,
                );
                if (obj) {
                  const hash = genBase36Hash(obj, 1, 8);
                  const uKey = `${resourcePath}-${node.id.value}`;
                  ctx.scannedTables.createStaticHashTable[uKey] = hash;
                  ctx.scannedTables.createStaticObjectTable[hash] = obj;
                  ctx.mergedCreateStaticHashTable[node.id.value] = hash;
                }
              }
            }
          } else if (
            t.isMemberExpression(init) &&
            t.isIdentifier(init.object)
          ) {
            const objName = init.object.value;
            if (
              ctx.localCreateStyles[objName] !== undefined ||
              ctx.mergedCreateTable[objName] !== undefined
            ) {
              (localStyleAliases[node.id.value] ??= []).push({
                expression: init,
                context: (node.id as Identifier & { ctxt: number }).ctxt,
              });
            }
          }
        }
      },
    });

    // Pass 2: Process usage sites (use()/styleProp) - all definitions are now registered
    traverse(ast, {
      VariableDeclarator({ node }: { node: VariableDeclarator }) {
        if (t.isIdentifier(node.id) && node.init) {
          traverseInternal(node.init);
        }
      },
      FunctionDeclaration({ node }: { node: FunctionDeclaration }) {
        if (node.identifier) traverseInternal(node.body);
      },
      CallExpression: (path) => {
        if (!processedNodes.has(path.node)) processCall(path.node);
      },
      JSXOpeningElement({ node }) {
        if (node.name.type === 'Identifier') {
          const tagName = node.name.value;
          if (tagName[0] !== tagName[0].toUpperCase()) return;
        } else if (node.name.type !== 'JSXMemberExpression') {
          return;
        }

        node.attributes.forEach((attr: JSXAttributeOrSpread) => {
          if (attr.type !== 'JSXAttribute') return;
          if (attr.name.type !== 'Identifier') return;
          if (attr.name.value === styleProp) return;

          const value = attr.value;
          if (!value || value.type !== 'JSXExpressionContainer') return;
          if (value.expression.type === 'JSXEmptyExpression') return;

          let expr: Expression = value.expression;
          expr = resolveLocalStyleAlias(localStyleAliases, expr);
          extractStylesFromExpression(expr, ctx).forEach(processStyle);
        });
      },
      JSXAttribute({ node }) {
        if (node.name.type !== 'Identifier') return;
        if (node.name.value !== styleProp) return;

        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
        if (node.value.expression.type === 'JSXEmptyExpression') return;

        const expr = node.value.expression;
        const args: Array<{ expression: Expression }> = [];
        const addArgs = (node: Expression) => {
          node = unwrapExpression(node);
          if (node.type === 'ArrayExpression') {
            for (const element of node.elements ?? []) {
              if (!element) continue;
              if (element.spread)
                throw spreadStyleError(
                  sourceOf(element.expression, sourceBuffer, baseByteOffset),
                  path.basename(resourcePath),
                );
              addArgs(element.expression);
            }
          } else {
            args.push({ expression: node });
          }
        };
        addArgs(expr);

        extractAndProcessConditionals(args);
      },
    });
    return extractedSheets;
  };

  for (const file of files) {
    const sheets = processFile(file);
    for (const sheet of sheets) {
      allSheets.add(sheet);
    }
  }

  return Array.from(allSheets).join('\n');
}
