import { parseSync } from '@swc/core';
import type {
  ObjectExpression,
  Expression,
  ImportSpecifier,
  CallExpression,
  MemberExpression,
  Identifier,
  ExprOrSpread,
  Statement,
  VariableDeclarator,
  FunctionDeclaration,
  HasSpan,
  JSXAttributeOrSpread,
} from '@swc/core';
import {
  type CSSProperties,
  genBase36Hash,
  camelToKebabCase,
  applyCssValue,
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
  getRootIdentifier,
  extractOndemandStyles,
  deepMerge,
  scanAll,
  resolveImportPath,
  resolveExport,
  themeHashOf,
  resolveThemeSelector,
  DEFAULT_STYLE_PROP,
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

interface CompilerOptions {
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
const namedParamsOf = (
  params: unknown[],
  defaults: Record<string, Expression>,
): NamedParam[] | undefined => {
  if (params.length !== 1) return undefined;
  const first = params[0] as { type?: string; pat?: { type?: string } };
  const pattern = (first?.pat ?? first) as {
    type?: string;
    properties?: any[];
  };
  if (pattern?.type !== 'ObjectPattern') return undefined;

  const named: NamedParam[] = [];
  for (const prop of pattern.properties ?? []) {
    if (prop.type === 'AssignmentPatternProperty' && t.isIdentifier(prop.key)) {
      named.push({ key: prop.key.value, local: prop.key.value });
      if (prop.value) defaults[prop.key.value] = prop.value as Expression;
    } else if (
      prop.type === 'KeyValuePatternProperty' &&
      t.isIdentifier(prop.key) &&
      t.isIdentifier(prop.value)
    ) {
      named.push({ key: prop.key.value, local: prop.value.value });
    } else if (
      prop.type === 'KeyValuePatternProperty' &&
      t.isIdentifier(prop.key) &&
      prop.value?.type === 'AssignmentPattern' &&
      t.isIdentifier(prop.value.left)
    ) {
      named.push({ key: String(prop.key.value), local: prop.value.left.value });
      defaults[prop.value.left.value] = prop.value.right;
    } else {
      return undefined;
    }
  }
  return named.length > 0 ? named : undefined;
};

interface TraversalContext {
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
  localStyleAliases?: Record<string, Expression>;
}

type StyleFunctions = NonNullable<
  TraversalContext['localCreateStyles'][string]['functions']
>;

const applyVarFallback = (
  style: CSSObject,
  cssVar: string,
  literal: string | number,
): boolean => {
  for (const [prop, value] of Object.entries(style)) {
    if (typeof value === 'string' && value.includes(cssVar)) {
      (style as Record<string, unknown>)[prop] =
        `var(${cssVar}, ${applyCssValue(literal, camelToKebabCase(prop))})`;
      return true;
    }
    if (value !== null && typeof value === 'object') {
      if (applyVarFallback(value as CSSObject, cssVar, literal)) return true;
    }
  }
  return false;
};

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

    const defaults: Record<string, Expression> = {};
    const params: string[] = func.params.map((p) => {
      const pattern = (
        typeof p === 'object' && p !== null && 'pat' in p ? p.pat : p
      ) as { type?: string; left?: Identifier; right?: Expression };
      if (t.isIdentifier(pattern)) return pattern.value;
      if (
        pattern?.type === 'AssignmentPattern' &&
        t.isIdentifier(pattern.left)
      ) {
        defaults[pattern.left.value] = pattern.right as Expression;
        return pattern.left.value;
      }
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
        named: namedParamsOf(func.params, defaults),
        defaults,
        body: actualBody as ObjectExpression,
      };
    }
  });
  return styleFunctions;
};

