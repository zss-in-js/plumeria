'use client';

import { useEffect, useRef, useState } from 'react';
import * as css from '@plumeria/core';
import { theme } from 'lib/theme';
import { breakpoints } from 'lib/mediaQuery';
import { ENTRY, EXAMPLES, exampleFromSearch } from './sample';
import type { ExampleName } from './sample';
import type { OutputKind, PlaygroundHandle } from './editor';
import { loadEngine, onEngineProgress } from './engine';
import type { SpellingPolicy } from './engine-types';

const POLICIES: { value: SpellingPolicy; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'logical', label: 'Logical only' },
  { value: 'physical', label: 'Physical only' },
];

const EXAMPLE_LINKS: { value: ExampleName; label: string }[] = [
  { value: 'card', label: 'Card' },
  { value: 'merge', label: 'Last style wins' },
];

type OutputTab = OutputKind | 'preview';

const OUTPUT_TABS: { value: OutputTab; label: string }[] = [
  { value: 'jsx', label: 'JSX' },
  { value: 'css', label: 'CSS' },
  { value: 'preview', label: 'Preview' },
];

const styles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gridArea: 'main',
    height: 'calc(var(--fd-docs-height) - var(--fd-header-height))',
    overflow: 'hidden',
    color: theme.textPrimary,
  },
  bar: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    fontSize: 13,
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    [breakpoints.lg]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  tabs: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    paddingInline: 12,
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  tabList: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  tab: {
    padding: '8px 12px',
    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
    fontSize: 12,
    color: theme.textMuted,
    cursor: 'pointer',
    background: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderBottomColor: 'transparent',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    ':hover': {
      color: theme.textPrimary,
    },
  },
  tabActive: {
    color: theme.textPrimary,
    borderBottomColor: 'var(--plumeria-accent)',
  },
  pane: {
    display: 'flex',
    flexDirection: 'column',
    gridArea: 'editor',
    minWidth: 0,
    minHeight: 0,
  },
  editorBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: 13,
  },
  label: {
    color: theme.textMuted,
  },
  group: {
    display: 'flex',
    gap: 4,
    padding: 3,
    background: theme.iconBg,
    borderRadius: 8,
  },
  option: {
    padding: '4px 10px',
    fontSize: 12,
    color: theme.textSecondary,
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: 6,
  },
  optionActive: {
    color: theme.textPrimary,
    background: theme.dropdownBg,
  },
  actions: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  action: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
    padding: '6px 9px',
    fontSize: 12,
    color: theme.textSecondary,
    cursor: 'pointer',
    background: 'transparent',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: 6,
    ':hover': {
      color: theme.textPrimary,
      background: theme.iconBg,
    },
    ':disabled': {
      cursor: 'default',
      opacity: 0.4,
    },
    ':focus-visible': {
      outline: '2px solid var(--plumeria-accent)',
      outlineOffset: 2,
    },
  },
  count: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    padding: '10px 16px',
    fontVariantNumeric: 'tabular-nums',
    color: theme.textSecondary,
    [breakpoints.lg]: {
      justifyContent: 'flex-start',
      paddingTop: 0,
    },
  },
  split: {
    display: 'grid',
    flex: 1,
    gridTemplateAreas: '"editor preview" "tabs preview" "output preview"',
    gridTemplateRows: 'minmax(0, 1fr) auto minmax(0, 0.7fr)',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    minHeight: 0,
    [breakpoints.lg]: {
      gridTemplateAreas: '"editor" "tabs" "output"',
      gridTemplateRows: 'minmax(0, 1fr) auto minmax(0, 1fr)',
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  splitCollapsed: {
    [breakpoints.lgUp]: {
      gridTemplateRows: 'minmax(0, 1fr) auto 0',
    },
  },
  outputBar: {
    display: 'flex',
    gridArea: 'tabs',
    gap: 4,
    alignItems: 'center',
    paddingInline: 12,
    borderTopColor: theme.cardBorder,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  outputTab: {
    [breakpoints.lg]: {
      paddingBlock: 26,
    },
  },
  previewTab: {
    [breakpoints.lgUp]: {
      display: 'none',
    },
  },
  tabActiveWide: {
    [breakpoints.lgUp]: {
      color: theme.textPrimary,
      borderBottomColor: 'var(--plumeria-accent)',
    },
  },
  collapse: {
    [breakpoints.lg]: {
      display: 'none',
    },
  },
  chevronCollapsed: {
    transform: 'rotate(180deg)',
  },
  output: {
    gridArea: 'output',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  narrowHidden: {
    [breakpoints.lg]: {
      display: 'none',
    },
  },
  editor: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  preview: {
    gridArea: 'preview',
    width: '100%',
    minWidth: 0,
    height: '100%',
    minHeight: 0,
    background: theme.dropdownBg,
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderLeftColor: theme.cardBorder,
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    [breakpoints.lg]: {
      gridArea: 'output',
      borderLeftStyle: 'none',
    },
  },
  status: {
    padding: '10px 16px',
    fontSize: 12,
    color: theme.textMuted,
    borderTopColor: theme.cardBorder,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});

function isDark() {
  return document.documentElement.classList.contains('dark');
}

export function Playground() {
  const container = useRef<HTMLDivElement>(null);
  const output = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLIFrameElement>(null);
  const handle = useRef<PlaygroundHandle | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [downloaded, setDownloaded] = useState(0);
  const ready = editorReady && previewReady;
  const progress = downloaded * 0.85 + (editorReady ? 0.1 : 0) + (previewReady ? 0.05 : 0);
  const [example, setExample] = useState<ExampleName>('card');
  const [policy, setPolicy] = useState<SpellingPolicy>('off');
  const [file, setFile] = useState(ENTRY);
  const [outputTab, setOutputTab] = useState<OutputTab>('preview');
  const [outputOpen, setOutputOpen] = useState(true);
  const [status, setStatus] = useState('Loading TypeScript and the Plumeria rules…');
  const [counts, setCounts] = useState({ errors: 0, warnings: 0 });

  useEffect(() => {
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const reloadedHere = navigation?.type === 'reload' && new URL(navigation.name).pathname === location.pathname;
    if (!self.crossOriginIsolated && !reloadedHere) {
      location.reload();
      return;
    }

    let disposed = false;
    const name = exampleFromSearch(location.search);
    setExample(name);

    const stopProgress = onEngineProgress(setDownloaded);

    const load = async () => {
      const [{ mount }] = await Promise.all([import('./editor'), loadEngine()]);
      if (disposed || !container.current || !output.current || !preview.current) return;
      handle.current = await mount(
        container.current,
        output.current,
        preview.current,
        EXAMPLES[name],
        ENTRY,
        (errors, warnings) => setCounts({ errors, warnings }),
        setFile,
      );
      if (disposed) {
        handle.current.dispose();
        return;
      }
      setEditorReady(true);
      setStatus('Hover for types. ⌘S / Ctrl+S / Alt+S to apply ESLint fixes.');
    };

    void load().catch((error: unknown) => {
      if (disposed) return;
      setFailed(true);
      setStatus(error instanceof Error ? error.message : String(error));
    });

    const onPreviewRendered = (event: MessageEvent<{ type?: string }>) => {
      if (event.source === preview.current?.contentWindow && event.data?.type === 'playground:rendered') {
        setPreviewReady(true);
      }
    };
    window.addEventListener('message', onPreviewRendered);

    const observer = new MutationObserver(() => handle.current?.setTheme(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      disposed = true;
      stopProgress();
      observer.disconnect();
      window.removeEventListener('message', onPreviewRendered);
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    handle.current?.setPolicy(policy);
  }, [policy]);

  useEffect(() => {
    handle.current?.setFile(file);
  }, [file]);

  useEffect(() => {
    if (outputTab !== 'preview') handle.current?.setOutput(outputTab);
  }, [outputTab, editorReady]);

  async function copySource() {
    if (!handle.current) return;
    try {
      await navigator.clipboard.writeText(handle.current.getSource());
      setStatus('Copied to clipboard.');
    } catch {
      setStatus('Could not copy. Select the editor text and copy manually.');
    }
  }

  return (
    <div classStyle={styles.root}>
      <div classStyle={styles.bar}>
        <div classStyle={styles.editorBar}>
          <span classStyle={styles.label}>Example</span>
          <div classStyle={styles.group}>
            {EXAMPLE_LINKS.map((item) => (
              <a
                key={item.value}
                href={item.value === 'card' ? '/playground' : `/playground?example=${item.value}`}
                aria-current={example === item.value ? 'page' : undefined}
                classStyle={[styles.option, example === item.value && styles.optionActive]}
              >
                {item.label}
              </a>
            ))}
          </div>
          <span classStyle={styles.label}>Property spelling</span>
          <div classStyle={styles.group}>
            {POLICIES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPolicy(item.value)}
                classStyle={[styles.option, policy === item.value && styles.optionActive]}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <span classStyle={styles.count}>
          <span>{counts.errors} errors</span>
          <span>{counts.warnings} warnings</span>
        </span>
      </div>
      <div
        classStyle={[styles.split, !outputOpen && styles.splitCollapsed]}
        data-playground="stage"
        data-ready={ready || failed}
        aria-busy={!ready && !failed}
      >
        <div className="playground-loading" role="status">
          <span className="playground-loading-mark" aria-hidden="true">
            ✳
          </span>
          <span
            className="playground-loading-bar"
            role="progressbar"
            aria-label="Loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span className="playground-loading-fill" style={{ transform: `scaleX(${progress})` }} />
          </span>
          <span>Preparing your playground…</span>
        </div>
        <div classStyle={styles.pane}>
          <div classStyle={styles.tabs}>
            <div classStyle={styles.tabList} role="tablist" aria-label="Playground files">
              {EXAMPLES[example].map((item) => (
                <button
                  key={item.path}
                  type="button"
                  role="tab"
                  aria-selected={file === item.path}
                  onClick={() => setFile(item.path)}
                  classStyle={[styles.tab, file === item.path && styles.tabActive]}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div classStyle={styles.actions}>
              <button
                type="button"
                classStyle={styles.action}
                disabled={!editorReady}
                title="Reset to the sample"
                aria-label="Reset code to the sample"
                onClick={() => {
                  handle.current?.reset();
                  setFile(ENTRY);
                  setStatus('Sample restored. Undo to recover your edits.');
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <path d="M20 7v5h-5M20 12a8 8 0 1 0-2 5M20 7v5" />
                </svg>
                Reset
              </button>
              <button
                type="button"
                classStyle={styles.action}
                disabled={!editorReady}
                onClick={copySource}
                title="Copy code"
                aria-label="Copy code"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M16 8V4H4v12h4" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          <div ref={container} classStyle={styles.editor} />
        </div>
        <div classStyle={styles.outputBar}>
          <div classStyle={styles.tabList} role="tablist" aria-label="Compiled output">
            {OUTPUT_TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={outputTab === item.value}
                onClick={() => {
                  setOutputTab(item.value);
                  setOutputOpen(true);
                }}
                classStyle={[
                  styles.tab,
                  styles.outputTab,
                  outputTab === item.value && styles.tabActive,
                  item.value === 'preview' && styles.previewTab,
                  item.value === 'jsx' && outputTab === 'preview' && styles.tabActiveWide,
                ]}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div classStyle={[styles.actions, styles.collapse]}>
            <button
              type="button"
              classStyle={styles.action}
              aria-expanded={outputOpen}
              aria-label={outputOpen ? 'Collapse the compiled output' : 'Expand the compiled output'}
              onClick={() => setOutputOpen(!outputOpen)}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
                classStyle={!outputOpen && styles.chevronCollapsed}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
        <div ref={output} classStyle={[styles.output, outputTab === 'preview' && styles.narrowHidden]} />
        <iframe
          ref={preview}
          classStyle={[styles.preview, outputTab !== 'preview' && styles.narrowHidden]}
          src="/playground/preview/index.html"
          title="Preview"
        />
      </div>
      <p role="status" classStyle={styles.status}>
        {status}
      </p>
    </div>
  );
}
