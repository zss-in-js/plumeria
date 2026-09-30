import * as rust from '../index';
import * as ts from '@plumeria/utils';
import { createTheme as createThemeTs } from '../../utils/src/createTheme';

export type TransformEnv = rust.TransformEnv;
export type TransformOutput = { code: string; sheets: string[] };

export type Implementation = {
  name: 'rust' | 'ts';
  compileCSS: (options: rust.CompilerOptions) => string;
  transformSource: (env: TransformEnv) => Promise<TransformOutput>;
  optimizer: (cssCode: string) => Promise<string>;
  getStyleRecords: typeof rust.getStyleRecords;
  needsCompile: typeof rust.needsCompile;
  resolveExport: typeof rust.resolveExport;
  resolveExportValue: typeof rust.resolveExportValue;
  resolveImportPath: typeof rust.resolveImportPath;
  resolvePropertyPolicy: (
    options: rust.PropertyPolicyOptions,
  ) => rust.PropertyPolicyValue | undefined;
  createTheme: typeof rust.createTheme;
  themeHashOf: typeof rust.themeHashOf;
  scanAll: (cwd?: string, styleProp?: string) => unknown;
};

const inDirectory = async <T>(
  cwd: string | undefined,
  run: () => T | Promise<T>,
): Promise<T> => {
  if (cwd === undefined) return run();
  const spy = jest.spyOn(process, 'cwd').mockReturnValue(cwd);
  try {
    return await run();
  } finally {
    spy.mockRestore();
  }
};

export const implementations: Implementation[] = [
  {
    name: 'rust',
    compileCSS: (options) => rust.compileCSS(options),
    transformSource: async (env) => rust.transformSource(env),
    optimizer: async (cssCode) => rust.optimizer(cssCode),
    getStyleRecords: (rule, weights) => rust.getStyleRecords(rule, weights),
    needsCompile: (source, styleProp, filePath) =>
      rust.needsCompile(source, styleProp, filePath),
    resolveExport: (filePath, exportName) =>
      rust.resolveExport(filePath, exportName),
    resolveExportValue: (filePath, exportName) =>
      rust.resolveExportValue(filePath, exportName),
    resolveImportPath: (importPath, importer) =>
      rust.resolveImportPath(importPath, importer),
    resolvePropertyPolicy: (options) => rust.resolvePropertyPolicy(options),
    createTheme: (themeSelector, rule, themeHash) =>
      rust.createTheme(themeSelector, rule, themeHash),
    themeHashOf: (themeSelector, rule) => rust.themeHashOf(themeSelector, rule),
    scanAll: (cwd, styleProp) => rust.scanAll(cwd, styleProp),
  },
  {
    name: 'ts',
    compileCSS: (options) => ts.compileCSS(options),
    transformSource: ({ cwd, ...env }) =>
      inDirectory(cwd, () =>
        ts.transformSource({
          styleProp: ts.DEFAULT_STYLE_PROP,
          addDependency: () => {},
          ...env,
          propertyPolicy: env.propertyPolicy as never,
        }),
      ),
    optimizer: (cssCode) => ts.optimizer(cssCode),
    getStyleRecords: (rule, weights) =>
      ts.getStyleRecords(rule, weights ?? undefined),
    needsCompile: (source, styleProp, filePath) =>
      ts.needsCompile(source, styleProp, filePath),
    resolveExport: (filePath, exportName) =>
      ts.resolveExport(filePath, exportName),
    resolveExportValue: (filePath, exportName) =>
      ts.resolveExportValue(filePath, exportName),
    resolveImportPath: (importPath, importer) =>
      ts.resolveImportPath(importPath, importer),
    resolvePropertyPolicy: (options) => ts.resolvePropertyPolicy(options),
    createTheme: (themeSelector, rule, themeHash) =>
      createThemeTs(themeSelector, rule, themeHash),
    themeHashOf: (themeSelector, rule) => ts.themeHashOf(themeSelector, rule),
    scanAll: (cwd, styleProp) => ts.scanAll(cwd, styleProp),
  },
];
