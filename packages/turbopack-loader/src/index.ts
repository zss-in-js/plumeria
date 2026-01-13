/* eslint-disable @plumeria/validate-values */
import { parseSync } from '@swc/core';
import type {
  Declaration,
  Expression,
  ImportSpecifier,
  ObjectExpression,
  Identifier,
} from '@swc/core';
import fs from 'fs';
import path from 'path';
import { genBase36Hash } from 'zss-engine';
import type { CSSProperties } from 'zss-engine';

import {
  traverse,
  getStyleRecords,
  collectLocalConsts,
  objectExpressionToObject,
  t,
  extractOndemandStyles,
  deepMerge,
  scanAll,
  resolveImportPath,
} from '@plumeria/utils';
import type {
  StyleRecord,
  StaticTable,
  KeyframesHashTable,
  ViewTransitionHashTable,
  CreateHashTable,
  VariantsHashTable,
  CreateThemeHashTable,
  CreateStaticHashTable,
} from '@plumeria/utils';

interface LoaderContext {
  resourcePath: string;
  context: string;
  rootContext: string;
  async: () => (err: Error | null, content?: string) => void;
  addDependency: (path: string) => void;
  clearDependencies: () => void;
}

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
if (process.env.NODE_ENV === 'production') {
  fs.writeFileSync(VIRTUAL_FILE_PATH, '/** Placeholder file */', 'utf-8');
}

