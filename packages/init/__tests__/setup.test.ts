import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detect } from '../src/detect';
import {
  DEFAULT_ANSWERS,
  compilerOption,
  declarationSource,
  plan,
  spellingRule,
} from '../src/setup';
import type { Action, Answers } from '../src/setup';

const add = (dir: string, name: string, content: string) => {
  const file = path.join(dir, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};

const answers = (fields: Partial<Answers> = {}): Answers => ({
  ...DEFAULT_ANSWERS,
  ...fields,
});

const on = (actions: Action[], file: string): Action => {
  const action = actions.find((a) => a.kind !== 'install' && a.file === file);
  if (!action) throw new Error(`nothing planned for ${file}`);
  return action;
};

const contentsOf = (action: Action): string => {
  if (action.kind !== 'write' && action.kind !== 'patch') {
    throw new Error(`${action.kind} carries no contents`);
  }
  return action.contents;
};

const NEXT_CONFIG = `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

describe('the spelling answer', () => {
  it('rejects the counterpart on both sides', () => {
    expect(compilerOption(answers({ spelling: 'logical' }))).toBe(
      'withoutPhysicalProperties: true',
    );
    expect(spellingRule(answers({ spelling: 'logical' }))).toBe(
      "'@plumeria/no-physical-properties': 'error'",
    );
    expect(compilerOption(answers({ spelling: 'physical' }))).toBe(
      'withoutLogicalProperties: true',
    );
    expect(spellingRule(answers({ spelling: 'physical' }))).toBe(
      "'@plumeria/no-logical-properties': 'error'",
    );
  });

  it('carries the size axis to both sides', () => {
    const both = answers({ spelling: 'physical', sizes: true });
    expect(compilerOption(both)).toBe(
      'withoutLogicalProperties: { sizes: true }',
    );
    expect(spellingRule(both)).toBe(
      "'@plumeria/no-logical-properties': ['error', { sizes: true }]",
    );
  });

  it('sets neither side when both spellings are allowed', () => {
    expect(compilerOption(answers({ spelling: 'both' }))).toBeUndefined();
    expect(spellingRule(answers({ spelling: 'both' }))).toBeUndefined();
  });
});

describe('the declaration', () => {
  it('references the shipped one for the default prop', () => {
    expect(declarationSource(answers())).toBe(
      '/// <reference types="@plumeria/core/class-style" />\n',
    );
  });

  it('declares the prop the project renamed to', () => {
    const source = declarationSource(answers({ styleProp: 'sx' }));
    expect(source).toContain("import type { Style } from '@plumeria/core';");
    expect(source).toContain('sx?: Style;');
  });
});

describe('plan', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-plan-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const project = (
    fields: Record<string, unknown>,
    files: Record<string, string>,
  ) => {
    add(dir, 'package.json', `${JSON.stringify(fields, null, 2)}\n`);
    for (const [name, content] of Object.entries(files))
      add(dir, name, content);
  };

  it('wraps the Next config and carries the policy into it', () => {
    project(
      {
        name: 'app',
        scripts: { build: 'next build' },
        dependencies: { next: '^16.3.1' },
      },
      { 'next.config.ts': NEXT_CONFIG, 'tsconfig.json': '{}' },
    );

    const actions = plan(
      detect(dir),
      answers({ spelling: 'physical', sizes: true }),
    );
    const patched = contentsOf(on(actions, 'next.config.ts'));

    expect(patched).toContain(
      "import { withPlumeria } from '@plumeria/next-plugin';",
    );
    expect(patched).toContain(
      'export default withPlumeria(nextConfig, { withoutLogicalProperties: { sizes: true } });',
    );
  });

  it('registers the unplugin and carries the policy into it', () => {
    project(
      { name: 'app', devDependencies: { vite: '^8.0.13' } },
      { 'vite.config.ts': VITE_CONFIG, 'tsconfig.json': '{}' },
    );

    const actions = plan(
      detect(dir),
      answers({ spelling: 'logical', styleProp: 'sx' }),
    );
    const patched = contentsOf(on(actions, 'vite.config.ts'));

    expect(patched).toContain("import plumeria from '@plumeria/unplugin';");
    expect(patched).toContain(
      "plugins: [react(), plumeria.vite({ styleProp: 'sx', withoutPhysicalProperties: true })]",
    );
  });

  it('writes a config when the bundler has none', () => {
    project(
      { name: 'app', devDependencies: { vite: '^8.0.13' } },
      { 'tsconfig.json': '{}' },
    );

    const action = on(plan(detect(dir), answers()), 'vite.config.ts');
    expect(action.kind).toBe('write');
    expect(contentsOf(action)).toContain('plugins: [plumeria.vite()]');
  });

  it('hands back a snippet when the plugin cannot be placed', () => {
    project({ name: 'app', devDependencies: { esbuild: '^0.28.0' } }, {});

    const actions = plan(detect(dir), answers({ eslint: false }));
    const manual = actions.find((action) => action.kind === 'manual');
    expect(manual).toBeDefined();
    if (manual?.kind !== 'manual') throw new Error('expected a manual action');
    expect(manual.snippet).toContain('plugins: [plumeria.esbuild()]');
  });

  it('puts the opt-in rules in the ESLint config it writes', () => {
    project(
      { name: 'app', devDependencies: { vite: '^8.0.13' } },
      { 'tsconfig.json': '{}' },
    );

    const written = contentsOf(
      on(
        plan(detect(dir), answers({ spelling: 'logical' })),
        'eslint.config.ts',
      ),
    );
    expect(written).toContain('plumeria.configs.recommended,');
    expect(written).toContain("'@plumeria/expand-border-shorthands': 'warn',");
    expect(written).toContain("'@plumeria/no-physical-properties': 'error',");
    expect(written).toContain('parserOptions: { projectService: true }');
  });

  it('leaves the opt-in rules out when they were not asked for', () => {
    project(
      { name: 'app', devDependencies: { vite: '^8.0.13' } },
      { 'tsconfig.json': '{}' },
    );

    const written = contentsOf(
      on(
        plan(detect(dir), answers({ expandBorderShorthands: false })),
        'eslint.config.ts',
      ),
    );
    expect(written).toContain('plumeria.configs.recommended,');
    expect(written).not.toContain('rules:');
  });

  it('guards the build script it finds', () => {
    project(
      {
        name: 'app',
        scripts: { build: 'tsc -b && vite build' },
        devDependencies: { vite: '^8.0.13' },
      },
      { 'tsconfig.json': '{}' },
    );

    const patched = JSON.parse(
      contentsOf(on(plan(detect(dir), answers()), 'package.json')),
    ) as {
      scripts: Record<string, string>;
    };
    expect(patched.scripts.build).toBe('plumerialint -- tsc -b && vite build');
  });

  it('installs only what is missing', () => {
    project(
      {
        name: 'app',
        devDependencies: {
          vite: '^8.0.13',
          '@plumeria/core': '^19.1.1',
          oxlint: '1.67.0',
        },
      },
      { 'tsconfig.json': '{}', 'eslint.config.ts': 'export default [];\n' },
    );

    const install = plan(detect(dir), answers()).find(
      (action) => action.kind === 'install',
    );
    if (install?.kind !== 'install')
      throw new Error('expected an install action');
    expect(install.packages).toEqual([
      '@plumeria/unplugin',
      '@plumeria/eslint-plugin',
    ]);
  });

  it('writes nothing twice', () => {
    project(
      {
        name: 'app',
        scripts: { build: 'plumerialint -- vite build' },
        devDependencies: { vite: '^8.0.13' },
      },
      {
        'tsconfig.json': '{}',
        'plumeria.d.ts':
          '/// <reference types="@plumeria/core/class-style" />\n',
        'vite.config.ts': `import plumeria from '@plumeria/unplugin';\n\nexport default { plugins: [plumeria.vite()] };\n`,
        'eslint.config.ts': `import plumeria from '@plumeria/eslint-plugin';\n\nexport default [plumeria.configs.recommended];\n`,
      },
    );

    const actions = plan(detect(dir), answers());
    expect(
      actions
        .filter((action) => action.kind !== 'install')
        .every((action) => action.kind === 'skip'),
    ).toBe(true);
  });
});

describe('what a config already carries', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-carry-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const project = (
    fields: Record<string, unknown>,
    files: Record<string, string>,
  ) => {
    add(dir, 'package.json', `${JSON.stringify(fields, null, 2)}\n`);
    for (const [name, content] of Object.entries(files))
      add(dir, name, content);
  };

  const vite = (
    fields: Record<string, unknown>,
    files: Record<string, string>,
  ) =>
    project(
      { name: 'app', devDependencies: { vite: '^8.0.13' }, ...fields },
      {
        'tsconfig.json': '{}',
        ...files,
      },
    );

  it('leaves a sibling plugins array alone', () => {
    vite(
      {},
      {
        'vite.config.ts': `import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    plugins: [],
  },
  plugins: [react()],
});
`,
      },
    );

    const patched = contentsOf(
      on(plan(detect(dir), answers()), 'vite.config.ts'),
    );
    expect(patched).toContain('plugins: [react(), plumeria.vite()],');
    expect(patched).toContain('    plugins: [],\n');
  });

  it('hands back a snippet rather than write into a foreign plugins array', () => {
    vite(
      {},
      {
        'vite.config.ts': `import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    plugins: [],
  },
});
`,
      },
    );

    const action = on(plan(detect(dir), answers()), 'vite.config.ts');
    expect(action.kind).toBe('manual');
  });

  it('registers the plugin when only the import is there', () => {
    vite(
      {},
      {
        'vite.config.ts': `import { defineConfig } from 'vite';
