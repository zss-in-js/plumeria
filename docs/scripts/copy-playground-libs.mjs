import { createRequire } from 'node:module';
import { mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = process.cwd();
const outDir = join(root, 'public', 'playground');

const tsLibDir = dirname(require.resolve('typescript/package.json')) + '/lib';
const coreLibDir = join(root, 'node_modules', '@plumeria', 'core', 'lib');

await rm(outDir, { recursive: true, force: true });
await mkdir(join(outDir, 'ts'), { recursive: true });
await mkdir(join(outDir, 'core'), { recursive: true });

const tsLibs = (await readdir(tsLibDir)).filter((name) => name.startsWith('lib.') && name.endsWith('.d.ts'));
for (const name of tsLibs) {
  await writeFile(join(outDir, 'ts', name), await readFile(join(tsLibDir, name)));
}

const coreLibs = (await readdir(coreLibDir)).filter((name) => name.endsWith('.d.ts'));
for (const name of coreLibs) {
  await writeFile(join(outDir, 'core', name), await readFile(join(coreLibDir, name)));
}

const reactTypesDir = await realpath(join(root, 'node_modules', '@types', 'react'));

const typePackages = {
  '@types/react': reactTypesDir,
  csstype: dirname(createRequire(join(reactTypesDir, 'package.json')).resolve('csstype/package.json')),
};

const typeFiles = {};

for (const [name, dir] of Object.entries(typePackages)) {
  const target = join(outDir, 'types', name);
  await mkdir(target, { recursive: true });

  const names = (await readdir(dir)).filter((entry) => entry.endsWith('.d.ts') || entry === 'package.json');

  for (const entry of names) {
    await writeFile(join(target, entry), await readFile(join(dir, entry)));
  }

  typeFiles[name] = names;
}

await writeFile(join(outDir, 'manifest.json'), JSON.stringify({ tsLibs, coreLibs, typeFiles }, null, 2) + '\n');

console.log(
  `[playground] ${tsLibs.length} ts libs, ${coreLibs.length} core libs, ${Object.keys(typeFiles).length} type packages`,
);
