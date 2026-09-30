'use client';

import { useEffect, useState } from 'react';
import * as css from '@plumeria/core';

const command = 'npx @plumeria/init';

const styles = css.create({
  setup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  label: {
    fontSize: 12,
    color: 'var(--color-fd-muted-foreground)',
  },
  button: {
    position: 'relative',
    padding: 0,
    cursor: 'pointer',
    background: 'none',
    borderStyle: 'none',
  },
  command: {
    fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, monospace',
    fontSize: 13,
  },
  dollar: {
    userSelect: 'none',
  },
  toast: {
    position: 'absolute',
    top: '50%',
    left: 'calc(100% + 8px)',
    padding: '4px 8px',
    fontSize: 12,
    color: 'var(--color-fd-popover-foreground)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    background: 'var(--color-fd-popover)',
    borderColor: 'var(--color-fd-border)',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: 6,
    transform: 'translateY(-50%)',
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
});

export function InitCommand() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div classStyle={styles.setup}>
      <span classStyle={styles.label}>In your project</span>
      <button type="button" onClick={copy} aria-label={`Copy ${command}`} classStyle={styles.button}>
        <code classStyle={styles.command}>
          <span classStyle={styles.dollar}>$ </span>
          {command}
        </code>
        <span role="status" classStyle={[styles.toast, copied && styles.visible]}>
          {copied ? 'Copied' : ''}
        </span>
      </button>
    </div>
  );
}
