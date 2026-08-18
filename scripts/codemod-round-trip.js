const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SKIP = new Set([
  'node_modules',
  '.next',
  '.source',
  '.turbo',
  'dist',
  'tsconfig.tsbuildinfo',
]);
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

const migrate = (dir, from) => {
  try {
    execFileSync(process.execPath, [cli, 'migrate', '--from', from, '.'], {
      cwd: dir,
      stdio: 'pipe',
    });
  } catch (error) {
    // A run that leaves styles behind exits 1 and still has to be stable.
    if (typeof error.status !== 'number') throw error;
  }
};

// Line numbers move when the migration retires an import, so an error is
// counted by what it says, not by where it sits.
const typeErrors = (dir) => {
  fs.rmSync(path.join(dir, 'tsconfig.tsbuildinfo'), { force: true });
  let output = '';
  try {
    output = execFileSync(
      process.execPath,
      [
        require.resolve('typescript/bin/tsc'),
        '--noEmit',
        '-p',
        'tsconfig.json',
      ],
      { cwd: dir, encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (error) {
    if (typeof error.status !== 'number') throw error;
    output = `${error.stdout ?? ''}`;
  }
  const counted = new Map();
  for (const line of output.split('\n')) {
    const match = /^(\S+?)\(\d+,\d+\): (error TS\d+: .*)$/.exec(line);
    if (!match) continue;
    const key = `${match[1]}: ${match[2]}`;
    counted.set(key, (counted.get(key) ?? 0) + 1);
  }
  return counted;
};

// A `*.module.css` import is typed loosely, so a class name that does not exist
// reaches the browser rather than the compiler.
const danglingClasses = (dir) => {
  const sheets = new Map();
  const sources = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.module.css'))
        sheets.set(
          fs.realpathSync(full),
          // Anywhere, not just at the start of a line: a class nested in an
          // at-rule is indented, and over-collecting only weakens the check.
          new Set(
            [
              ...fs.readFileSync(full, 'utf8').matchAll(/\.([A-Za-z_][\w-]*)/g),
            ].map((match) => match[1]),
          ),
        );
      else if (/\.[jt]sx?$/.test(entry.name)) sources.push(full);
    }
  };
  walk(dir);

  const dangling = [];
  for (const source of sources) {
    // Import paths carry dots of their own, so they are read for the binding
    // and then kept out of the reference scan.
    const whole = fs.readFileSync(source, 'utf8');
    // A template with nothing interpolated into it is a code sample, not code.
    const text = whole
      .replace(/^\s*import .*$/gm, '')
      .replace(/`[^`]*`/g, (literal) =>
        literal.includes('${') ? literal : '',
      );
    for (const [, local, specifier] of whole.matchAll(
      /import\s+(\w+)\s+from\s+'([^']+\.module\.css)'/g,
    )) {
      const sheet = path.resolve(path.dirname(source), specifier);
      const names = fs.existsSync(sheet)
        ? sheets.get(fs.realpathSync(sheet))
        : undefined;
      if (!names) {
        dangling.push(`${path.relative(dir, source)}: ${specifier} is missing`);
        continue;
      }
      for (const [, key] of text.matchAll(
        new RegExp(`\\b${local}\\.([A-Za-z_$][\\w$]*)`, 'g'),
      ))
        if (!names.has(key))
          dangling.push(
            `${path.relative(dir, source)}: ${local}.${key} is not in ${specifier}`,
          );
    }
  }
  return dangling;
};

const regressions = (before, after) => {
  const grown = [];
  for (const [error, count] of after)
    if (count > (before.get(error) ?? 0)) grown.push(error);
  return grown;
};

const fail = (message, detail) => {
  console.error(`\u2716 ${project}: ${message}\n  ${detail.join('\n  ')}`);
  process.exit(1);
};

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'codemod-idempotence-'));
try {
  const source = path.join(root, project);
  copy(source, work);
  // The copy has to resolve what the project resolves — `next-env.d.ts` is
  // where a Next app learns that `*.module.css` has a type at all.
  const installed = path.join(source, 'node_modules');
  if (fs.existsSync(installed))
    fs.symlinkSync(installed, path.join(work, 'node_modules'), 'dir');
  const baseline = typeErrors(work);

  // Exported once, the project still has to compile.
  migrate(work, 'plumeria');
  const first = snapshot(work);
  const exported = regressions(baseline, typeErrors(work));
  if (exported.length > 0) fail('the export left errors behind', exported);
  const dangling = danglingClasses(work);
  if (dangling.length > 0)
    fail('the export named classes it did not write', dangling);

  // Exported twice, nothing moves: f(f(x)) = f(x).
  migrate(work, 'plumeria');
  const second = snapshot(work);
  const drifted = [];
  for (const [name, content] of second) {
    if (!first.has(name)) drifted.push(`added: ${name}`);
    else if (first.get(name) !== content) drifted.push(`changed: ${name}`);
  }
  for (const name of first.keys())
    if (!second.has(name)) drifted.push(`removed: ${name}`);
  if (drifted.length > 0) fail('the second migration was not a no-op', drifted);

  // Adopted back, it still compiles. The reverse is not asked to reproduce the
  // original source, only to leave a project that builds.
  migrate(work, 'css-modules');
  const adopted = regressions(baseline, typeErrors(work));
  if (adopted.length > 0) fail('the round trip left errors behind', adopted);

  console.log(
    `\u2714 ${project}: exported, re-exported unchanged, and adopted back across ${first.size} files.`,
  );
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
