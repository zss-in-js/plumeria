import { createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import { Linter } from 'eslint/universal';
import * as tsParser from '@typescript-eslint/parser';
import plumeria from '@plumeria/eslint-plugin';
import * as ts from 'typescript';
import type { Completion, Diagnostic, LintMessage, QuickInfo, Session, SpellingPolicy } from './engine-types';

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

const linter = new Linter();
const recommendedRules = plumeria.configs.recommended.rules ?? {};

function spellingRules(policy: SpellingPolicy): Record<string, 'error'> {
  if (policy === 'logical') return { '@plumeria/no-physical-properties': 'error' };
  if (policy === 'physical') return { '@plumeria/no-logical-properties': 'error' };
  return {};
}

export async function createSession(files: Record<string, string>, libs: Record<string, string>): Promise<Session> {
  const fsMap = new Map<string, string>(Object.entries(libs));
  fsMap.set(`${CORE_DIR}/package.json`, CORE_PACKAGE);
  for (const [path, contents] of Object.entries(files)) fsMap.set(path, contents);

  const env = createVirtualTypeScriptEnvironment(
    createSystem(fsMap),
    [...Object.keys(files), `${CORE_DIR}/lib/class-style.d.ts`],
    ts,
    compilerOptions,
  );

  const service = env.languageService;

  return {
    update(file: string, next: string) {
      env.updateFile(file, next);
    },

    completions(file: string, offset: number, trigger?: string): Completion[] {
      const info = service.getCompletionsAtPosition(file, offset, {
        triggerCharacter: trigger as ts.CompletionsTriggerCharacter | undefined,
        includeCompletionsWithInsertText: true,
        quotePreference: 'single',
      });
      if (!info) return [];

      return info.entries.map((entry) => {
        const span = entry.replacementSpan ?? info.optionalReplacementSpan;
        return {
          name: entry.name,
          kind: entry.kind,
          sortText: entry.sortText,
          insertText: entry.insertText,
          start: span?.start,
          length: span?.length,
        };
      });
    },

    quickInfo(file: string, offset: number): QuickInfo | null {
      const info = service.getQuickInfoAtPosition(file, offset);
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

    classifications(file: string, start: number, length: number) {
      const spans = service.getEncodedSemanticClassifications(
        file,
        { start, length },
        ts.SemanticClassificationFormat.TwentyTwenty,
      ).spans;
      // TypeScript's semantic classifications omit JSX tags, attributes, and text.
      const sourceFile = service.getProgram()?.getSourceFile(file);
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

    diagnostics(file: string): Diagnostic[] {
      return [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)].map((diagnostic) => ({
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        start: diagnostic.start ?? 0,
        length: diagnostic.length ?? 1,
      }));
    },

    transpile(file: string, next: string): string {
      return ts.transpileModule(next, {
        fileName: file,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
          jsxImportSource: 'react',
        },
      }).outputText;
    },

    fix(this: Session, file: string, next: string, policy: SpellingPolicy): string {
      let output = next;
      try {
        for (let pass = 0; pass < 10; pass += 1) {
          env.updateFile(file, output);
          const fixes = this.lint(file, output, policy)
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
        env.updateFile(file, next);
      }
    },

    lint(file: string, next: string, policy: SpellingPolicy): LintMessage[] {
      const program = service.getProgram();
      if (!program) return [];

      return linter.verify(
        next,
        {
          files: ['**/*.ts', '**/*.tsx'],
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
        file,
      ) as LintMessage[];
    },
  };
}
