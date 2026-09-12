import fs from 'node:fs';
import path from 'node:path';
import { defaultConfigName, installed } from './detect';
import {
  addImport,
  appendInside,
  appendToArray,
  appendToConfigList,
  closerOf,
  importsModule,
  moduleKindOf,
  wrapDefaultExport,
} from './source';
import type { ModuleKind } from './source';
import type { Bundler, Detected, PackageManager } from './detect';

export type Spelling = 'logical' | 'physical' | 'both';

export interface Answers {
  spelling: Spelling;
  sizes: boolean;
  styleProp: string;
  expandBorderShorthands: boolean;
  eslint: boolean;
  install: boolean;
}

export type Action =
  | {
      kind: 'install';
      label: string;
      note: string;
      command: string;
      packages: string[];
    }
  | {
      kind: 'write';
      label: string;
      note: string;
      file: string;
      contents: string;
    }
  | {
      kind: 'patch';
      label: string;
      note: string;
      file: string;
      contents: string;
    }
  | {
      kind: 'manual';
      label: string;
      note: string;
      file: string;
      snippet: string;
    }
  | { kind: 'skip'; label: string; note: string; file: string };

export const DEFAULT_STYLE_PROP = 'classStyle';

export const DEFAULT_ANSWERS: Answers = {
  spelling: 'both',
  sizes: false,
  styleProp: DEFAULT_STYLE_PROP,
  expandBorderShorthands: true,
  eslint: true,
  install: true,
};

const UNPLUGIN_METHOD: Record<Bundler, string> = {
  next: 'next',
  vite: 'vite',
  astro: 'vite',
  webpack: 'webpack',
  rspack: 'rspack',
  rollup: 'rollup',
  rolldown: 'rolldown',
  esbuild: 'esbuild',
  farm: 'farm',
  bun: 'bun',
};

const INSTALL: Record<PackageManager, string> = {
  npm: 'npm i -D',
  pnpm: 'pnpm add -D',
  yarn: 'yarn add -D',
  bun: 'bun add -d',
};

export const rejectedSpelling = (
  spelling: Spelling,
): 'logical' | 'physical' | undefined =>
  spelling === 'both'
    ? undefined
    : spelling === 'logical'
      ? 'physical'
      : 'logical';

export const compilerOption = (answers: Answers): string | undefined => {
  const rejected = rejectedSpelling(answers.spelling);
  if (!rejected) return undefined;
  const name =
    rejected === 'logical'
      ? 'withoutLogicalProperties'
      : 'withoutPhysicalProperties';
  return `${name}: ${answers.sizes ? '{ sizes: true }' : 'true'}`;
};

export const spellingRule = (answers: Answers): string | undefined => {
  const rejected = rejectedSpelling(answers.spelling);
  if (!rejected) return undefined;
  const name = `'@plumeria/no-${rejected}-properties'`;
  return answers.sizes
    ? `${name}: ['error', { sizes: true }]`
    : `${name}: 'error'`;
};

export const pluginOptions = (answers: Answers): string => {
  const entries: string[] = [];
  if (answers.styleProp !== DEFAULT_STYLE_PROP) {
    entries.push(`styleProp: '${answers.styleProp}'`);
  }
  const policy = compilerOption(answers);
  if (policy) entries.push(policy);
  return entries.length === 0 ? '' : `{ ${entries.join(', ')} }`;
};

export const pluginCall = (bundler: Bundler, answers: Answers): string =>
  `plumeria.${UNPLUGIN_METHOD[bundler]}(${pluginOptions(answers)})`;

export const declarationSource = (answers: Answers): string => {
  if (answers.styleProp === DEFAULT_STYLE_PROP) {
    return `/// <reference types="@plumeria/core/class-style" />\n`;
  }
  return `import type { Style } from '@plumeria/core';

declare global {
  namespace React {
    interface HTMLAttributes<T> {
      ${answers.styleProp}?: Style;
    }
    interface SVGAttributes<T> {
      ${answers.styleProp}?: Style;
    }
  }
}
`;
};

