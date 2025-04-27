import * as path from 'path';
import { unlinkSync, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import fg from 'fast-glob';
import postcss from 'postcss';
import combineSelectors from 'postcss-combine-duplicated-selectors';
import { transform } from 'lightningcss';
import { parseSync } from '@swc/core';
import { buildGlobal, buildCreate } from '@plumeria/core/build-helper';

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

async function isCSS(filePath: string): Promise<boolean> {
  const code = await readFile(filePath, 'utf8');
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
          value.forEach(visit);
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
  const files = await fg([path.join(appRoot, '**/*.{js,jsx,ts,tsx}')], {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  });

  const results = await Promise.all(files.map((file) => isCSS(file)));
  const styleFiles = files.filter((_, i) => results[i]);

  for (let i = 0; i < styleFiles.length; i++) {
    await import(path.resolve(styleFiles[i]));
    if (process.argv.includes('--paths')) console.log(styleFiles[i]);
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal(coreFilePath);
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildCreate(coreFilePath);
    await new Promise((resolve) => setImmediate(resolve));
  }
  await optimizeCSS();
})();
