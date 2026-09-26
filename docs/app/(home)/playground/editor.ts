import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/typescript/register';
import { shikiToMonaco } from '@shikijs/monaco';
import { createHighlighterCore, type HighlighterCore, type ThemeRegistration } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import tsx from 'shiki/langs/tsx.mjs';
import vitesseDark from 'shiki/themes/vitesse-dark.mjs';
import vitesseLight from 'shiki/themes/vitesse-light.mjs';
import { loadEngine } from './engine';
import type { LintFix, LintMessage, SpellingPolicy } from './engine-types';
import type { SampleFile } from './sample';

const LIGHT_THEME = 'vitesse-light';
const DARK_THEME = 'vitesse-dark';

const SCOPES: Record<string, string> = {
  namespace: 'entity.name.type.module',
  class: 'entity.name.type.class',
  interface: 'entity.name.type.interface',
  enum: 'entity.name.type.enum',
  type: 'entity.name.type',
  typeParameter: 'entity.name.type.parameter',
  function: 'entity.name.function',
  member: 'entity.name.function',
  method: 'entity.name.function',
  variable: 'variable.other.readwrite',
  local: 'variable.other.readwrite',
  parameter: 'variable.parameter',
  property: 'variable.other.property',
  enumMember: 'variable.other.enummember',
  constant: 'variable.other.constant',
  keyword: 'keyword',
  operator: 'keyword.operator',
  string: 'string',
  number: 'constant.numeric',
};

const BACKGROUND_KEYS = [
  'editor.background',
  'editorGutter.background',
  'minimap.background',
  'editorStickyScroll.background',
  'editorOverviewRuler.background',
  'editorWidget.background',
];

function onBackground(theme: ThemeRegistration, background: string): ThemeRegistration {
  return {
    ...theme,
    colors: { ...theme.colors, ...Object.fromEntries(BACKGROUND_KEYS.map((key) => [key, background])) },
  };
}

let highlighter: Promise<HighlighterCore> | undefined;

function setupHighlighting() {
  highlighter ??= createHighlighterCore({
    themes: [onBackground(vitesseLight, '#ffffff'), onBackground(vitesseDark, '#000000')],
    langs: [tsx.map((grammar) => (grammar.name === 'tsx' ? { ...grammar, name: 'typescript', aliases: [] } : grammar))],
    engine: createJavaScriptRegexEngine(),
  }).then((core) => {
    shikiToMonaco(core, monaco);
    return core;
  });
  return highlighter;
}

function colorOf(core: HighlighterCore, themeName: string, scope: string) {
  const theme = core.getTheme(themeName);
  let color = theme.fg;
  let matched = -1;
  for (const { scope: selectors, settings } of theme.settings) {
    if (!settings?.foreground) continue;
    for (const selector of [selectors ?? []].flat().flatMap((entry) => entry.split(','))) {
      const candidate = selector.trim();
      if (candidate.includes(' ') || candidate.length <= matched) continue;
      if (scope === candidate || scope.startsWith(`${candidate}.`)) {
        color = settings.foreground;
        matched = candidate.length;
      }
    }
  }
  return color;
}

declare global {
  interface Window {
    MonacoEnvironment?: { getWorker: () => Worker };
  }
}

function setupEnvironment() {
  self.MonacoEnvironment = {
    getWorker: () =>
      new Worker(new URL('monaco-editor/editor/editor.worker.js', import.meta.url), {
        type: 'module',
      }),
  };
}

const COMPLETION_KINDS: Record<string, monaco.languages.CompletionItemKind> = {
  string: monaco.languages.CompletionItemKind.Value,
  keyword: monaco.languages.CompletionItemKind.Keyword,
  property: monaco.languages.CompletionItemKind.Property,
  method: monaco.languages.CompletionItemKind.Method,
  function: monaco.languages.CompletionItemKind.Function,
  var: monaco.languages.CompletionItemKind.Variable,
  let: monaco.languages.CompletionItemKind.Variable,
  const: monaco.languages.CompletionItemKind.Constant,
  'local var': monaco.languages.CompletionItemKind.Variable,
  alias: monaco.languages.CompletionItemKind.Module,
  module: monaco.languages.CompletionItemKind.Module,
  class: monaco.languages.CompletionItemKind.Class,
  interface: monaco.languages.CompletionItemKind.Interface,
  type: monaco.languages.CompletionItemKind.TypeParameter,
  enum: monaco.languages.CompletionItemKind.Enum,
  parameter: monaco.languages.CompletionItemKind.Variable,
};