const nextOptions = (answers: Answers): string => {
  const options = pluginOptions(answers);
  return options === '' ? '' : `, ${options}`;
};

export const bundlerSource = (
  bundler: Bundler,
  answers: Answers,
  typescript: boolean,
): string | undefined => {
  if (bundler === 'next') {
    return typescript
      ? `import type { NextConfig } from 'next';
import { withPlumeria } from '@plumeria/next-plugin';

const nextConfig: NextConfig = {};

export default withPlumeria(nextConfig${nextOptions(answers)});
`
      : `import { withPlumeria } from '@plumeria/next-plugin';

export default withPlumeria({}${nextOptions(answers)});
`;
  }
  if (bundler === 'vite') {
    return `import { defineConfig } from 'vite';
import plumeria from '@plumeria/unplugin';

export default defineConfig({
  plugins: [${pluginCall(bundler, answers)}],
});
`;
  }
  if (bundler === 'astro') {
    return `import { defineConfig } from 'astro/config';
import plumeria from '@plumeria/unplugin';

export default defineConfig({
  vite: {
    plugins: [${pluginCall(bundler, answers)}],
  },
});
`;
  }
  return undefined;
};

export const eslintSource = (answers: Answers, typescript: boolean): string => {
  const rules = [
    answers.expandBorderShorthands
      ? `'@plumeria/expand-border-shorthands': 'warn'`
      : undefined,
    spellingRule(answers),
  ].filter((rule): rule is string => rule !== undefined);

  const block = [
    `  {`,
    `    files: ['**/*.{${typescript ? 'ts,tsx' : 'js,jsx'}}'],`,
    typescript ? `    languageOptions: {` : undefined,
    typescript ? `      parserOptions: { projectService: true },` : undefined,
    typescript ? `    },` : undefined,
    rules.length > 0 ? `    rules: {` : undefined,
    ...rules.map((rule) => `      ${rule},`),
    rules.length > 0 ? `    },` : undefined,
    `  },`,
  ].filter((line): line is string => line !== undefined);

  const head = [
    `import eslint from '@eslint/js';`,
    typescript ? `import tseslint from 'typescript-eslint';` : undefined,
    `import { defineConfig } from 'eslint/config';`,
    `import plumeria from '@plumeria/eslint-plugin';`,
  ].filter((line): line is string => line !== undefined);

  const configs = [
    `  eslint.configs.recommended,`,
    typescript ? `  tseslint.configs.recommended,` : undefined,
    `  plumeria.configs.recommended,`,
  ].filter((line): line is string => line !== undefined);

  return `${head.join('\n')}

export default defineConfig(
${configs.join('\n')}
${block.join('\n')}
);
`;
};

export const eslintEntries = (
  answers: Answers,
  typescript: boolean,
): string[] => {
  const rules = [
    answers.expandBorderShorthands
      ? `'@plumeria/expand-border-shorthands': 'warn'`
      : undefined,
    spellingRule(answers),
  ].filter((rule): rule is string => rule !== undefined);

  const entries = ['plumeria.configs.recommended'];
  if (rules.length > 0) {
    entries.push(
      [
        `{`,
        `  files: ['**/*.{${typescript ? 'ts,tsx' : 'js,jsx'}}'],`,
        `  rules: {`,
        ...rules.map((rule) => `    ${rule},`),
        `  },`,
        `}`,
      ].join('\n'),
    );
  }
  return entries;
};

export const packages = (detected: Detected, answers: Answers): string[] => {
  const present = installed(detected.manifest);
  const wanted = [
    '@plumeria/core',
    detected.bundler === 'next'
      ? '@plumeria/next-plugin'
      : '@plumeria/unplugin',
  ];

  if (answers.eslint) {
    wanted.push('@plumeria/eslint-plugin', 'oxlint');
    if (!detected.eslintConfig) {
      wanted.push('eslint', '@eslint/js');
      if (detected.typescript) wanted.push('typescript-eslint');
    }
  }

  return wanted.filter((name) => !(name in present));
};

