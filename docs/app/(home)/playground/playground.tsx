'use client';

import { useEffect, useRef, useState } from 'react';
import * as css from '@plumeria/core';
import { theme } from 'lib/theme';
import { SAMPLE } from './sample';
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
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: 13,
    borderBottomColor: theme.cardBorder,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
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
  spacer: {
    marginLeft: 'auto',
  },
  count: {
    display: 'flex',
    gap: 12,
    fontVariantNumeric: 'tabular-nums',
    color: theme.textSecondary,
  },
  editor: {
    flex: 1,
    minHeight: 0,
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
  const handle = useRef<PlaygroundHandle | null>(null);
  const [policy, setPolicy] = useState<SpellingPolicy>('off');
  const [status, setStatus] = useState('Loading TypeScript and the Plumeria rules…');
  const [counts, setCounts] = useState({ errors: 0, warnings: 0 });

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      const { mount } = await import('./editor');
      if (disposed || !container.current) return;
      handle.current = await mount(container.current, SAMPLE, isDark(), (errors, warnings) =>
        setCounts({ errors, warnings }),
      );
      if (disposed) {
        handle.current.dispose();
        return;
      }
      setStatus('Hover any identifier for its type. All @plumeria/eslint-plugin rules run on every keystroke.');
    };

    void load().catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : String(error));
    });

    const observer = new MutationObserver(() => handle.current?.setTheme(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      disposed = true;
      observer.disconnect();
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    handle.current?.setPolicy(policy);
  }, [policy]);

  return (
    <main classStyle={styles.root}>
      <div classStyle={styles.bar}>
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
        <span classStyle={[styles.count, styles.spacer]}>
          <span>{counts.errors} errors</span>
          <span>{counts.warnings} warnings</span>
        </span>
      </div>
      <div ref={container} classStyle={styles.editor} />
      <p classStyle={styles.status}>{status}</p>
    </main>
  );
}
