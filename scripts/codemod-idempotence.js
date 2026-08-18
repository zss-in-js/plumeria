const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SKIP = new Set(['node_modules', '.next', '.source', '.turbo', 'dist']);
const root = path.join(__dirname, '..');
const cli = path.join(root, 'packages/codemod/bin/codemod.js');
const project = process.argv[2] ?? 'docs';

const copy = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copy(source, target);
    else if (entry.isFile()) fs.copyFileSync(source, target);
  }
};

const snapshot = (dir) => {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile())
        files.push([path.relative(dir, full), fs.readFileSync(full, 'utf8')]);
    }
  };
  walk(dir);
  return new Map(files.sort(([a], [b]) => a.localeCompare(b)));
};

const migrate = (dir) => {
  try {
    execFileSync(
      process.execPath,
      [cli, 'migrate', '--from', 'plumeria', '.'],
      {
        cwd: dir,
        stdio: 'pipe',
      },
    );
  } catch (error) {
    // A run that leaves styles behind exits 1 and still has to be stable.
    if (typeof error.status !== 'number') throw error;
  }
};

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'codemod-idempotence-'));
try {
  copy(path.join(root, project), work);
  migrate(work);
  const first = snapshot(work);
  migrate(work);
  const second = snapshot(work);

  const drifted = [];
  for (const [name, content] of second) {
    if (!first.has(name)) drifted.push(`added: ${name}`);
    else if (first.get(name) !== content) drifted.push(`changed: ${name}`);
  }
  for (const name of first.keys())
    if (!second.has(name)) drifted.push(`removed: ${name}`);

  if (drifted.length > 0) {
    console.error(
      `✖ the second migration of ${project} was not a no-op:\n  ${drifted.join('\n  ')}`,
    );
    process.exit(1);
  }
  console.log(
    `✔ ${project}: the second migration changed nothing across ${first.size} files.`,
  );
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