export const installCommand = (
  manager: PackageManager,
  names: readonly string[],
): string => `${INSTALL[manager]} ${names.join(' ')}`;

const indentOfJson = (source: string): number => {
  const match = /\n(\s+)"/.exec(source);
  return match ? match[1].length : 2;
};

export const buildScript = (existing: string): string =>
  `plumerialint -- ${existing}`;

export const plan = (detected: Detected, answers: Answers): Action[] => {
  const actions: Action[] = [];
  const names = packages(detected, answers);

  if (names.length > 0) {
    actions.push({
      kind: 'install',
      label: 'install',
      note: names.join(' '),
      command: installCommand(detected.packageManager, names),
      packages: names,
    });
  }

  if (detected.declaration) {
    actions.push({
      kind: 'skip',
      label: 'skip',
      note: 'already declares the styling prop',
      file: detected.declaration,
    });
  } else {
    actions.push({
      kind: 'write',
      label: 'write',
      note: answers.styleProp,
      file: 'plumeria.d.ts',
      contents: declarationSource(answers),
    });
  }

  actions.push(bundlerAction(detected, answers));
  if (answers.eslint) {
    actions.push(eslintAction(detected, answers));
    actions.push(scriptAction(detected));
  }

  return actions;
};

const read = (detected: Detected, file: string): string =>
  fs.readFileSync(path.join(detected.root, file), 'utf8');

const bundlerAction = (detected: Detected, answers: Answers): Action => {
  const { bundler, bundlerConfig, typescript } = detected;
  const call = pluginCall(bundler, answers);

  if (!bundlerConfig) {
    const fresh = bundlerSource(bundler, answers, typescript);
    const file = defaultConfigName(bundler, typescript);
    if (!fresh) {
      return {
        kind: 'manual',
        label: 'manual',
        note:
          bundler === 'esbuild' || bundler === 'bun'
            ? 'add the plugin to the build script'
            : `no ${bundler} config found`,
        file,
        snippet: snippetFor(bundler, call),
      };
    }
    return {
      kind: 'write',
      label: 'write',
      note: bundler,
      file,
      contents: fresh,
    };
  }

  const source = read(detected, bundlerConfig);

  if (bundler === 'next') {
    if (importsModule(source, '@plumeria/next-plugin')) {
      return {
        kind: 'skip',
        label: 'skip',
        note: 'withPlumeria is already applied',
        file: bundlerConfig,
      };
    }
    const wrapped = wrapDefaultExport(
      addImport(
        source,
        NAMED_IMPORTS[moduleKindOf(bundlerConfig, source)](
          'withPlumeria',
          '@plumeria/next-plugin',
        ),
      ),
      'withPlumeria',
      nextOptions(answers),
    );
    return wrapped
      ? {
          kind: 'patch',
          label: 'patch',
          note: 'withPlumeria(...)',
          file: bundlerConfig,
          contents: wrapped,
        }
      : {
          kind: 'manual',
          label: 'manual',
          note: 'no default export to wrap',
          file: bundlerConfig,
          snippet: snippetFor(bundler, call),
        };
  }

  if (importsModule(source, '@plumeria/unplugin')) {
    return {
      kind: 'skip',
      label: 'skip',
      note: 'the plugin is already registered',
      file: bundlerConfig,
    };
  }

  const imported = addImport(
    source,
    IMPORTS[moduleKindOf(bundlerConfig, source)](
      'plumeria',
      '@plumeria/unplugin',
    ),
  );
  const patched =
    appendToArray(imported, 'plugins', call) ??
    (bundler === 'astro' ? addViteBlock(imported, call) : undefined);
  return patched
    ? {
        kind: 'patch',
        label: 'patch',
        note: call,
        file: bundlerConfig,
        contents: patched,
      }
    : {
        kind: 'manual',
        label: 'manual',
        note: 'no plugins array to extend',
        file: bundlerConfig,
        snippet: snippetFor(bundler, call),
      };
};