function toMarker(message: LintMessage): monaco.editor.IMarkerData {
  return {
    severity: message.severity === 2 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    message: message.ruleId ? `${message.message}  (${message.ruleId})` : message.message,
    startLineNumber: message.line,
    startColumn: message.column,
    endLineNumber: message.endLine ?? message.line,
    endColumn: message.endColumn ?? message.column + 1,
    source: 'plumeria',
  };
}

export type PlaygroundHandle = {
  reset: () => void;
  getSource: () => string;
  setFile: (path: string) => void;
  setPolicy: (policy: SpellingPolicy) => void;
  setTheme: (dark: boolean) => void;
  dispose: () => void;
};

export async function mount(
  container: HTMLElement,
  preview: HTMLIFrameElement,
  files: SampleFile[],
  entry: string,
  onCount: (errors: number, warnings: number) => void,
): Promise<PlaygroundHandle> {
  setupEnvironment();
  const core = await setupHighlighting();

  const { engine, libs } = await loadEngine();
  const session = await engine.createSession(Object.fromEntries(files.map(({ path, source }) => [path, source])), libs);
  const tokenTypes = [...engine.tokenTypes];

  const models = new Map(
    files.map(({ path, source }) => [path, monaco.editor.createModel(source, 'typescript', monaco.Uri.file(path))]),
  );
  const pathOf = new Map([...models].map(([path, target]) => [target, path]));
  let model = models.get(entry) as monaco.editor.ITextModel;

  const hoverLines = new Map<string, monaco.languages.IToken[]>();
  const hoverState: monaco.languages.IState = {
    clone: () => hoverState,
    equals: (other) => other === hoverState,
  };
  const linted = new Map<monaco.editor.ITextModel, { version: number; messages: LintMessage[] }>();
  const providers = [
    monaco.languages.register({ id: 'plumeria-hover' }),
    monaco.languages.registerCodeActionProvider('typescript', {
      provideCodeActions(target, _range, context) {
        const result = linted.get(target);
        const actions: monaco.languages.CodeAction[] = [];
        if (!result || result.version !== target.getVersionId()) return { actions, dispose() {} };

        const action = (marker: monaco.editor.IMarkerData, fix: LintFix, title: string, isPreferred: boolean) => ({
          title,
          kind: 'quickfix',
          diagnostics: [marker],
          isPreferred,
          edit: {
            edits: [
              {
                resource: target.uri,
                versionId: result.version,
                textEdit: {
                  range: monaco.Range.fromPositions(
                    target.getPositionAt(fix.range[0]),
                    target.getPositionAt(fix.range[1]),
                  ),
                  text: fix.text,
                },
              },
            ],
          },
        });

        for (const marker of context.markers) {
          if (marker.source !== 'plumeria') continue;
          const message = result.messages.find((candidate) => {
            const expected = toMarker(candidate);
            return (
              expected.message === marker.message &&
              expected.startLineNumber === marker.startLineNumber &&
              expected.startColumn === marker.startColumn &&
              expected.endLineNumber === marker.endLineNumber &&
              expected.endColumn === marker.endColumn
            );
          });
          if (!message) continue;
          if (message.fix)
            actions.push(action(marker, message.fix, `Fix this ${message.ruleId ?? 'ESLint'} problem`, true));
          for (const suggestion of message.suggestions ?? [])
            actions.push(action(marker, suggestion.fix, suggestion.desc, false));
        }
        return { actions, dispose() {} };
      },
    }),
    monaco.languages.setTokensProvider('plumeria-hover', {
      getInitialState: () => hoverState,
      tokenize: (line) => ({
        tokens: hoverLines.get(line) ?? [{ startIndex: 0, scopes: '' }],
        endState: hoverState,
      }),
    }),
    monaco.languages.registerHoverProvider('typescript', {
      provideHover(target: monaco.editor.ITextModel, position: monaco.Position) {
        const path = pathOf.get(target);
        if (!path) return null;
        const info = session.quickInfo(path, target.getOffsetAt(position));
        if (!info) return null;

        hoverLines.clear();
        let line = '';
        let tokens: monaco.languages.IToken[] = [];
        for (const part of info.displayParts ?? []) {
          const kind = part.kind.replace(/Name$/, '');
          const scopes =
            kind === 'alias' || kind === 'module'
              ? 'namespace'
              : kind === 'text' || kind === 'space' || kind === 'punctuation'
                ? ''
                : kind === 'stringLiteral'
                  ? 'string'
                  : kind === 'numericLiteral'
                    ? 'number'
                    : kind;
          const lines = part.text.split('\n');
          for (let index = 0; index < lines.length; index += 1) {
            if (index > 0) {
              hoverLines.set(line, tokens);
              line = '';
              tokens = [];
            }
            if (lines[index]) tokens.push({ startIndex: line.length, scopes: SCOPES[scopes] ?? '' });
            line += lines[index];
          }
        }
        hoverLines.set(line, tokens);

        const start = target.getPositionAt(info.start);
        const end = target.getPositionAt(info.start + info.length);

        return {
          range: monaco.Range.fromPositions(start, end),
          contents: [
            { value: '```' + (info.displayParts ? 'plumeria-hover' : 'typescript') + '\n' + info.signature + '\n```' },
            ...(info.documentation ? [{ value: info.documentation }] : []),
            ...(info.tags ? [{ value: info.tags }] : []),
          ],
        };
      },
    }),
    monaco.languages.registerCompletionItemProvider('typescript', {
      triggerCharacters: ['.', "'", '"', '`'],
      provideCompletionItems(target, position, context) {
        const path = pathOf.get(target);
        if (!path) return null;
        session.update(path, target.getValue());

        const word = target.getWordUntilPosition(position);
        const fallback = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

        return {
          suggestions: session
            .completions(path, target.getOffsetAt(position), context.triggerCharacter)
            .map((entry) => ({
              entry,
              range:
                entry.start === undefined || entry.length === undefined
                  ? fallback
                  : monaco.Range.fromPositions(
                      target.getPositionAt(entry.start),
                      target.getPositionAt(entry.start + entry.length),
                    ),
            }))
            .filter(({ entry, range }) => entry.kind !== 'string' || target.getValueInRange(range) !== entry.name)
            .map(({ entry, range }) => ({
              label: entry.name,
              kind: COMPLETION_KINDS[entry.kind] ?? monaco.languages.CompletionItemKind.Text,
              sortText: entry.sortText,
              insertText: entry.insertText ?? entry.name,
              range,
            })),
        };
      },
    }),
  ];

  const editor = monaco.editor.create(container, {
    model,
    theme: document.documentElement.classList.contains('dark') ? DARK_THEME : LIGHT_THEME,
    automaticLayout: true,
    minimap: { enabled: false },
    stickyScroll: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    'semanticHighlighting.enabled': false,
    quickSuggestions: { other: true, comments: false, strings: true },
    wordBasedSuggestions: 'off',
  });

  // Decorations retain semantic colors while Monaco retokenizes after a theme change.
  const semanticStyles = document.createElement('style');
  semanticStyles.textContent = [LIGHT_THEME, DARK_THEME]
    .map((themeName, index) =>
      Object.entries(SCOPES)
        .map(
          ([kind, scope]) =>
            `${index ? '.dark' : ':root:not(.dark)'} .plumeria-semantic-${kind} { color: ${colorOf(core, themeName, scope)} !important; }`,
        )
        .join('\n'),
    )
    .join('\n');
  document.head.append(semanticStyles);
  const semanticDecorations = editor.createDecorationsCollection();

  function updateSemanticColors() {
    const code = model.getValue();
    const path = pathOf.get(model) as string;
    session.update(path, code);
    const spans = session.classifications(path, 0, code.length);
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    for (let index = 0; index < spans.length; index += 3) {
      const tokenType = (spans[index + 2] >> 8) - 1;
      if (tokenType < 0 || tokenType >= tokenTypes.length) continue;
      const kind = tokenTypes[tokenType];
      const color = kind === 'variable' && spans[index + 2] & (1 << 3) ? 'constant' : kind;
      const start = model.getPositionAt(spans[index]);
      const end = model.getPositionAt(spans[index] + spans[index + 1]);
      decorations.push({
        range: monaco.Range.fromPositions(start, end),
        options: { inlineClassName: `plumeria-semantic-${color}` },
      });
    }
    semanticDecorations.set(decorations);
  }

  let policy: SpellingPolicy = 'off';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let previewReady = false;

  function sendTheme(nextDark: boolean) {
    if (!previewReady) return;
    preview.contentWindow?.postMessage({ type: 'playground:theme', dark: nextDark }, '*');
  }

  function sendPreview() {
    if (!previewReady) return;
    const transpiled: Record<string, string> = {};
    for (const [path, target] of models) transpiled[path] = session.transpile(path, target.getValue());
    preview.contentWindow?.postMessage({ type: 'playground:render', files: transpiled, entry }, '*');
  }

  const onPreviewMessage = (event: MessageEvent<{ type?: string }>) => {
    if (event.source !== preview.contentWindow || event.data?.type !== 'playground:ready') return;
    previewReady = true;
    sendTheme(document.documentElement.classList.contains('dark'));
    sendPreview();
  };

  const onPreviewLoad = () => {
    previewReady = true;
    sendTheme(document.documentElement.classList.contains('dark'));
    sendPreview();
  };

  window.addEventListener('message', onPreviewMessage);
  preview.addEventListener('load', onPreviewLoad);

  if (preview.contentDocument?.readyState === 'complete') onPreviewLoad();

  function run() {
    let errors = 0;
    let warnings = 0;
    let typeErrorCount = 0;

    for (const [path, target] of models) {
      const code = target.getValue();
      session.update(path, code);

      const typeErrors = session.diagnostics(path).map((diagnostic) => {
        const start = target.getPositionAt(diagnostic.start);
        const end = target.getPositionAt(diagnostic.start + diagnostic.length);
        return {
          severity: monaco.MarkerSeverity.Error,
          message: diagnostic.message,
          startLineNumber: start.lineNumber,
          startColumn: start.column,
          endLineNumber: end.lineNumber,
          endColumn: end.column,
          source: 'ts',
        };
      });
      typeErrorCount += typeErrors.length;

      const messages = session.lint(path, code, policy);
      linted.set(target, { version: target.getVersionId(), messages });
      for (const message of messages) {
        if (message.severity === 2) errors += 1;
        else warnings += 1;
      }

      monaco.editor.setModelMarkers(target, 'ts', typeErrors);
      monaco.editor.setModelMarkers(target, 'plumeria', messages.map(toMarker));
    }

    onCount(errors, warnings);

    if (typeErrorCount === 0) sendPreview();
  }

  const subscriptions = [...models.values()].map((target) =>
    target.onDidChangeContent(() => {
      updateSemanticColors();
      clearTimeout(timer);
      timer = setTimeout(run, 250);
    }),
  );

  function fixOnSave(event: KeyboardEvent) {
    if (!editor.hasTextFocus() || event.isComposing || event.shiftKey || event.getModifierState('AltGraph')) return;
    if (event.code !== 'KeyS' || !(event.metaKey || event.ctrlKey || event.altKey)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;

    const code = model.getValue();
    const fixed = session.fix(pathOf.get(model) as string, code, policy);
    if (fixed !== code) {
      // Apply only the changed region so cursor tracking and undo remain useful.
      let start = 0;
      while (start < code.length && start < fixed.length && code[start] === fixed[start]) start += 1;
      let end = code.length;
      let fixedEnd = fixed.length;
      while (end > start && fixedEnd > start && code[end - 1] === fixed[fixedEnd - 1]) {
        end -= 1;
        fixedEnd -= 1;
      }
      editor.pushUndoStop();
      editor.executeEdits('eslint-fix', [
        {
          range: monaco.Range.fromPositions(model.getPositionAt(start), model.getPositionAt(end)),
          text: fixed.slice(start, fixedEnd),
        },
      ]);
      editor.pushUndoStop();
    }
    clearTimeout(timer);
    run();
  }

  window.addEventListener('keydown', fixOnSave, true);
  updateSemanticColors();
  run();

  return {
    getSource: () => model.getValue(),
    setFile(path) {
      const next = models.get(path);
      if (!next || next === model) return;
      model = next;
      editor.setModel(model);
      updateSemanticColors();
      editor.focus();
    },
    reset() {
      editor.pushUndoStop();
      for (const { path, source } of files) {
        const target = models.get(path);
        if (target) target.setValue(source);
      }
      editor.pushUndoStop();
      clearTimeout(timer);
      updateSemanticColors();
      run();
      editor.setScrollTop(0);
      editor.focus();
    },
    setPolicy(next) {
      policy = next;
      run();
    },
    setTheme(nextDark) {
      monaco.editor.setTheme(nextDark ? DARK_THEME : LIGHT_THEME);
      sendTheme(nextDark);
    },
    dispose() {
      clearTimeout(timer);
      window.removeEventListener('keydown', fixOnSave, true);
      window.removeEventListener('message', onPreviewMessage);
      preview.removeEventListener('load', onPreviewLoad);
      for (const subscription of subscriptions) subscription.dispose();
      for (const target of models.values()) target.dispose();
      semanticDecorations.clear();
      semanticStyles.remove();
      for (const provider of providers) provider?.dispose();
      editor.dispose();
      model.dispose();
    },
  };
}