function extractStylesFromExpression(
  expression: Expression,
  ctx: TraversalContext,
): CSSObject[] {
  let expr = expression;
  if (
    ctx.localStyleAliases &&
    t.isIdentifier(expr) &&
    ctx.localStyleAliases[expr.value]
  ) {
    expr = ctx.localStyleAliases[expr.value];
  }

  const results: CSSObject[] = [];

  if (t.isObjectExpression(expr)) {
    const object = objectExpressionToObject(
      expr as ObjectExpression,
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
    if (object) results.push(object);
  } else if (t.isMemberExpression(expr)) {
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
  const allSheets = new Set<string>();

  const files = rs.globSync(include, {
    cwd,
    exclude: exclude,
    sort: true,
  });

  const scannedTables = scanAll();

  const processFile = (filePath: string): string[] => {
    const resourcePath = path.resolve(cwd, filePath);
    const source = fs.readFileSync(resourcePath, 'utf-8');
    const extractedSheets: string[] = [];

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
    const localStyleAliases: Record<string, Expression> = {};

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
      const p = fn.params[0];
      if (t.isIdentifier(p)) {
        componentParamNames.add(p.value);
      } else if (
        typeof p === 'object' &&
        p !== null &&
        'pat' in p &&
        t.isIdentifier(p.pat)
      ) {
        componentParamNames.add(p.pat.value);
      }
    };
    for (const node of ast.body) {
      const statement = unwrapExport(node);
      if (isFunctionNode(statement)) {
        addFirstParamName(statement);
      } else if (t.isVariableDeclaration(statement)) {
        for (const decl of statement.declarations) {
          if (!t.isIdentifier(decl.id) || !decl.init) continue;
          if (isFunctionNode(decl.init)) addFirstParamName(decl.init);
        }
      }
    }

    const components: Array<{ name: string; node: HasSpan }> = [];
    for (const node of ast.body) {
      const statement = unwrapExport(node);
      if (isFunctionNode(statement)) {
        components.push({
          name: statement.identifier?.value ?? 'default',
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
      isStyleProp: boolean = false,
    ) => {
      args.forEach((arg) => {
        if (
          t.isIdentifier(arg.expression) &&
          localStyleAliases[arg.expression.value]
        ) {
          arg.expression = localStyleAliases[arg.expression.value];
        }
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
        ctx.sourceBuffer
          .subarray(
            (node as HasSpan).span.start - ctx.baseByteOffset,
            (node as HasSpan).span.end - ctx.baseByteOffset,
          )
          .toString('utf-8');

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
            throw new Error(
              `[plumeria] Dynamic or unresolvable style object "${getSource(node)}" is not supported. (${path.basename(resourcePath)})`,
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
        const runtime: string[] = [];

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

          const argObj = !argExpr
            ? {}
            : (objectExpressionToObject(
                argExpr as ObjectExpression,
                ctx.mergedStaticTable,
                ctx.mergedKeyframesTable,
                ctx.mergedViewTransitionTable,
                ctx.mergedCreateThemeHashTable,
                ctx.scannedTables.createThemeObjectTable,
                ctx.mergedCreateTable,
                ctx.mergedCreateStaticHashTable,
                ctx.scannedTables.createStaticObjectTable,
                ctx.mergedVariantsTable,
              ) ?? {});

          func.named.forEach(({ key, local }) => {
            const source = given.get(key);
            if (!source) {
              if (func.defaults?.[local]) return;
              throw new Error(
                `[plumeria] ${getSource(expr)} leaves "${key}" unset, and a dynamic style function has no value to fall back on.\n`,
              );
            }
            if (isStaticArgValue(source) && argObj[key] !== undefined)
              tempStaticTable[local] = argObj[key];
            else runtime.push(local);
          });
        } else if (
          callArgs.length === 1 &&
          callArgs[0].expression.type === 'ObjectExpression'
        ) {
          const argObj = objectExpressionToObject(
            callArgs[0].expression,
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
          func.params.forEach((p) => {
            if (argObj[p] !== undefined) tempStaticTable[p] = argObj[p];
          });
        } else {
          callArgs.forEach((_callArg: any, i: number) => {
            const p = func.params[i];
            if (!p) return;
            runtime.push(p);
          });
        }

        const withDefault = Object.entries(func.defaults ?? {}).filter(
          ([param]) => tempStaticTable[param] === undefined,
        );
        const cssVars: Record<string, string> = {};
        const varParams = Array.from(
          new Set([...runtime, ...withDefault.map(([param]) => param)]),
        );

        if (varParams.length > 0) {
          varParams.forEach((p) => (tempStaticTable[p] = p));

          const probe = objectExpressionToObject(
            func.body,
            tempStaticTable,
            ctx.mergedKeyframesTable,
            ctx.mergedViewTransitionTable,
            ctx.mergedCreateThemeHashTable,
            ctx.scannedTables.createThemeObjectTable,
            ctx.mergedCreateTable,
            ctx.mergedCreateStaticHashTable,
            ctx.scannedTables.createStaticObjectTable,
            ctx.mergedVariantsTable,
          );
          const hash = genBase36Hash(probe ?? {}, 1, 8);

          varParams.forEach((p) => {
            const cssVar = `--${hash}-${p}`;
            tempStaticTable[p] = `var(${cssVar})`;
            cssVars[p] = cssVar;
          });
        }

        const style = objectExpressionToObject(
          func.body,
          tempStaticTable,
          ctx.mergedKeyframesTable,
          ctx.mergedViewTransitionTable,
          ctx.mergedCreateThemeHashTable,
          ctx.scannedTables.createThemeObjectTable,
          ctx.mergedCreateTable,
          ctx.mergedCreateStaticHashTable,
          ctx.scannedTables.createStaticObjectTable,
          ctx.mergedVariantsTable,
        );
        if (!style) return null;

        withDefault.forEach(([param, expr]) => {
          const cssVar = cssVars[param];
          if (!cssVar) return;
          const literal =
            expr.type === 'StringLiteral' || expr.type === 'NumericLiteral'
              ? expr.value
              : undefined;
          if (literal === undefined) return;
          applyVarFallback(style, cssVar, literal);
        });

        return style;
      };

      const collectConditions = (
        node: Expression,
        currentTestStrings: string[] = [],
      ): boolean => {
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

      const checkFunctionKey = (node: Expression): void => {
        if (isStyleProp) return;
        if (
          t.isCallExpression(node) &&
          t.isMemberExpression(node.callee) &&
          t.isIdentifier(node.callee.object) &&
          t.isIdentifier(node.callee.property)
        ) {
          const varName = node.callee.object.value;
          const propKey = node.callee.property.value;
          const styleInfo = ctx.localCreateStyles[varName];
          const atomMap = styleInfo?.obj[propKey];
          if (
            typeof atomMap === 'object' &&
            atomMap !== null &&
            '__cssVars__' in atomMap
          ) {
            throw new Error(
              `[plumeria] css.use(${getSource(node)}) cannot handle dynamic style functions. Use ${styleProp} instead.\n`,
            );
          }
        }
        if (node.type === 'ConditionalExpression') {
          checkFunctionKey(node.consequent);
          checkFunctionKey(node.alternate);
        } else if (
          node.type === 'BinaryExpression' &&
          ['&&', '||', '??'].includes(node.operator)
        ) {
          checkFunctionKey(node.left);
          checkFunctionKey(node.right);
        } else if (node.type === 'ParenthesisExpression') {
          checkFunctionKey(node.expression);
        } else if (node.type === 'ArrayExpression') {
          for (const el of node.elements) {
            if (el && el.expression) checkFunctionKey(el.expression);
          }
        }
      };

      for (const arg of args) {
        checkFunctionKey(arg.expression);
        const expr = arg.expression;

        if (
          t.isIdentifier(expr) ||
          (t.isMemberExpression(expr) &&
            t.isIdentifier(expr.object) &&
            componentParamNames.has(expr.object.value) &&
            t.isIdentifier(expr.property))
        ) {
          const varName = t.isIdentifier(expr)
            ? expr.value
            : (expr.property as Identifier).value;

          const owner = ownerComponentOf(expr as HasSpan);
          const propPossibilities: any[] = [];
          if (owner) {
            const entries =
              ctx.scannedTables.componentPropsTable?.[
                `${resourcePath}-${owner}`
              ]?.[varName];
            if (entries) propPossibilities.push(...entries);
          }
          if (propPossibilities.length === 0) {
            const filePrefix = `${resourcePath}-`;
            for (const key of Object.keys(
              ctx.scannedTables.componentPropsTable || {},
            )) {
              if (!key.startsWith(filePrefix)) continue;
              const entries =
                ctx.scannedTables.componentPropsTable?.[key]?.[varName];
              if (entries) propPossibilities.push(...entries);
            }
          }

          if (propPossibilities.length > 0) {
            const uniqueEntries: any[] = [];
            propPossibilities.forEach((entry) => {
              if (!uniqueEntries.some((x) => x.key === entry.key)) {
                uniqueEntries.push(entry);
              }
            });

            uniqueEntries.forEach((entry) => {
              if (entry.styleObj && Object.keys(entry.styleObj).length > 0) {
                processStyle(entry.styleObj);
              }
            });
            continue;
          }
        }

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
          extractAndProcessConditionals(args, false);
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
          const init = node.init;
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
            if (
              pName &&
              init.arguments.length > 0 &&
              ((!isTheme &&
                init.arguments.length === 1 &&
                t.isObjectExpression(init.arguments[0].expression)) ||
                (isTheme &&
                  init.arguments.length >= 2 &&
                  t.isObjectExpression(init.arguments[1].expression)))
            ) {
              const arg = isTheme
                ? (init.arguments[1].expression as ObjectExpression)
                : (init.arguments[0].expression as ObjectExpression);
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
              localStyleAliases[node.id.value] = init;
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
          if (t.isIdentifier(expr) && localStyleAliases[expr.value]) {
            expr = localStyleAliases[expr.value];
          }
          extractStylesFromExpression(expr, ctx).forEach(processStyle);
        });
      },
      JSXAttribute({ node }) {
        if (node.name.type !== 'Identifier') return;
        if (node.name.value !== styleProp) return;

        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
        if (node.value.expression.type === 'JSXEmptyExpression') return;

        const expr = node.value.expression;
        const args =
          expr.type === 'ArrayExpression'
            ? expr.elements
                .filter((el: ExprOrSpread) => el !== undefined)
                .map((el: ExprOrSpread) => ({ expression: el.expression }))
            : [{ expression: expr }];

        extractAndProcessConditionals(args, true);
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