const IMPORTS: Record<ModuleKind, (name: string, specifier: string) => string> =
  {
    esm: (name, specifier) => `import ${name} from '${specifier}';`,
    cjs: (name, specifier) =>
      `const ${name} = require('${specifier}').default;`,
  };

const NAMED_IMPORTS: Record<
  ModuleKind,
  (name: string, specifier: string) => string
> = {
  esm: (name, specifier) => `import { ${name} } from '${specifier}';`,
  cjs: (name, specifier) => `const { ${name} } = require('${specifier}');`,
};

const addViteBlock = (source: string, call: string): string | undefined => {
  const match = /\bdefineConfig\s*\(/.exec(source);
  if (!match) return undefined;
  const open = source.indexOf('{', match.index + match[0].length - 1);
  if (open === -1 || open > closerOf(source, match.index + match[0].length - 1))
    return undefined;
  return appendInside(source, open, [`vite: {\n  plugins: [${call}],\n}`]);
};

const snippetFor = (bundler: Bundler, call: string): string => {
  if (bundler === 'next') {
    return `import { withPlumeria } from '@plumeria/next-plugin';\n\nexport default withPlumeria(nextConfig);`;
  }
  const imported = `import plumeria from '@plumeria/unplugin';`;
  if (bundler === 'astro') {
    return `${imported}\n\nvite: {\n  plugins: [${call}],\n}`;
  }
  return `${imported}\n\nplugins: [${call}]`;
};

const eslintAction = (detected: Detected, answers: Answers): Action => {
  const { eslintConfig, typescript } = detected;
  const entries = eslintEntries(answers, typescript);

  if (!eslintConfig) {
    return {
      kind: 'write',
      label: 'write',
      note: 'plumeria.configs.recommended',
      file: typescript ? 'eslint.config.ts' : 'eslint.config.mjs',
      contents: eslintSource(answers, typescript),
    };
  }

  if (!eslintConfig.startsWith('eslint.config.')) {
    return {
      kind: 'manual',
      label: 'manual',
      note: 'flat config only',
      file: eslintConfig,
      snippet: `{\n  "plugins": ["@plumeria"],\n  "extends": ["plugin:@plumeria/recommended"]\n}`,
    };
  }

  const source = read(detected, eslintConfig);
  if (importsModule(source, '@plumeria/eslint-plugin')) {
    return {
      kind: 'skip',
      label: 'skip',
      note: 'the plugin is already configured',
      file: eslintConfig,
    };
  }

  const patched = appendToConfigList(
    addImport(
      source,
      moduleKindOf(eslintConfig, source) === 'cjs'
        ? `const plumeria = require('@plumeria/eslint-plugin');`
        : `import plumeria from '@plumeria/eslint-plugin';`,
    ),
    entries,
  );
  return patched
    ? {
        kind: 'patch',
        label: 'patch',
        note: 'plumeria.configs.recommended',
        file: eslintConfig,
        contents: patched,
      }
    : {
        kind: 'manual',
        label: 'manual',
        note: 'no config list to extend',
        file: eslintConfig,
        snippet: entries.join(',\n'),
      };
};

const scriptAction = (detected: Detected): Action => {
  const source = read(detected, 'package.json');
  const manifest = JSON.parse(source) as { scripts?: Record<string, string> };
  const existing = manifest.scripts?.build;

  if (!existing) {
    return {
      kind: 'skip',
      label: 'skip',
      note: 'no build script to guard',
      file: 'package.json',
    };
  }
  if (existing.includes('plumerialint')) {
    return {
      kind: 'skip',
      label: 'skip',
      note: 'the build already runs plumerialint',
      file: 'package.json',
    };
  }

  manifest.scripts!.build = buildScript(existing);
  return {
    kind: 'patch',
    label: 'patch',
    note: `build: ${manifest.scripts!.build}`,
    file: 'package.json',
    contents: `${JSON.stringify(manifest, null, indentOfJson(source))}\n`,
  };
};
