import { createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import { Linter } from 'eslint/universal';
import * as tsParser from '@typescript-eslint/parser';
import plumeria from '@plumeria/eslint-plugin';
import * as ts from 'typescript';
import type { Diagnostic, LintMessage, QuickInfo, Session, SpellingPolicy } from './engine-types';

const FILE_NAME = '/playground.tsx';
const CORE_DIR = '/node_modules/@plumeria/core';

export const tokenTypes = [
  'class',
  'enum',
  'interface',
  'namespace',
  'typeParameter',
  'type',
  'parameter',
  'variable',
  'enumMember',
  'property',
  'function',
  'member',
  'tag',
  'attribute',
  'jsxText',
] as const;

const CORE_PACKAGE = JSON.stringify({
  name: '@plumeria/core',
  version: '0.0.0',
  types: './lib/css.d.ts',
  exports: {
    '.': { types: './lib/css.d.ts' },
    './class-style': { types: './lib/class-style.d.ts' },
  },
  imports: { '#types': './lib/types.d.ts' },
});

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  jsxImportSource: 'react',
  types: ['react'],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  allowNonTsExtensions: true,
};

const REFERENCE_LIB = /\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/g;

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`playground: failed to load ${url}`);
  return response.text();
}

async function loadLibs(entry: string, available: Set<string>): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const queue = [entry];

  while (queue.length > 0) {
    const name = queue.pop() as string;
    if (files.has(`/${name}`) || !available.has(name)) continue;

    const text = await fetchText(`/playground/ts/${name}`);
    files.set(`/${name}`, text);

    for (const match of text.matchAll(REFERENCE_LIB)) {
      queue.push(`lib.${match[1]}.d.ts`);
    }
  }

  return files;
}

const linter = new Linter();
const recommendedRules = plumeria.configs.recommended.rules ?? {};

function spellingRules(policy: SpellingPolicy): Record<string, 'error'> {
  if (policy === 'logical') return { '@plumeria/no-physical-properties': 'error' };
  if (policy === 'physical') return { '@plumeria/no-logical-properties': 'error' };
  return {};
}

export async function createSession(source: string): Promise<Session> {
  const manifest = (await (await fetch('/playground/manifest.json')).json()) as {
    tsLibs: string[];
    coreLibs: string[];
    typeFiles: Record<string, string[]>;
  };

  const typeEntries = Object.entries(manifest.typeFiles).flatMap(([pkg, names]) =>
    names.map(
      async (name) => [`/node_modules/${pkg}/${name}`, await fetchText(`/playground/types/${pkg}/${name}`)] as const,
    ),
  );

  const [libs, coreLibs, typeLibs] = await Promise.all([
    loadLibs(ts.getDefaultLibFileName(compilerOptions), new Set(manifest.tsLibs)),
    Promise.all(
      manifest.coreLibs.map(
        async (name) => [`${CORE_DIR}/lib/${name}`, await fetchText(`/playground/core/${name}`)] as const,
      ),
    ),
    Promise.all(typeEntries),
  ]);

  const fsMap = new Map<string, string>([...libs, ...coreLibs, ...typeLibs]);
  fsMap.set(`${CORE_DIR}/package.json`, CORE_PACKAGE);
  fsMap.set(FILE_NAME, source);

  const env = createVirtualTypeScriptEnvironment(
    createSystem(fsMap),
    [FILE_NAME, `${CORE_DIR}/lib/class-style.d.ts`],
    ts,
    compilerOptions,
  );

  const service = env.languageService;

  return {
    update(next: string) {
      env.updateFile(FILE_NAME, next);
    },

    quickInfo(offset: number): QuickInfo | null {
      const info = service.getQuickInfoAtPosition(FILE_NAME, offset);
      if (!info) return null;

      return {
        signature: ts.displayPartsToString(info.displayParts),
        displayParts: info.displayParts ?? [],
        documentation: ts.displayPartsToString(info.documentation),
        tags: (info.tags ?? [])
          .map((tag) => {
            const text = ts.displayPartsToString(tag.text);
            return text ? `*@${tag.name}* — ${text}` : `*@${tag.name}*`;
          })
          .join('\n\n'),
        start: info.textSpan.start,
        length: info.textSpan.length,
      };
    },

    classifications(start: number, length: number) {
      const spans = service.getEncodedSemanticClassifications(
        FILE_NAME,
        { start, length },
        ts.SemanticClassificationFormat.TwentyTwenty,
      ).spans;
      // TypeScript's semantic classifications omit JSX tags, attributes, and text.
      const sourceFile = service.getProgram()?.getSourceFile(FILE_NAME);
      if (!sourceFile) return spans;
      function add(node: ts.Node, kind: 'tag' | 'attribute' | 'jsxText') {
        const offset = node.getStart(sourceFile);
        const end = node.getEnd();
        if (offset < start + length && end > start) {
          spans.push(offset, end - offset, (tokenTypes.indexOf(kind) + 1) << 8);
        }
      }
      function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxClosingElement(node) || ts.isJsxSelfClosingElement(node)) {
          if (ts.isIdentifier(node.tagName) && /^[a-z]/.test(node.tagName.text)) add(node.tagName, 'tag');
        } else if (ts.isJsxAttribute(node)) {
          add(node.name, 'attribute');
        } else if (ts.isJsxText(node)) {
          add(node, 'jsxText');
        }
        ts.forEachChild(node, visit);
      }
      visit(sourceFile);
      return spans;
    },

    diagnostics(): Diagnostic[] {
      return [...service.getSyntacticDiagnostics(FILE_NAME), ...service.getSemanticDiagnostics(FILE_NAME)].map(
        (diagnostic) => ({
          message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          start: diagnostic.start ?? 0,
          length: diagnostic.length ?? 1,
        }),
      );
    },

    transpile(next: string): string {
      return ts.transpileModule(next, {
        fileName: FILE_NAME,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
          jsxImportSource: 'react',
        },
      }).outputText;
    },

    fix(this: Session, next: string, policy: SpellingPolicy): string {
      let output = next;
      try {
        for (let pass = 0; pass < 10; pass += 1) {
          env.updateFile(FILE_NAME, output);
          const fixes = this.lint(output, policy)
            .flatMap((message) => (message.fix ? [message.fix] : []))
            .sort((a, b) => a.range[0] - b.range[0] || a.range[1] - b.range[1]);
          let end = -1;
          let result = '';
          for (const fix of fixes) {
            if (fix.range[0] <= end) continue;
            result += output.slice(Math.max(0, end), fix.range[0]) + fix.text;
            end = fix.range[1];
          }
          if (end < 0) break;
          result += output.slice(end);
          if (result === output) break;
          output = result;
        }
        return output;
      } finally {
        env.updateFile(FILE_NAME, next);
      }
    },

    lint(next: string, policy: SpellingPolicy): LintMessage[] {
      const program = service.getProgram();
      if (!program) return [];

      return linter.verify(
        next,
        {
          files: ['**/*.tsx'],
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              programs: [program],
              ecmaFeatures: { jsx: true },
              sourceType: 'module',
            },
          },
          plugins: { '@plumeria': plumeria },
          rules: {
            ...recommendedRules,
            '@plumeria/expand-border-shorthands': 'warn',
            ...spellingRules(policy),
          },
        },
        FILE_NAME,
      ) as LintMessage[];
    },
  };
}