export default async function loader(this: LoaderContext, source: string) {
  const callback = this.async();
  const isProduction = process.env.NODE_ENV === 'production';

  if (
    this.resourcePath.includes('node_modules') ||
    !source.includes('@plumeria/core')
  ) {
    return callback(null, source);
  }

  this.clearDependencies();
  this.addDependency(this.resourcePath);
  const ast = parseSync(source, {
    syntax: 'typescript',
    tsx: true,
    target: 'es2022',
  });

  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const sourcePath = node.source.value;
      const actualPath = resolveImportPath(sourcePath, this.resourcePath);
      if (actualPath) {
        this.addDependency(actualPath);
      }
    }
  }

  const scannedTables = scanAll();

  const localConsts = collectLocalConsts(ast);
  const resourcePath = this.resourcePath;
  const importMap: Record<string, any> = {};
  const createThemeImportMap: Record<string, any> = {};
  const createStaticImportMap: Record<string, any> = {};
  const plumeriaAliases: Record<string, string> = {};

  traverse(ast, {
    ImportDeclaration({ node }) {
      const sourcePath = node.source.value;

      if (sourcePath === '@plumeria/core') {
        node.specifiers.forEach((specifier: any) => {
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
          if (specifier.type === 'ImportSpecifier') {
            const importedName = specifier.imported
              ? specifier.imported.value
              : specifier.local.value;
            const localName = specifier.local.value;
            const uniqueKey = `${actualPath}-${importedName}`;

            if (scannedTables.staticTable[uniqueKey]) {
              importMap[localName] = scannedTables.staticTable[uniqueKey];
            }
            if (scannedTables.keyframesHashTable[uniqueKey]) {
              importMap[localName] =
                scannedTables.keyframesHashTable[uniqueKey];
            }
            if (scannedTables.viewTransitionHashTable[uniqueKey]) {
              importMap[localName] =
                scannedTables.viewTransitionHashTable[uniqueKey];
            }
            if (scannedTables.createHashTable[uniqueKey]) {
              importMap[localName] = scannedTables.createHashTable[uniqueKey];
            }
            if (scannedTables.variantsHashTable[uniqueKey]) {
              importMap[localName] = scannedTables.variantsHashTable[uniqueKey];
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
  }
  for (const key of Object.keys(importMap)) {
    mergedKeyframesTable[key] = importMap[key];
  }

  const mergedViewTransitionTable: ViewTransitionHashTable = {};
  for (const key of Object.keys(scannedTables.viewTransitionHashTable)) {
    mergedViewTransitionTable[key] = scannedTables.viewTransitionHashTable[key];
  }
  for (const key of Object.keys(importMap)) {
    mergedViewTransitionTable[key] = importMap[key];
  }

  const mergedCreateTable: CreateHashTable = {};
  for (const key of Object.keys(scannedTables.createHashTable)) {
    mergedCreateTable[key] = scannedTables.createHashTable[key];
  }
  for (const key of Object.keys(importMap)) {
    mergedCreateTable[key] = importMap[key];
  }

  const mergedVariantsTable: VariantsHashTable = {};
  for (const key of Object.keys(scannedTables.variantsHashTable)) {
    mergedVariantsTable[key] = scannedTables.variantsHashTable[key];
  }
  for (const key of Object.keys(importMap)) {
    mergedVariantsTable[key] = importMap[key];
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
    mergedCreateStaticHashTable[key] = scannedTables.createStaticHashTable[key];
    if (key.startsWith(`${resourcePath}-`)) {
      const varName = key.slice(resourcePath.length + 1);
      mergedCreateStaticHashTable[varName] =
        scannedTables.createStaticHashTable[key];
    }
  }
  for (const key of Object.keys(createStaticImportMap)) {
    mergedCreateStaticHashTable[key] = createStaticImportMap[key];
  }

  const localCreateStyles: Record<
    string,
    {
      name: string;
      type: 'create' | 'constant' | 'variant';
      obj: Record<string, any>;
      hashMap: Record<string, Record<string, string>>;
      isExported: boolean;
      initSpan: { start: number; end: number };
      declSpan: { start: number; end: number };
    }
  > = {};

  const replacements: Array<{ start: number; end: number; content: string }> =
    [];
  const extractedSheets: string[] = [];
  const addSheet = (sheet: string) => {
    if (!extractedSheets.includes(sheet)) {
      extractedSheets.push(sheet);
    }
  };
  const processedDecls = new Set<any>();
  const idSpans = new Set<number>();
  const excludedSpans = new Set<number>();
  if (scannedTables.extractedSheet) {
    addSheet(scannedTables.extractedSheet);
  }

  const checkVariantAssignment = (decl: any) => {
    if (
      decl.init &&
      t.isCallExpression(decl.init) &&
      t.isIdentifier(decl.init.callee)
    ) {
      const varName = decl.init.callee.value;
      if (
        (localCreateStyles[varName] &&
          localCreateStyles[varName].type === 'variant') ||
        mergedVariantsTable[varName]
      ) {
        throw new Error(
          `Plumeria: Assigning the return value of "css.variants" to a variable is not supported.\nPlease pass the variant function directly to "css.props". Found assignment to: ${
            t.isIdentifier(decl.id) ? decl.id.value : 'unknown'
          }`,
        );
      }
    }
  };

  const registerStyle = (node: any, declSpan: any, isExported: boolean) => {
    let propName: string | undefined;

    if (
      t.isIdentifier(node.id) &&
      node.init &&
      t.isCallExpression(node.init) &&
      node.init.arguments.length >= 1
    ) {
      const callee = node.init.callee;

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property)
      ) {
        const objectName = callee.object.value;
        const propertyName = callee.property.value;
        const alias = plumeriaAliases[objectName];

        if (alias === 'NAMESPACE' || objectName === 'css') {
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

    if (propName) {
      if (
        propName === 'create' &&
        t.isObjectExpression(node.init.arguments[0].expression)
      ) {
        const obj = objectExpressionToObject(
          node.init.arguments[0].expression as ObjectExpression,
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
            const records = getStyleRecords(key, style as CSSProperties, 2);
            if (!isProduction) {
              extractOndemandStyles(style, extractedSheets, scannedTables);
              records.forEach((r: StyleRecord) => {
                addSheet(r.sheet);
              });
            }
            const atomMap: Record<string, string> = {};
            records.forEach((r) => (atomMap[r.key] = r.hash));
            hashMap[key] = atomMap;
          });

          if (t.isIdentifier(node.id)) {
            idSpans.add(node.id.span.start);
          }

          localCreateStyles[node.id.value] = {
            name: node.id.value,
            type: 'create',
            obj,
            hashMap,
            isExported,
            initSpan: {
              start: node.init.span.start - ast.span.start,
              end: node.init.span.end - ast.span.start,
            },
            declSpan: {
              start: declSpan.start - ast.span.start,
              end: declSpan.end - ast.span.start,
            },
          };
        }
      } else if (
        propName === 'variants' &&
        t.isObjectExpression(node.init.arguments[0].expression)
      ) {
        if (t.isIdentifier(node.id)) {
          idSpans.add(node.id.span.start);
        }
        const obj = objectExpressionToObject(
          node.init.arguments[0].expression as ObjectExpression,
          mergedStaticTable,
          mergedKeyframesTable,
          mergedViewTransitionTable,
          mergedCreateThemeHashTable,
          scannedTables.createThemeObjectTable,
          mergedCreateTable,
          mergedCreateStaticHashTable,
          scannedTables.createStaticObjectTable,
          mergedVariantsTable,
          (name: string) => {
            if (localCreateStyles[name]) {
              return localCreateStyles[name].obj;
            }
            if (mergedCreateTable[name]) {
              const hash = mergedCreateTable[name];
              if (scannedTables.createObjectTable[hash]) {
                return scannedTables.createObjectTable[hash];
              }
            }
            return undefined;
          },
        );
        localCreateStyles[node.id.value] = {
          name: node.id.value,
          type: 'variant',
          obj,
          hashMap: {},
          isExported,
          initSpan: {
            start: node.init.span.start - ast.span.start,
            end: node.init.span.end - ast.span.start,
          },
          declSpan: {
            start: declSpan.start - ast.span.start,
            end: declSpan.end - ast.span.start,
          },
        };
      } else if (
        propName === 'createTheme' &&
        t.isObjectExpression(node.init.arguments[0].expression)
      ) {
        if (t.isIdentifier(node.id)) {
          idSpans.add(node.id.span.start);
        }

        const obj = objectExpressionToObject(
          node.init.arguments[0].expression as ObjectExpression,
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
        const uniqueKey = `${resourcePath}-${node.id.value}`;

        scannedTables.createThemeHashTable[uniqueKey] = hash;
        scannedTables.createThemeObjectTable[hash] = obj;

        localCreateStyles[node.id.value] = {
          name: node.id.value,
          type: 'constant',
          obj,
          hashMap: scannedTables.createAtomicMapTable[hash],
          isExported,
          initSpan: {
            start: node.init.span.start - ast.span.start,
            end: node.init.span.end - ast.span.start,
          },
          declSpan: {
            start: declSpan.start - ast.span.start,
            end: declSpan.end - ast.span.start,
          },
        };
      }
    }
  };

  traverse(ast, {
    ImportDeclaration({ node }) {
      if (node.specifiers) {
        node.specifiers.forEach((specifier: any) => {
          if (specifier.local) {
            excludedSpans.add(specifier.local.span.start);
          }
          if (specifier.imported) {
            excludedSpans.add(specifier.imported.span.start);
          }
        });
      }
    },
    ExportDeclaration({ node }) {
      if (t.isVariableDeclaration(node.declaration)) {
        processedDecls.add(node.declaration);
        node.declaration.declarations.forEach((decl: Declaration) => {
          checkVariantAssignment(decl);
          registerStyle(decl, node.span, true);
        });
      }
    },
    VariableDeclaration({ node }) {
      if (processedDecls.has(node)) return;
      node.declarations.forEach((decl: Declaration) => {
        checkVariantAssignment(decl);
        registerStyle(decl, node.span, false);
      });
    },

    CallExpression({ node }) {
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

        if (alias === 'NAMESPACE' || objectName === 'css') {
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

        if (
          propName === 'keyframes' &&
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
          scannedTables.keyframesObjectTable[hash] = obj;
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(`kf-${hash}`),
          });
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
          if (!isProduction) {
            extractOndemandStyles(
              { vt: `vt-${hash}` },
              extractedSheets,
              scannedTables,
            );
          }
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(`vt-${hash}`),
          });
        } else if (
          (propName === 'createTheme' || propName === 'createStatic') &&
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
          if (propName === 'createTheme') {
            scannedTables.createThemeObjectTable[hash] = obj;
          } else {
            scannedTables.createStaticObjectTable[hash] = obj;
          }
          const prefix = propName === 'createTheme' ? 'tm-' : 'st-';
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(`${prefix}${hash}`),
          });
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
          Object.entries(obj).forEach(([key, style]) => {
            if (typeof style === 'object' && style !== null) {
              const records = getStyleRecords(key, style as CSSProperties, 2);
              if (!isProduction) {
                extractOndemandStyles(style, extractedSheets, scannedTables);
                records.forEach((r: StyleRecord) => addSheet(r.sheet));
              }
            }
          });
        }
      }
    },
  });

  // Pass 2: Confirm reference replacement
  traverse(ast, {
    MemberExpression({ node }) {
      if (t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
        const varName = node.object.value;
        const propName = node.property.value;
        const uniqueKey = `${resourcePath}-${varName}`;

        // Prioritize scanAll tables for local variables
        let hash = scannedTables.createHashTable[uniqueKey];
        if (!hash) {
          hash = mergedCreateTable[varName];
        }

        if (hash) {
          let atomMap: Record<string, any> | undefined;

          // Check atomic map first
          if (scannedTables.createAtomicMapTable[hash]) {
            atomMap = scannedTables.createAtomicMapTable[hash][propName];
          }

          if (atomMap) {
            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(atomMap),
            });
          }
        }

        // Check createTheme using atomic map
        let themeHash = scannedTables.createThemeHashTable[uniqueKey];
        if (!themeHash) {
          themeHash = mergedCreateThemeHashTable[varName];
        }

        if (themeHash) {
          // Use createAtomicMapTable for consistency with parser
          const atomicMap = scannedTables.createAtomicMapTable[themeHash];
          if (atomicMap && atomicMap && atomicMap[propName]) {
            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(atomicMap[propName]),
            });
          }
        }

        // Check createStatic
        let staticHash = scannedTables.createStaticHashTable[uniqueKey];
        if (!staticHash) {
          staticHash = mergedCreateStaticHashTable[varName];
        }

        if (staticHash) {
          const staticObj = scannedTables.createStaticObjectTable[staticHash];
          if (staticObj && staticObj[propName] !== undefined) {
            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(staticObj[propName]),
            });
          }
        }
      }
    },
    Identifier({ node }) {
      if (excludedSpans.has(node.span.start)) return;
      if (idSpans.has(node.span.start)) return;

      const styleInfo = localCreateStyles[node.value];
      if (styleInfo) {
        replacements.push({
          start: node.span.start - ast.span.start,
          end: node.span.end - ast.span.start,
          content: JSON.stringify(styleInfo.hashMap),
        });
        return;
      }

      const varName = node.value;
      const uniqueKey = `${resourcePath}-${varName}`;

      let hash = scannedTables.createHashTable[uniqueKey];
      if (!hash) {
        hash = mergedCreateTable[varName];
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

          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(hashMap),
          });
        }
      }

      // Check createTheme using atomic map
      let themeHash = scannedTables.createThemeHashTable[uniqueKey];
      if (!themeHash) {
        themeHash = mergedCreateThemeHashTable[varName];
      }

      if (themeHash) {
        // Use createAtomicMapTable to get resolved CSS variables
        const atomicMap = scannedTables.createAtomicMapTable[themeHash];
        if (atomicMap) {
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(atomicMap),
          });
          return;
        }
      }

      // Check createStatic
      let staticHash = scannedTables.createStaticHashTable[uniqueKey];
      if (!staticHash) {
        staticHash = mergedCreateStaticHashTable[varName];
      }

      if (staticHash) {
        const staticObj = scannedTables.createStaticObjectTable[staticHash];
        if (staticObj) {
          replacements.push({
            start: node.span.start - ast.span.start,
            end: node.span.end - ast.span.start,
            content: JSON.stringify(staticObj),
          });
        }
      }
    },
    CallExpression({ node }) {
      const callee = node.callee;
      let isPropsCall = false;

      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object) &&
        t.isIdentifier(callee.property)
      ) {
        const objectName = callee.object.value;
        const propertyName = callee.property.value;
        const alias = plumeriaAliases[objectName];
        if (
          (alias === 'NAMESPACE' || objectName === 'css') &&
          propertyName === 'props'
        ) {
          isPropsCall = true;
        }
      } else if (t.isIdentifier(callee)) {
        const calleeName = callee.value;
        const originalName = plumeriaAliases[calleeName];
        if (originalName === 'props') {
          isPropsCall = true;
        }
      }

      if (isPropsCall) {
        const args = node.arguments;

        const resolveStyleObject = (
          expr: Expression,
        ): Record<string, any> | null => {
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
            t.isIdentifier((expr as any).object) &&
            (t.isIdentifier((expr as any).property) ||
              (expr as any).property.type === 'Computed')
          ) {
            if ((expr as any).property.type === 'Computed') {
              // Ignore bracket notation for complete staticization
              return {};
            }
            const varName = ((expr as any).object as Identifier).value;
            const propName = ((expr as any).property as Identifier).value;

            const styleInfo = localCreateStyles[varName];
            if (styleInfo && styleInfo.obj[propName]) {
              const style = styleInfo.obj[propName];
              if (typeof style === 'object' && style !== null) {
                return style;
              }
            }

            const hash = mergedCreateTable[varName];
            if (hash) {
              const obj = scannedTables.createObjectTable[hash];
              if (obj && obj[propName]) {
                const style = obj[propName];
                if (typeof style === 'object' && style !== null) {
                  return style as Record<string, any>;
                }
              }
            }
          } else if (t.isIdentifier(expr)) {
            const varName = (expr as Identifier).value;
            const uniqueKey = `${this.resourcePath}-${varName}`;

            let hash = scannedTables.createHashTable[uniqueKey];
            if (!hash) {
              hash = mergedCreateTable[varName];
            }

            if (hash) {
              const obj = scannedTables.createObjectTable[hash];
              if (obj && typeof obj === 'object') {
                return obj;
              }
            }

            const styleInfo = localCreateStyles[varName];
            if (styleInfo && styleInfo.obj) {
              return styleInfo.obj;
            }

            if (localCreateStyles[varName]) {
              return localCreateStyles[varName].obj;
            }
            const vHash = mergedVariantsTable[varName];
            if (vHash) {
              return scannedTables.variantsObjectTable[vHash];
            }
          }
          return null;
        };

        const conditionals: Array<{
          test: Expression;
          testString?: string;
          truthy: Record<string, any>;
          falsy: Record<string, any>;
          groupId?: number;
        }> = [];

        let groupIdCounter = 0;

        let baseStyle: Record<string, any> = {};
        let isOptimizable = true;

        for (const arg of args) {
          const expr = arg.expression;

          if (t.isCallExpression(expr) && t.isIdentifier(expr.callee)) {
            const varName = expr.callee.value;
            let variantObj: Record<string, any> | undefined;
            const uniqueKey = `${this.resourcePath}-${varName}`;

            let hash = scannedTables.variantsHashTable[uniqueKey];
            if (!hash) {
              hash = mergedVariantsTable[varName];
            }

            if (hash && scannedTables.variantsObjectTable[hash]) {
              variantObj = scannedTables.variantsObjectTable[hash];
            }

            if (!variantObj) {
              if (
                localCreateStyles[varName] &&
                localCreateStyles[varName].obj
              ) {
                variantObj = localCreateStyles[varName].obj;
              }
            }

            if (variantObj) {
              const callArgs = expr.arguments;
              if (callArgs.length === 1 && !callArgs[0].spread) {
                const arg = callArgs[0].expression;
                if (arg.type === 'ObjectExpression') {
                  for (const prop of arg.properties) {
                    let groupName: string | undefined;
                    let valExpr: any;

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
                      const valStart =
                        (valExpr as any).span.start - ast.span.start;
                      const valEnd = (valExpr as any).span.end - ast.span.start;
                      const valSource = source.substring(valStart, valEnd);

                      // Static optimization
                      if (valExpr.type === 'StringLiteral') {
                        if (groupVariants[valExpr.value]) {
                          baseStyle = deepMerge(
                            baseStyle,
                            groupVariants[valExpr.value],
                          );
                        }
                        continue;
                      }

                      // Dynamic selection
                      Object.entries(
                        groupVariants as Record<string, any>,
                      ).forEach(([optionName, style]) => {
                        conditionals.push({
                          test: valExpr,
                          testString: `${valSource} === '${optionName}'`,
                          truthy: style as Record<string, any>,
                          falsy: {},
                          groupId: currentGroupId,
                        });
                      });
                    }
                  }
                  continue;
                }
                const argStart = (arg as any).span.start - ast.span.start;
                const argEnd = (arg as any).span.end - ast.span.start;
                const argSource = source.substring(argStart, argEnd);

                if (t.isStringLiteral(arg)) {
                  if (variantObj[arg.value]) {
                    baseStyle = deepMerge(baseStyle, variantObj[arg.value]);
                  }
                  continue;
                }

                const currentGroupId = ++groupIdCounter;
                Object.entries(variantObj).forEach(([key, style]) => {
                  conditionals.push({
                    test: arg,
                    testString: `${argSource} === '${key}'`,
                    truthy: style,
                    falsy: {},
                    groupId: currentGroupId,
                  });
                });
                continue;
              }

              // Fallback if arguments are complex (e.g. spread)
              isOptimizable = false;
              break;
            }
          }

          const staticStyle = resolveStyleObject(expr);
          if (staticStyle) {
            baseStyle = deepMerge(baseStyle, staticStyle);
            continue;
          } else if (expr.type === 'ConditionalExpression') {
            const truthyStyle = resolveStyleObject(expr.consequent);
            const falsyStyle = resolveStyleObject(expr.alternate);

            if (truthyStyle !== null && falsyStyle !== null) {
              conditionals.push({
                test: expr.test,
                truthy: truthyStyle,
                falsy: falsyStyle,
              });
              continue;
            }
          } else if (
            expr.type === 'BinaryExpression' &&
            expr.operator === '&&'
          ) {
            const truthyStyle = resolveStyleObject(expr.right);
            if (truthyStyle !== null) {
              conditionals.push({
                test: expr.left,
                truthy: truthyStyle,
                falsy: {},
              });
              continue;
            }
          } else if (expr.type === 'ParenthesisExpression') {
            const inner = expr.expression;
            const innerStatic = resolveStyleObject(inner);
            if (innerStatic) {
              baseStyle = deepMerge(baseStyle, innerStatic);
              continue;
            }
          }

          isOptimizable = false;
          break;
        }

        if (
          isOptimizable &&
          (args.length > 0 || Object.keys(baseStyle).length > 0)
        ) {
          if (conditionals.length === 0) {
            if (!isProduction) {
              extractOndemandStyles(baseStyle, extractedSheets, scannedTables);
            }
            const hash = genBase36Hash(baseStyle, 1, 8);
            const records = getStyleRecords(hash, baseStyle, 2);
            if (!isProduction) {
              records.forEach((r: StyleRecord) => addSheet(r.sheet));
            }
            const className = records.map((r: StyleRecord) => r.hash).join(' ');

            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: JSON.stringify(className),
            });
          } else {
            const table: Record<number, string> = {};
            const combinations = 1 << conditionals.length;

            for (let i = 0; i < combinations; i++) {
              let currentStyle = { ...baseStyle };
              const seenGroups = new Set<number>();
              let impossible = false;

              for (let j = 0; j < conditionals.length; j++) {
                if ((i >> j) & 1) {
                  // Truthy case
                  if (conditionals[j].groupId !== undefined) {
                    if (seenGroups.has(conditionals[j].groupId!)) {
                      impossible = true;
                      break;
                    }
                    seenGroups.add(conditionals[j].groupId!);
                  }
                  currentStyle = deepMerge(
                    currentStyle,
                    conditionals[j].truthy,
                  );
                } else {
                  // Falsy case
                  currentStyle = deepMerge(currentStyle, conditionals[j].falsy);
                }
              }

              if (impossible) {
                table[i] = '';
                continue;
              }

              if (process.env.NODE_ENV !== 'production') {
                extractOndemandStyles(
                  currentStyle,
                  extractedSheets,
                  scannedTables,
                );
              }
              const hash = genBase36Hash(currentStyle, 1, 8);
              const records = getStyleRecords(hash, currentStyle, 2);
              if (process.env.NODE_ENV !== 'production') {
                records.forEach((r: StyleRecord) =>
                  extractedSheets.push(r.sheet),
                );
              }
              const className = records
                .map((r: StyleRecord) => r.hash)
                .join(' ');

              table[i] = className;
            }

            // Generate index expression
            // (!!cond0 << 0) | (!!cond1 << 1) ...
            let indexExpr = '';
            if (conditionals.length === 0) {
              indexExpr = '0';
            } else {
              const parts = conditionals.map((c, idx) => {
                if (c.testString) {
                  return `(!!(${c.testString}) << ${idx})`;
                }
                const start = (c.test as any).span.start - ast.span.start;
                const end = (c.test as any).span.end - ast.span.start;
                const testStr = source.substring(start, end);
                return `(!!(${testStr}) << ${idx})`;
              });
              indexExpr = parts.join(' | ');
            }

            const tableStr = JSON.stringify(table);
            const replacement = `${tableStr}[${indexExpr}]`;

            replacements.push({
              start: node.span.start - ast.span.start,
              end: node.span.end - ast.span.start,
              content: replacement,
            });
          }
        }
      }
    },
  });

  // Confirm the replacement of the styles declaration
  Object.values(localCreateStyles).forEach((info) => {
    if (info.type === 'constant' || info.type === 'variant') {
      return;
    }
    if (info.isExported) {
      replacements.push({
        start: info.declSpan.start,
        end: info.declSpan.end,
        content: JSON.stringify(''),
      });
    } else {
      replacements.push({
        start: info.declSpan.start,
        end: info.declSpan.end,
        content: '',
      });
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

  const VIRTUAL_CSS_PATH = require.resolve(VIRTUAL_FILE_PATH);

  function stringifyRequest(loaderContext: LoaderContext, request: string) {
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

  const virtualCssRequest = stringifyRequest(this, `${VIRTUAL_CSS_PATH}`);
  const postfix = `\nimport ${virtualCssRequest};`;

  if (process.env.NODE_ENV === 'production')
    return callback(null, transformedSource);

  if (extractedSheets.length > 0 && process.env.NODE_ENV === 'development') {
    let currentContent = '';
    try {
      currentContent = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
    } catch (e) {
      // Ignore
    }

    const newContent = extractedSheets
      .filter((sheet) => !currentContent.includes(sheet))
      .join('');

    if (newContent) {
      fs.appendFileSync(VIRTUAL_FILE_PATH, newContent, 'utf-8');
    }
  }

  return callback(null, transformedSource + postfix);
}
