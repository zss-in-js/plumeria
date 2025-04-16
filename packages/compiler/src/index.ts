import * as path from 'path';
import * as fs from 'fs';
import ts from 'typescript';
import fg from 'fast-glob';
import { buildGlobal, buildCreate } from '@plumeria/core/build-helper';
import { JIT } from 'rscute';

const projectRoot = process.cwd().split('node_modules')[0];
const directPath = path.join(projectRoot, 'node_modules/@plumeria/core');
const coreFilePath = path.join(directPath, 'stylesheet/core.css');

const cleanUp = async () => {
  if (process.env.CI && fs.existsSync(coreFilePath)) {
    fs.unlinkSync(coreFilePath);
    console.log('File deleted successfully');
  }
  try {
    fs.writeFileSync(coreFilePath, '', 'utf-8');
  } catch (err) {
    console.error('An error occurred:', err);
  }
};

function isCSS(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );

  const checker = (node: ts.Node): boolean => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
      const expressionText = node.expression.getText(sourceFile);
      const methodName = node.name.getText(sourceFile);
      return (
        expressionText === 'css' && ['create', 'global'].includes(methodName)
      );
    }
    return ts.forEachChild(node, checker) || false;
  };

  return checker(sourceFile);
}

async function getAppRoot(): Promise<string> {
  const threeLevelsUp = path.join(process.cwd(), '../../../../..');
  return fs.existsSync(path.join(threeLevelsUp, 'node_modules/.pnpm'))
    ? path.join(process.cwd(), '../../../../../')
    : path.join(process.cwd(), '../../');
}

(async () => {
  await cleanUp();
  const appRoot = await getAppRoot();
  const files = await fg([path.join(appRoot, '**/*.{js,jsx,ts,tsx}')], {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  });
  const styleFiles = files.filter(isCSS);
  for (let i = 0; i < styleFiles.length; i++) {
    await JIT(path.resolve(styleFiles[i]));
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal(coreFilePath);
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildCreate(coreFilePath);
  }
})();
