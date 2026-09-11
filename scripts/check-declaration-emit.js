const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// A package that exports a created style carries the style's type into its
// declaration file, and TypeScript has to have a name it can write there.
// Resolving `@plumeria/core` through node_modules is what makes the emit match
// a consumer's: reached by a path inside the repository, TypeScript writes a
// relative import that a consumer could never resolve, and the check passes
// while the published types do not.
const root = path.join(__dirname, '..');
const installed = path.join(root, 'test-e2e/site/node_modules');

const SOURCE = `import * as css from '@plumeria/core';

export const styles = css.create({
  base: {
    color: 'red',
  },
  hover: {
    ':hover': {
      color: 'blue',
    },
  },
  sized: (width: number) => ({
    width,
  }),
});

export const single = styles.base;
export const nested = styles.hover[':hover'];
export const dynamic = styles.sized(8);
export const list = [styles.base, false, [styles.hover]];
`;

const TSCONFIG = {
  compilerOptions: {
    module: 'nodenext',
    moduleResolution: 'nodenext',
    target: 'ES2022',
    strict: true,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
    types: [],
    outDir: './out',
  },
  files: ['style-exports.ts'],
};

if (!fs.existsSync(installed)) {
  console.error('✖ declaration emit: test-e2e/site/node_modules is missing');
  process.exit(1);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-declaration-'));
try {
  fs.symlinkSync(installed, path.join(work, 'node_modules'), 'dir');
  fs.writeFileSync(path.join(work, 'style-exports.ts'), SOURCE);
  fs.writeFileSync(
    path.join(work, 'tsconfig.json'),
    `${JSON.stringify(TSCONFIG, null, 2)}\n`,
  );
  execFileSync(
    process.execPath,
    [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'],
    { cwd: work, encoding: 'utf8', stdio: 'pipe' },
  );
  console.log('✔ declaration emit: every exported style type can be named.');
} catch (error) {
  if (typeof error.status !== 'number') throw error;
  const said = `${error.stdout ?? ''}`.trim().split('\n');
  console.error(
    `✖ declaration emit: a style type cannot be named from outside the package\n  ${said.join('\n  ')}`,
  );
  process.exit(1);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
