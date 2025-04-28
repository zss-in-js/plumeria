const path = require('path');
const { unlinkSync, existsSync, readFileSync } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const fg = require('fast-glob');
const postcss = require('postcss');
const combineSelectors = require('postcss-combine-duplicated-selectors');
const { execute } = require('rscute/execute');
const { transform } = require('lightningcss');
const { parseSync } = require('@swc/core');
const { buildGlobal, buildCreate } = require('@plumeria/core/build-helper');

const projectRoot = process.cwd().split('node_modules')[0];
const directPath = path.join(projectRoot, 'node_modules/@plumeria/core');
const coreFilePath = path.join(directPath, 'stylesheet/core.css');

const cleanUp = async (): Promise<void> => {
  if (process.env.CI && existsSync(coreFilePath)) {
    unlinkSync(coreFilePath);
    console.log('File deleted successfully');
  }
  try {
    await writeFile(coreFilePath, '', 'utf-8');
  } catch (err) {
    console.error('An error occurred:', err);
  }
};

function isCSS(filePath: string): boolean {
  const code = readFileSync(filePath, 'utf8');
  const ast = parseSync(code, {
    syntax: 'typescript',
    tsx: filePath.endsWith('.tsx'),
    decorators: false,
    dynamicImport: true,
  });

  let found = false;

  function visit(node: any) {
    if (node.type === 'MemberExpression' && node.property?.value) {
      if (node.object?.type === 'Identifier' && node.object.value === 'css') {
        if (
          node.property.value === 'create' ||
          node.property.value === 'global'
        ) {
          found = true;
        }
      }
    }

    for (const key in node) {
      const value = node[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            visit(item);
          }
        } else {
          visit(value);
        }
      }
    }
  }

  visit(ast);

  return found;
}

async function optimizeCSS(): Promise<void> {
  const cssCode = await readFile(coreFilePath, 'utf8');
  const merged = postcss([
    combineSelectors({ removeDuplicatedProperties: true }),
  ]).process(cssCode, {
    from: coreFilePath,
    to: coreFilePath,
  });

  const light = transform({
    filename: coreFilePath,
    code: Buffer.from(merged.css),
    minify: true,
    targets: {
      safari: 16,
      edge: 110,
      firefox: 110,
      chrome: 110,
    },
  });
  const optimizedCss = Buffer.from(light.code).toString('utf-8');
  await writeFile(coreFilePath, optimizedCss, 'utf-8');
}

async function getAppRoot(): Promise<string> {
  const threeLevelsUp = path.join(process.cwd(), '../../../../..');
  return existsSync(path.join(threeLevelsUp, 'node_modules/.pnpm'))
    ? path.join(process.cwd(), '../../../../../')
    : path.join(process.cwd(), '../../');
}

(async () => {
  await cleanUp();
  const appRoot = await getAppRoot();
  const files: string[] = await fg(
    [path.join(appRoot, '**/*.{js,jsx,ts,tsx}')],
    {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    },
  );

  const styleFiles = files.filter(isCSS).sort();
  for (let i = 0; i < styleFiles.length; i++) {
    await execute(path.resolve(styleFiles[i]));
    if (process.argv.includes('--paths')) console.log(styleFiles[i]);
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal(coreFilePath);
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildCreate(coreFilePath);
  }
  await optimizeCSS();
})();
