const path = require('path');
const fs = require('fs');
const { unlinkSync, existsSync, readFileSync, statSync } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const { glob } = require('@rust-gear/glob');
const postcss = require('postcss');
const combineMediaQuery = require('postcss-combine-media-query');
const { execute } = require('rscute/execute');
const { transform: lightningCSSTransform } = require('lightningcss');
const { parseSync } = require('@swc/core');
const { findUpSync } = require('find-up');
const { buildGlobal, buildProps } = require('@plumeria/core/processors');
const {
  extractTSFile,
  restoreAllOriginals,
  extractVueAndSvelte,
} = require('./extract');

let projectRoot;

const workspaceRootFile = findUpSync((directory: string) => {
  const pnpmWsPath = path.join(directory, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWsPath)) {
    return pnpmWsPath;
  }

  const pkgJsonPath = path.join(directory, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (pkgJson.workspaces) {
        return pkgJsonPath;
      }
    } catch (err) {
      console.error(err);
    }
  }
  return undefined;
});

if (workspaceRootFile) {
  projectRoot = path.dirname(workspaceRootFile);
} else {
  const singleProjectRootFile = findUpSync('package.json');
  if (singleProjectRootFile) {
    projectRoot = path.dirname(singleProjectRootFile);
  } else {
    projectRoot = process.cwd();
  }
}

let coreFilePath: string;

try {
  const corePackageJsonPath = require.resolve('@plumeria/core/package.json', {
    paths: [projectRoot, process.cwd()],
  });
  coreFilePath = path.join(path.dirname(corePackageJsonPath), 'stylesheet.css');
} catch (error) {
  console.error(
    'Could not find "@plumeria/core/stylesheet.css". Please make sure it is installed.' +
      error,
  );
  process.exit(1);
}

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

function isCSS(filePath: string, target: string) {
  if (statSync(filePath).isDirectory()) {
    return false;
  }
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
        if (target === 'props') {
          if (node.property.value === 'props') {
            found = true;
          }
        } else if (
          node.property.value === 'props' ||
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
  const merged = postcss([combineMediaQuery()]).process(cssCode, {
    from: coreFilePath,
    to: coreFilePath,
  });

  const light = lightningCSSTransform({
    filename: coreFilePath,
    code: Buffer.from(merged.css),
    minify: process.env.NODE_ENV === 'production',
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

(async () => {
  await cleanUp();

  const scanRoot = process.cwd();

  const files = await glob('**/*.{js,jsx,ts,tsx,vue,svelte}', {
    cwd: scanRoot,
    absolute: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  });

  const projectName = path.basename(projectRoot);

  const filesSupportExtensions: string[] = [];
  for (const file of files) {
    const ext = path.extname(file);
    if (ext === '.vue' || ext === '.svelte') {
      const tsFile = await extractVueAndSvelte(file);
      filesSupportExtensions.push(tsFile);
    } else {
      const tempFile = await extractTSFile(file);
      filesSupportExtensions.push(tempFile);
    }
  }

  const styleFiles = filesSupportExtensions
    .filter((file) => isCSS(file, ''))
    .sort();

  const propsFiles = styleFiles.filter((file) => {
    return isCSS(file, 'props');
  });

  for (let i = 0; i < styleFiles.length; i++) {
    await execute(path.resolve(styleFiles[i]));
    if (process.argv.includes('--paths'))
      console.log(
        `✅: ${projectName}/${path.relative(projectRoot, styleFiles[i])}`,
      );
  }
  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal(coreFilePath);
  }

  for (let i = 0; i < propsFiles.length; i++) {
    await buildProps(coreFilePath);
  }

  await optimizeCSS();
  await restoreAllOriginals();
})();
