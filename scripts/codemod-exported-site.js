const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Builds the e2e site as `migrate --from plumeria` leaves it, so Playwright can
// ask the browser whether the exported CSS still answers the way Plumeria did.
const SKIP = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'tsconfig.tsbuildinfo',
]);
const root = path.join(__dirname, '..');
const source = path.join(root, 'test-e2e/site');
const target = path.join(root, 'test-e2e/.migrated');

const copy = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const inner = path.join(from, entry.name);
    const outer = path.join(to, entry.name);
    if (entry.isDirectory()) copy(inner, outer);
    else if (entry.isFile()) fs.copyFileSync(inner, outer);
  }
};

fs.rmSync(target, { recursive: true, force: true });
copy(source, target);
fs.symlinkSync(
  path.join(source, 'node_modules'),
  path.join(target, 'node_modules'),
  'dir',
);

try {
  execFileSync(
    process.execPath,
    [
      path.join(root, 'packages/codemod/bin/codemod.js'),
      'migrate',
      '--from',
      'plumeria',
      '.',
    ],
    { cwd: target, stdio: 'pipe' },
  );
} catch (error) {
  // A style that cannot leave Plumeria is reported and left behind by design,
  // and the mixed tree it produces is exactly what has to keep working.
  if (typeof error.status !== 'number') throw error;
  console.log(`${error.stdout ?? ''}`.trim());
}

// Plumeria is gone, and so is the lint that used to run before the build.
const manifest = path.join(target, 'package.json');
const json = JSON.parse(fs.readFileSync(manifest, 'utf8'));
json.scripts.build = 'next build';
fs.writeFileSync(manifest, `${JSON.stringify(json, null, 2)}\n`);

console.log('✔ exported site ready at test-e2e/.migrated');