import plumeria from '@plumeria/unplugin';

export default defineConfig({
  plugins: [react()],
});
`,
      },
    );

    const action = on(plan(detect(dir), answers()), 'vite.config.ts');
    expect(action.kind).toBe('patch');
    const patched = contentsOf(action);
    expect(patched).toContain('plumeria.vite()');
    expect(patched.match(/@plumeria\/unplugin/g)).toHaveLength(1);
  });

  it('calls the binding the config already named', () => {
    vite(
      {},
      {
        'vite.config.ts': `import zero from '@plumeria/unplugin';

export default { plugins: [react()] };
`,
      },
    );

    expect(
      contentsOf(on(plan(detect(dir), answers()), 'vite.config.ts')),
    ).toContain('plugins: [react(), zero.vite()]');
  });

  it('skips only once the plugin is actually called', () => {
    vite(
      {},
      {
        'vite.config.ts': `import plumeria from '@plumeria/unplugin';

export default { plugins: [plumeria.vite()] };
`,
      },
    );

    expect(on(plan(detect(dir), answers()), 'vite.config.ts').kind).toBe(
      'skip',
    );
  });

  it('wraps a Next config that imports withPlumeria without using it', () => {
    project(
      {
        name: 'app',
        scripts: { build: 'next build' },
        dependencies: { next: '^16.3.1' },
      },
      {
        'tsconfig.json': '{}',
        'next.config.ts': `import { withPlumeria } from '@plumeria/next-plugin';

