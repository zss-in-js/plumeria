import path from 'path';
import { unlinkSync, existsSync, readFileSync, statSync, globSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import postcss from 'postcss';
import combineMediaQuery from 'postcss-combine-media-query';
import { execute } from 'rscute/execute';
import { transform as lightningCSSTransform } from 'lightningcss';
import { parseSync } from '@swc/core';
import { findUpSync } from 'find-up';
import { buildGlobal, buildProps } from '@plumeria/core/processors';
import {
  extractTSFile,
  restoreAllOriginals,
  extractVueAndSvelte,
} from './extract';

let projectRoot;

const workspaceRootFile = findUpSync((directory: string) => {
  const pnpmWsPath = path.join(directory, 'pnpm-workspace.yaml');
  if (existsSync(pnpmWsPath)) {
    return pnpmWsPath;
  }

  const pkgJsonPath = path.join(directory, 'package.json');
  if (existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
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
  readFileSync(coreSourcePackageJsonPath, 'utf-8'),
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
      readFileSync(resolvedCorePackageJsonPath, 'utf-8'),
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

function isCSS(filePath: string) {
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
        if (node.property.value === 'props') {
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

  const files = globSync('**/*.{js,jsx,ts,tsx,vue,svelte}', {
    cwd: scanRoot,
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
    .filter((file) => isCSS(file))
    .sort();

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

  for (let i = 0; i < styleFiles.length; i++) {
    await buildProps(coreFilePath);
  }

  await optimizeCSS();
  await restoreAllOriginals();
})();
