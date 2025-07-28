const path = require('path');
const { unlinkSync, existsSync, readFileSync, statSync } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const { glob } = require('@rust-gear/glob');
const postcss = require('postcss');
const combineSelectors = require('postcss-combine-duplicated-selectors');
const combineMediaQuery = require('postcss-combine-media-query');
const { execute } = require('rscute/execute');
const { transform } = require('lightningcss');
const { parseSync } = require('@swc/core');
const { buildGlobal, buildProps } = require('@plumeria/core/processors');
const {
  extractAndInjectStyleProps,
  restoreAllOriginals,
  extractVueAndSvelte,
} = require('./extract');

const projectRoot = process.cwd().split('node_modules')[0];
const directPath = path.join(projectRoot, 'node_modules/@plumeria/core');
const coreFilePath = path.join(directPath, 'stylesheet.css');

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
  const merged = postcss([
    combineMediaQuery(),
    combineSelectors({ removeDuplicatedProperties: true }),
  ]).process(cssCode, {
    from: coreFilePath,
    to: coreFilePath,
  });

  const light = transform({
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
  const files = await glob(
    path.join(projectRoot, '**/*.{js,jsx,ts,tsx,vue,svelte}'),
    {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
      ],
      cwd: projectRoot,
    },
  );

  // paths arguments display project root folder
  const projectName = path.basename(projectRoot);

  // Supports other React frameworks
  const filesSupportExtensions: string[] = [];
  for (const file of files) {
    const tsFile = await extractVueAndSvelte(file);
    filesSupportExtensions.push(tsFile);
  }

  const styleFiles = filesSupportExtensions
    .filter((file) => isCSS(file, ''))
    .sort();

  const cssPropsFiles = styleFiles.filter((file) => {
    // Check if it's a .ts file and has a corresponding .vue or .svelte file
    if (file.endsWith('.ts')) {
      const vueFile = file.replace('.ts', '.vue');
      const svelteFile = file.replace('.ts', '.svelte');
      const isGeneratedFromVue = existsSync(vueFile);
      const isGeneratedFromSvelte = existsSync(svelteFile);

      // Exclude if it is a generated file
      if (isGeneratedFromVue || isGeneratedFromSvelte) {
        return false;
      }
    }
    return isCSS(file, 'props');
  });

  for (let i = 0; i < cssPropsFiles.length; i++) {
    await extractAndInjectStyleProps(path.resolve(cssPropsFiles[i]));
  }

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
