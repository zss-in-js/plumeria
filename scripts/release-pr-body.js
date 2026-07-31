const { execFileSync } = require('node:child_process');

const REF = process.env.RELEASE_REF || 'origin/changeset-release/main';

const git = (...args) =>
  execFileSync('git', args, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const read = (path) => {
  try {
    return git('show', `${REF}:${path}`);
  } catch {
    return null;
  }
};

const latestEntry = (changelog) => {
  if (!changelog) return null;
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => line.startsWith('## '));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
  return { version: lines[start].slice(3).trim(), body };
};

function main() {
  const dirs = git('ls-tree', '--name-only', REF, 'packages/')
    .trim()
    .split('\n')
    .filter(Boolean);

  const groups = new Map();

  for (const dir of dirs) {
    const manifest = read(`${dir}/package.json`);
    if (!manifest) continue;
    const { name, version, private: isPrivate } = JSON.parse(manifest);
    if (!name || isPrivate) continue;

    const entry = latestEntry(read(`${dir}/CHANGELOG.md`));
    if (!entry || entry.version !== version) continue;

    if (!groups.has(entry.body)) groups.set(entry.body, []);
    groups.get(entry.body).push(`${name}@${version}`);
  }

  if (groups.size === 0) {
    process.stderr.write('No release entries found; leaving the body alone.\n');
    process.exit(1);
  }

  const sorted = [...groups.entries()].sort(
    (a, b) => b[0].length - a[0].length,
  );

  const sections = sorted.map(
    ([body, packages]) =>
      `${packages.map((p) => `## ${p}`).join('\n')}\n\n${body}`,
  );

  process.stdout.write(
    [
      'This PR was opened by the [Changesets release](https://github.com/changesets/action) GitHub action.',
      "When you're ready to do a release, you can merge this and the packages will be published to npm automatically.",
      "If you're not ready to do a release yet, that's fine, whenever you add more changesets to main, this PR will be updated.",
      '',
      '# Releases',
      '',
      sections.join('\n\n'),
      '',
    ].join('\n'),
  );
}

main();
