const path = require('path');
const fs = require('fs');
const { unlinkSync, existsSync, readFileSync, statSync } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const { glob } = require('@rust-gear/glob');
const postcss = require('postcss');
const combineSelectors = require('postcss-combine-duplicated-selectors');
const combineMediaQuery = require('postcss-combine-media-query');
const { execute } = require('rscute/execute');
const { transform: lightningCSSTransform } = require('lightningcss');
const { parseSync } = require('@swc/core');
const { findUpSync } = require('find-up');
const { buildGlobal, buildProps } = require('@plumeria/core/dist/processors');
const {
  setCurrentlyExecutingFile,
  checkVarDuplications,
  clearVarDefinitions,
} = require('@plumeria/core/dist/checker');
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
const coreSourcePackageJsonPath = path.join(process.cwd(), 'package.json');
const coreSourcePackageJson = JSON.parse(
  fs.readFileSync(coreSourcePackageJsonPath, 'utf-8'),
);
const dependencies = {
  ...coreSourcePackageJson.dependencies,
  ...coreSourcePackageJson.devDependencies,
};
const coreVersion = dependencies['@plumeria/core'];
const resolvedCorePackageJsonPath = require.resolve(
  '@plumeria/core/package.json',
  {
    paths: [projectRoot, process.cwd()],
  },
);
if (workspaceRootFile) {
  if (coreVersion.includes('workspace')) {
    coreFilePath = path.join(
      path.dirname(resolvedCorePackageJsonPath),
      'stylesheet.css',
    );
  } else {
    const corePackageJson = JSON.parse(
      fs.readFileSync(resolvedCorePackageJsonPath, 'utf-8'),
    );
    const exactCoreVersion = corePackageJson.version;
    coreFilePath = path.join(
      projectRoot,
      'node_modules',
      '.pnpm',
      `@plumeria+core@${exactCoreVersion}`,
      'node_modules',
      '@plumeria',
      'core',
      'stylesheet.css',
    );
  }
} else {
  coreFilePath = path.join(
    path.dirname(resolvedCorePackageJsonPath),
    'stylesheet.css',
  );
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

function analyzeFileApis(filePath: string): {
  hasProps: boolean;
  hasGlobals: boolean;
} {
  if (statSync(filePath).isDirectory()) {
    return { hasProps: false, hasGlobals: false };
  }
  const code = readFileSync(filePath, 'utf8');
  const ast = parseSync(code, {
    syntax: 'typescript',
    tsx: filePath.endsWith('.tsx'),
    decorators: false,
    dynamicImport: true,
  });

  let hasProps = false;
  let hasGlobals = false;

  function visit(node: any) {
    if (hasProps && hasGlobals) return;

    if (node.type === 'MemberExpression' && node.property?.value) {
      if (node.object?.type === 'Identifier' && node.object.value === 'css') {
        const propertyValue = node.property.value;
        if (propertyValue === 'props') {
          hasProps = true;
        } else if (
          ['defineVars', 'defineTheme', 'keyframes'].includes(propertyValue)
        ) {
          hasGlobals = true;
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
  return { hasProps, hasGlobals };
}

async function optimizeCSS(): Promise<void> {
  const cssCode = await readFile(coreFilePath, 'utf8');
  const merged = postcss([
    combineMediaQuery(),
    combineSelectors({ removeDuplicatedProperties: true }),
  ]).process(cssCode, {
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
  clearVarDefinitions();
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

  const styleFiles: string[] = [];
  for (const file of filesSupportExtensions) {
    const { hasProps, hasGlobals } = analyzeFileApis(file);
    if (hasProps || hasGlobals) {
      styleFiles.push(file);
    }
  }
  styleFiles.sort();

  for (let i = 0; i < styleFiles.length; i++) {
    const filePath = path.resolve(styleFiles[i]);
    setCurrentlyExecutingFile(filePath);
    await execute(filePath);
    setCurrentlyExecutingFile(null);
    if (process.argv.includes('--paths'))
      console.log(
        `✅: ${projectName}/${path.relative(projectRoot, styleFiles[i])}`,
      );
  }

  checkVarDuplications(projectRoot);

  for (let i = 0; i < styleFiles.length; i++) {
    await buildGlobal(coreFilePath);
  }

  for (let i = 0; i < styleFiles.length; i++) {
    await buildProps(coreFilePath);
  }

  await optimizeCSS();
  await restoreAllOriginals();
})();