const nextConfig = {};

export default nextConfig;
`,
      },
    );

    const action = on(plan(detect(dir), answers()), 'next.config.ts');
    expect(action.kind).toBe('patch');
    const patched = contentsOf(action);
    expect(patched).toContain('export default withPlumeria(nextConfig);');
    expect(patched.match(/@plumeria\/next-plugin/g)).toHaveLength(1);
  });

  it('extends an ESLint config that imports the plugin without using it', () => {
    vite(
      {},
      {
        'eslint.config.ts': `import plumeria from '@plumeria/eslint-plugin';

export default [base];
`,
      },
    );

    const action = on(plan(detect(dir), answers()), 'eslint.config.ts');
    expect(action.kind).toBe('patch');
    expect(contentsOf(action)).toContain('plumeria.configs.recommended,');
  });
});

describe('the Next cache', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-next-')),
    );
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const next = (
    scripts: Record<string, string>,
    extra: Record<string, string> = {},
  ) => {
    add(
      dir,
      'package.json',
      `${JSON.stringify({ name: 'app', scripts, dependencies: { next: '^16.3.1' } }, null, 2)}\n`,
    );
    add(dir, 'tsconfig.json', '{}');
    for (const [name, content] of Object.entries(extra))
      add(dir, name, content);
  };

  it('clears .next before dev and before build', () => {
    next({ dev: 'next dev', build: 'next build' });

    const patched = JSON.parse(
      contentsOf(on(plan(detect(dir), answers()), 'package.json')),
    ) as { scripts: Record<string, string> };

    expect(patched.scripts).toMatchObject({
      predev: 'rimraf .next',
      prebuild: 'rimraf .next',
      build: 'plumerialint -- next build',
    });
  });

  it('installs rimraf for it', () => {
    next({ dev: 'next dev', build: 'next build' });

    const install = plan(detect(dir), answers()).find(
      (action) => action.kind === 'install',
    );
    if (install?.kind !== 'install')
      throw new Error('expected an install action');
    expect(install.packages).toContain('rimraf');
  });

  it('leaves a pre script the project already wrote', () => {
    next({ predev: 'del .next', prebuild: 'del .next', build: 'next build' });

    const patched = JSON.parse(
      contentsOf(on(plan(detect(dir), answers()), 'package.json')),
    ) as { scripts: Record<string, string> };

    expect(patched.scripts.predev).toBe('del .next');
    expect(patched.scripts.prebuild).toBe('del .next');
  });

  it('leaves the scripts of another bundler alone', () => {
    add(
      dir,
      'package.json',
      `${JSON.stringify({ name: 'app', scripts: { build: 'vite build' }, devDependencies: { vite: '^8.0.13' } }, null, 2)}\n`,
    );
    add(dir, 'tsconfig.json', '{}');

    const patched = JSON.parse(
      contentsOf(on(plan(detect(dir), answers()), 'package.json')),
    ) as { scripts: Record<string, string> };

    expect(patched.scripts.predev).toBeUndefined();
    expect(patched.scripts.build).toBe('plumerialint -- vite build');
  });
});
