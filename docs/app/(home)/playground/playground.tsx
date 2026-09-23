'use client';

import { useEffect, useRef, useState } from 'react';
import * as css from '@plumeria/core';
import { theme } from 'lib/theme';
import { breakpoints } from 'lib/mediaQuery';
import { ENTRY, SAMPLE_FILES } from './sample';
import type { PlaygroundHandle } from './editor';
import type { SpellingPolicy } from './engine-types';

const POLICIES: { value: SpellingPolicy; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'logical', label: 'Logical only' },
  { value: 'physical', label: 'Physical only' },
];

const styles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100dvh - 57px)',
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
      color: theme.textPrimary
    },
  },
  tabActive: {
    color: theme.textPrimary,
    borderBottomColor: '#63a6bb',
  },
  pane: {
    display: 'flex',
    flexDirection: 'column',
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
      outline: '2px solid #63a6bb',
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
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    minHeight: 0,
    [breakpoints.lg]: {
      gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)',
      gridTemplateColumns: 'minmax(0, 1fr)'
    },
  },
  editor: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  preview: {
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
      borderTopColor: theme.cardBorder,
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderLeftStyle: 'none'
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
  const preview = useRef<HTMLIFrameElement>(null);
  const handle = useRef<PlaygroundHandle | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready = editorReady && previewReady;
  const [policy, setPolicy] = useState<SpellingPolicy>('off');
  const [file, setFile] = useState(ENTRY);
  const [status, setStatus] = useState('Loading TypeScript and the Plumeria rules…');
  const [counts, setCounts] = useState({ errors: 0, warnings: 0 });

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      const { mount } = await import('./editor');
      if (disposed || !container.current || !preview.current) return;
      handle.current = await mount(container.current, preview.current, SAMPLE_FILES, ENTRY, (errors, warnings) =>
        setCounts({ errors, warnings }),
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
    <main classStyle={styles.root}>
      <div classStyle={styles.bar}>
        <div classStyle={styles.editorBar}>
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
        <span classStyle={styles.count}>
          <span>{counts.errors} errors</span>
          <span>{counts.warnings} warnings</span>
        </span>
      </div>
      <div
        classStyle={styles.split}
        data-playground="stage"
        data-ready={ready || failed}
        aria-busy={!ready && !failed}
      >
        <div className="playground-loading" role="status">
          <span className="playground-loading-mark" aria-hidden="true">
            ✳
          </span>
          <span>Preparing your playground…</span>
        </div>
        <div classStyle={styles.pane}>
          <div classStyle={styles.tabs} role="tablist" aria-label="Playground files">
            {SAMPLE_FILES.map((item) => (
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
          <div ref={container} classStyle={styles.editor} />
        </div>
        <iframe ref={preview} classStyle={styles.preview} src="/playground/preview/index.html" title="Preview" />
      </div>
      <p role="status" classStyle={styles.status}>
        {status}
      </p>
    </main>
  );
}
