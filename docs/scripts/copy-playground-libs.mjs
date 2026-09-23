import { createRequire } from 'node:module';
import { mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = process.cwd();
const outDir = join(root, 'public', 'playground');

const tsLibDir = dirname(require.resolve('typescript/package.json')) + '/lib';
const coreLibDir = join(root, 'node_modules', '@plumeria', 'core', 'lib');
const coreDir = '/node_modules/@plumeria/core';

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const files = {};
const referenceLib = /\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/g;
const queue = [ts.getDefaultLibFileName({ target: ts.ScriptTarget.ES2022 })];

while (queue.length > 0) {
  const name = queue.pop();
  if (files[`/${name}`] !== undefined) continue;

  const text = await readFile(join(tsLibDir, name), 'utf8');
  files[`/${name}`] = text;

  for (const match of text.matchAll(referenceLib)) {
    queue.push(`lib.${match[1].toLowerCase()}.d.ts`);
  }
}

const tsLibCount = Object.keys(files).length;

const coreLibs = (await readdir(coreLibDir)).filter((name) => name.endsWith('.d.ts'));
for (const name of coreLibs) {
  files[`${coreDir}/lib/${name}`] = await readFile(join(coreLibDir, name), 'utf8');
}

const reactTypesDir = await realpath(join(root, 'node_modules', '@types', 'react'));

const typePackages = {
  '@types/react': reactTypesDir,
  csstype: dirname(createRequire(join(reactTypesDir, 'package.json')).resolve('csstype/package.json')),
};

for (const [name, dir] of Object.entries(typePackages)) {
  const names = (await readdir(dir)).filter((entry) => entry.endsWith('.d.ts') || entry === 'package.json');

  for (const entry of names) {
    files[`/node_modules/${name}/${entry}`] = await readFile(join(dir, entry), 'utf8');
  }
}

await writeFile(join(outDir, 'libs.json'), JSON.stringify(files));

console.log(
  `[playground] ${tsLibCount} ts libs, ${coreLibs.length} core libs, ${Object.keys(typePackages).length} type packages`,
);
