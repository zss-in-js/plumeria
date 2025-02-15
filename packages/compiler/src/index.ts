import * as path from 'path';
import * as fs from 'fs';
import ts from 'typescript';
import fg from 'fast-glob';
import { cleanUp } from './clean-up';
import { buildCreate } from '@plumeria/core/dist/method/create-build-helper.js';
import { buildGlobal } from '@plumeria/core/dist/method/global-build-helper.js';
import postcss from 'postcss';
import combineSelectors from 'postcss-combine-duplicated-selectors';

function findUp(filename: string, startDir = __dirname) {
  let dir = path.resolve(startDir);

  while (true) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }

    const parentDir = path.dirname(dir);
    if (dir === parentDir) {
      return null;
    }

    dir = parentDir;
  }
}

function isCSS(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const checker = (node: ts.Node): boolean => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
      const expressionText = node.expression.getText(sourceFile);
      const methodName = node.name.getText(sourceFile);
      return expressionText === 'css' && ['create', 'global'].includes(methodName);
    }
    return ts.forEachChild(node, checker) || false;
  };

  return checker(sourceFile);
}

async function getAppRoot() {
  const packageJsonPath = findUp('package.json', __dirname);
  if (packageJsonPath) {
    return path.dirname(packageJsonPath);
  } else {
    throw new Error('Project root directory not found');
  }
}

async function optimizeCSS() {
  const corePath = path.dirname(require.resolve('@plumeria/core/package.json'));
  const cssPath = path.join(corePath, 'dist/styles/global.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const result = postcss([combineSelectors({ removeDuplicatedProperties: true })]).process(cssContent, {
    from: cssPath,
    to: cssPath,
  });
  fs.writeFileSync(cssPath, result.css);
}

(async () => {
  await cleanUp();
  const appRoot = await getAppRoot();
  const files = await fg([path.join(appRoot, '**/*.{js,jsx,ts,tsx}')], {
    ignore: ['**/main.{js,ts}/**', '**/dist/**', '**/.next/**', '**/node_modules/**'],
  });
  const styleFiles = files.filter(isCSS);
  const importPromises = styleFiles.map(styleFile => import(path.resolve(styleFile)));
  await Promise.all(importPromises);

  for (let i = 0; i < styleFiles.length; i++) {
    await buildCreate();
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal();
  }
  await optimizeCSS();
})();
