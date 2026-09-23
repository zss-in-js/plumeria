import * as monaco from 'monaco-editor/editor';
import 'monaco-editor/features/register.all';
import 'monaco-editor/languages/definitions/typescript/register';
import { loadEngine } from './engine';
import type { LintMessage, SpellingPolicy } from './engine-types';

const FILE_NAME = '/playground.tsx';

const LIGHT_RULES: monaco.editor.ITokenThemeRule[] = [
  { token: 'namespace', foreground: '267f99' },
  { token: 'class', foreground: '267f99' },
  { token: 'interface', foreground: '267f99' },
  { token: 'enum', foreground: '267f99' },
  { token: 'type', foreground: '267f99' },
  { token: 'typeParameter', foreground: '267f99' },
  { token: 'function', foreground: '795e26' },
  { token: 'member', foreground: '795e26' },
  { token: 'variable', foreground: '001080' },
  { token: 'parameter', foreground: '001080' },
  { token: 'property', foreground: '001080' },
  { token: 'enumMember', foreground: '0070c1' },
];

const DARK_RULES: monaco.editor.ITokenThemeRule[] = [
  { token: 'namespace', foreground: '4ec9b0' },
  { token: 'class', foreground: '4ec9b0' },
  { token: 'interface', foreground: '4ec9b0' },
  { token: 'enum', foreground: '4ec9b0' },
  { token: 'type', foreground: '4ec9b0' },
  { token: 'typeParameter', foreground: '4ec9b0' },
  { token: 'function', foreground: 'dcdcaa' },
  { token: 'member', foreground: 'dcdcaa' },
  { token: 'variable', foreground: '9cdcfe' },
  { token: 'parameter', foreground: '9cdcfe' },
  { token: 'property', foreground: '9cdcfe' },
  { token: 'enumMember', foreground: '4fc1ff' },
];

const TRANSPARENT_COLORS = {
  'editor.background': '#00000000',
  'editorGutter.background': '#00000000',
  'minimap.background': '#00000000',
  'editorStickyScroll.background': '#00000000',
  'editorOverviewRuler.background': '#00000000',
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
    colors: TRANSPARENT_COLORS,
  });
  monaco.editor.defineTheme('plumeria-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: DARK_RULES,
    colors: TRANSPARENT_COLORS,
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
  setPolicy: (policy: SpellingPolicy) => void;
  setTheme: (dark: boolean) => void;
  dispose: () => void;
};

export async function mount(
  container: HTMLElement,
  preview: HTMLIFrameElement,
  source: string,
  dark: boolean,
  onCount: (errors: number, warnings: number) => void,
): Promise<PlaygroundHandle> {
  setupEnvironment();
  defineThemes();

  const engine = await loadEngine();
  const session = await engine.createSession(source);
  const tokenTypes = [...engine.tokenTypes];

  const model = monaco.editor.createModel(source, 'typescript', monaco.Uri.file(FILE_NAME));

  const providers = [
    monaco.languages.registerHoverProvider('typescript', {
      provideHover(target: monaco.editor.ITextModel, position: monaco.Position) {
        const info = session.quickInfo(target.getOffsetAt(position));
        if (!info) return null;

        const start = target.getPositionAt(info.start);
        const end = target.getPositionAt(info.start + info.length);

        return {
          range: monaco.Range.fromPositions(start, end),
          contents: [
            { value: '```typescript\n' + info.signature + '\n```' },
            ...(info.documentation ? [{ value: info.documentation }] : []),
            ...(info.tags ? [{ value: info.tags }] : []),
          ],
        };
      },
    }),
    monaco.languages.registerDocumentRangeSemanticTokensProvider('typescript', {
      getLegend: () => ({ tokenTypes, tokenModifiers: [] }),
      provideDocumentRangeSemanticTokens(target: monaco.editor.ITextModel, range: monaco.Range) {
        const start = target.getOffsetAt(range.getStartPosition());
        const spans = session.classifications(start, target.getOffsetAt(range.getEndPosition()) - start);

        const data: number[] = [];
        let previousLine = 0;
        let previousChar = 0;

        for (let index = 0; index < spans.length; index += 3) {
          const encoded = spans[index + 2];
          const tokenType = (encoded >> 8) - 1;
          if (tokenType < 0 || tokenType >= tokenTypes.length) continue;

          const position = target.getPositionAt(spans[index]);
          const line = position.lineNumber - 1;
          const character = position.column - 1;

          data.push(
            line - previousLine,
            line === previousLine ? character - previousChar : character,
            spans[index + 1],
            tokenType,
            0,
          );
          previousLine = line;
          previousChar = character;
        }

        return { data: new Uint32Array(data) };
      },
    }),
  ];

  const editor = monaco.editor.create(container, {
    model,
    theme: dark ? 'plumeria-dark' : 'plumeria-light',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    'semanticHighlighting.enabled': true,
  });

  let policy: SpellingPolicy = 'off';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let previewReady = false;

  function sendTheme(nextDark: boolean) {
    if (!previewReady) return;
    preview.contentWindow?.postMessage({ type: 'playground:theme', dark: nextDark }, '*');
  }

  function sendPreview(code: string) {
    if (!previewReady) return;
    preview.contentWindow?.postMessage({ type: 'playground:render', code: session.transpile(code) }, '*');
  }

  const onPreviewMessage = (event: MessageEvent<{ type?: string }>) => {
    if (event.source !== preview.contentWindow || event.data?.type !== 'playground:ready') return;
    previewReady = true;
    sendTheme(document.documentElement.classList.contains('dark'));
    sendPreview(model.getValue());
  };

  const onPreviewLoad = () => {
    previewReady = true;
    sendTheme(document.documentElement.classList.contains('dark'));
    sendPreview(model.getValue());
  };

  window.addEventListener('message', onPreviewMessage);
  preview.addEventListener('load', onPreviewLoad);

  if (preview.contentDocument?.readyState === 'complete') onPreviewLoad();

  function run() {
    const code = model.getValue();
    session.update(code);

    const typeErrors = session.diagnostics().map((diagnostic) => {
      const start = model.getPositionAt(diagnostic.start);
      const end = model.getPositionAt(diagnostic.start + diagnostic.length);
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

    const messages = session.lint(code, policy);
    let errors = 0;
    let warnings = 0;

    for (const message of messages) {
      if (message.severity === 2) errors += 1;
      else warnings += 1;
    }

    monaco.editor.setModelMarkers(model, 'ts', typeErrors);
    monaco.editor.setModelMarkers(model, 'plumeria', messages.map(toMarker));
    onCount(errors, warnings);

    if (typeErrors.length === 0) sendPreview(code);
  }

  const subscription = model.onDidChangeContent(() => {
    clearTimeout(timer);
    timer = setTimeout(run, 250);
  });

  run();

  return {
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
      window.removeEventListener('message', onPreviewMessage);
      preview.removeEventListener('load', onPreviewLoad);
      subscription.dispose();
      for (const provider of providers) provider.dispose();
      editor.dispose();
      model.dispose();
    },
  };
}
