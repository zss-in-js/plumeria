import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/typescript/register';
import { loadEngine } from './engine';
import type { LintMessage, SpellingPolicy } from './engine-types';
import type { SampleFile } from './sample';

const LIGHT_RULES: monaco.editor.ITokenThemeRule[] = [
  { token: '', foreground: '393a34' },
  { token: 'comment', foreground: 'a0ada0' },
  { token: 'keyword', foreground: '1e754f' },
  { token: 'string', foreground: 'b56959' },
  { token: 'number', foreground: '2f798a' },
  { token: 'namespace', foreground: '2e8f82' },
  { token: 'class', foreground: '2e8f82' },
  { token: 'interface', foreground: '2e8f82' },
  { token: 'enum', foreground: '2e8f82' },
  { token: 'type', foreground: '2e8f82' },
  { token: 'typeParameter', foreground: '2e8f82' },
  { token: 'identifier', foreground: '2e8f82' },
  { token: 'function', foreground: '59873a' },
  { token: 'member', foreground: '59873a' },
  { token: 'variable', foreground: 'b07d48' },
  { token: 'parameter', foreground: 'b07d48' },
  { token: 'property', foreground: '998418' },
  { token: 'enumMember', foreground: 'a65e2b' },
  { token: 'constant', foreground: 'a65e2b' },
  { token: 'tag', foreground: '1e754f' },
  { token: 'attribute', foreground: 'b07d48' },
  { token: 'jsxText', foreground: '393a34' },
];

const DARK_RULES: monaco.editor.ITokenThemeRule[] = [
  { token: '', foreground: 'dbd7ca' },
  { token: 'comment', foreground: '758575' },
  { token: 'keyword', foreground: '4d9375' },
  { token: 'string', foreground: 'c98a7d' },
  { token: 'number', foreground: '4c9a91' },
  { token: 'namespace', foreground: '5da994' },
  { token: 'class', foreground: '5da994' },
  { token: 'interface', foreground: '5da994' },
  { token: 'enum', foreground: '5da994' },
  { token: 'type', foreground: '5da994' },
  { token: 'typeParameter', foreground: '5da994' },
  { token: 'identifier', foreground: '5da994' },
  { token: 'function', foreground: '80a665' },
  { token: 'member', foreground: '80a665' },
  { token: 'variable', foreground: 'bd976a' },
  { token: 'parameter', foreground: 'bd976a' },
  { token: 'property', foreground: 'b8a965' },
  { token: 'enumMember', foreground: 'c99076' },
  { token: 'constant', foreground: 'c99076' },
  { token: 'tag', foreground: '4d9375' },
  { token: 'attribute', foreground: 'bd976a' },
  { token: 'jsxText', foreground: 'dbd7ca' },
];

const LIGHT_COLORS = {
  'editor.background': '#ffffff',
  'editorGutter.background': '#ffffff',
  'minimap.background': '#ffffff',
  'editorStickyScroll.background': '#ffffff',
  'editorOverviewRuler.background': '#ffffff',
  'editorWidget.background': '#ffffff',
  'editor.lineHighlightBackground': '#f7f7f7',
  'editor.selectionBackground': '#22222218',
  'editor.selectionHighlightBackground': '#22222210',
  'editorLineNumber.foreground': '#393a3450',
  'editorLineNumber.activeForeground': '#4e4f47',
  'editorIndentGuide.background': '#00000015',
};

const DARK_COLORS = {
  'editor.background': '#000000',
  'editorGutter.background': '#000000',
  'minimap.background': '#000000',
  'editorStickyScroll.background': '#000000',
  'editorOverviewRuler.background': '#000000',
  'editorWidget.background': '#000000',
  'editor.lineHighlightBackground': '#121212',
  'editor.selectionBackground': '#eeeeee18',
  'editor.selectionHighlightBackground': '#eeeeee10',
  'editorLineNumber.foreground': '#dedcd550',
  'editorLineNumber.activeForeground': '#bfbaaa',
  'editorIndentGuide.background': '#ffffff15',
};

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

function defineThemes() {
  monaco.editor.defineTheme('plumeria-light', {
    base: 'vs',
    inherit: true,
    rules: LIGHT_RULES,
    colors: LIGHT_COLORS,
  });
  monaco.editor.defineTheme('plumeria-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: DARK_RULES,
    colors: DARK_COLORS,
  });
}

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
  defineThemes();

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
  const providers = [
    monaco.languages.register({ id: 'plumeria-hover' }),
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
            if (lines[index]) tokens.push({ startIndex: line.length, scopes });
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
  ];

  const editor = monaco.editor.create(container, {
    model,
    theme: document.documentElement.classList.contains('dark') ? 'plumeria-dark' : 'plumeria-light',
    automaticLayout: true,
    minimap: { enabled: false },
    stickyScroll: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    'semanticHighlighting.enabled': false,
  });

  // Decorations retain semantic colors while Monaco retokenizes after a theme change.
  const semanticStyles = document.createElement('style');
  semanticStyles.textContent = [LIGHT_RULES, DARK_RULES]
    .map((rules, index) =>
      rules
        .filter(({ token }) => token)
        .map(
          ({ token, foreground }) =>
            `${index ? '.dark' : ':root:not(.dark)'} .plumeria-semantic-${token} { color: #${foreground} !important; }`,
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
      monaco.editor.setTheme(nextDark ? 'plumeria-dark' : 'plumeria-light');
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
