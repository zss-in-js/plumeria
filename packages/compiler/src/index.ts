import * as path from 'path';
import * as fs from 'fs';
import { execute } from 'rscute';
import ts from 'typescript';
import fg from 'fast-glob';
import { buildCreate } from '@plumeria/core/dist/method/create-build-helper';
import { buildGlobal } from '@plumeria/core/dist/method/global-build-helper';

const cleanUp = async () => {
  const projectRoot = process.cwd().split('node_modules')[0];
  const directPath = path.join(projectRoot, 'node_modules/@plumeria/core');
  const coreFilePath = path.join(directPath, 'stylesheet/core.css');

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
    ignore: [
      '**/main.{js,ts}/**',
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
    ],
  });
  const styleFiles = files.filter(isCSS);
  for (let i = 0; i < styleFiles.length; i++) {
    await execute(path.resolve(styleFiles[i]));
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal();
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildCreate();
  }
})();
