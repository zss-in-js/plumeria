import path from 'path';
import { readFile, writeFile, unlink, access, glob } from 'fs/promises';
import postcss from 'postcss';
import combineMediaQuery from 'postcss-combine-media-query';
import { execute } from 'rscute/execute';
import { transform as lightningCSSTransform } from 'lightningcss';
import { parse } from '@swc/core';
import { findUp } from 'find-up';
import { buildGlobal, buildProps } from '@plumeria/core/processors';
import {
  extractTSFile,
  restoreAllOriginals,
  extractVueAndSvelte,
  generatedTsMap,
} from './extract';

async function generateStats(buildTime: number, coreFilePath: string) {
  const cssCode = await readFile(coreFilePath, 'utf8');
  const cssSize = Buffer.byteLength(cssCode, 'utf8');

  let rules = 0;
  const topProperties = new Map<string, number>();

  lightningCSSTransform({
    filename: coreFilePath,
    code: Buffer.from(cssCode),
    visitor: {
      Rule(rule) {
        if (rule.type === 'style') {
          rules++;
          rule.value.declarations.declarations.forEach((decl) => {
            if ('property' in decl) {
              topProperties.set(
                decl.property,
                (topProperties.get(decl.property) || 0) + 1,
              );
            }
          });
        }
      },
    },
  });

  const sortedTopProperties = [...topProperties.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  console.log('\n📦 Plumeria CSS Stats');
  console.log('────────────────────────────');
  console.log(`Total CSS size:           ${(cssSize / 1024).toFixed(3)} KB`);
  console.log(`Rules:                    ${rules}`);
  console.log('Top properties:');
  for (let i = 0; i < Math.min(5, sortedTopProperties.length); i++) {
    const [prop, count] = sortedTopProperties[i];
    console.log(`  - ${prop}: ${count}`);
  }
  console.log(`Build time:               ${buildTime.toFixed(2)}s`);
  console.log('────────────────────────────\n');
}

async function main() {
  let projectRoot;

  const workspaceRootFile = await findUp(async (directory: string) => {
    const pnpmWsPath = path.join(directory, 'pnpm-workspace.yaml');
    try {
      await access(pnpmWsPath); // Check if file exists asynchronously
      return pnpmWsPath;
    } catch {
      // ignore
    }

    const pkgJsonPath = path.join(directory, 'package.json');
    try {
      await access(pkgJsonPath);
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8')); // Read file asynchronously
      if (pkgJson.workspaces) {
        return pkgJsonPath;
      }
    } catch {
      // ignore
    }
    return undefined;
  });

  if (workspaceRootFile) {
    projectRoot = path.dirname(workspaceRootFile);
  } else {
    const singleProjectRootFile = await findUp('package.json');
    if (singleProjectRootFile) {
      projectRoot = path.dirname(singleProjectRootFile);
    } else {
      projectRoot = process.cwd();
    }
  }

  let coreFilePath: string;
  const coreSourcePackageJsonPath = path.join(process.cwd(), 'package.json');
  const coreSourcePackageJson = JSON.parse(
    await readFile(coreSourcePackageJsonPath, 'utf-8'),
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
        await readFile(resolvedCorePackageJsonPath, 'utf-8'),
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
    if (process.env.CI) {
      try {
        await access(coreFilePath); // Check if file exists
        await unlink(coreFilePath); // Delete file asynchronously
        console.log('File deleted successfully');
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          // Ignore file not found errors
          console.error(`Error deleting ${coreFilePath}:`, error);
        }
      }
    }
    try {
      await writeFile(coreFilePath, '', 'utf-8');
    } catch (err) {
      console.error('An error occurred:', err);
    }
  };

  async function isCSS(code: string, filePath: string) {
    if (!code.includes('css.props')) {
      return false;
    }

    const ast = await parse(code, {
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
    const startTime = performance.now();
    await cleanUp();

    const scanRoot = process.cwd();

    const files: string[] = [];
    for await (const entry of glob('**/*.{js,jsx,ts,tsx,vue,svelte}', {
      cwd: scanRoot,
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
      ],
    })) {
      files.push(entry);
    }

    const projectName = path.basename(projectRoot);

    const tempToOriginalMap = new Map<string, string>();

    const filesSupportExtensions = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file);
        let tempFile: string;
        if (ext === '.vue' || ext === '.svelte') {
          tempFile = await extractVueAndSvelte(file);
        } else {
          tempFile = await extractTSFile(file);
        }
        tempToOriginalMap.set(tempFile, file);
        return tempFile;
      }),
    );

    const styleFiles = await Promise.all(
      filesSupportExtensions.map(async (file) => {
        const originalFile = tempToOriginalMap.get(file)!;
        const code = generatedTsMap.get(originalFile);
        const isCssFile = code ? await isCSS(code, file) : false;
        return isCssFile ? file : null;
      }),
    )
      .then((results) => results.filter(Boolean) as string[])
      .then((results) => results.sort());

    for (const file of styleFiles) {
      const originalFile = tempToOriginalMap.get(file)!;
      const code = generatedTsMap.get(originalFile);

      if (code) {
        await writeFile(file, code, 'utf8');
        await execute(path.resolve(file));
        if (process.argv.includes('--paths')) {
          console.log(
            `✅: ${projectName}/${path.relative(projectRoot, originalFile)}`,
          );
        }
        await unlink(file);
      }
    }
    await buildGlobal(coreFilePath);
    await buildProps(coreFilePath);

    await optimizeCSS();
    await restoreAllOriginals();

    if (process.argv.includes('--stats')) {
      const endTime = performance.now();
      const buildTime = (endTime - startTime) / 1000;
      await generateStats(buildTime, coreFilePath);
    }
  })();
}

main();
