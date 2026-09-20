'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';

export const MarkdownActions = ({ markdownUrl }: { markdownUrl: string }) => {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [open, setOpen] = useState(false);

  async function copyPage() {
    setStatus('copying');
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) throw new Error('Markdown request failed');
      await navigator.clipboard.writeText(await response.text());
      setStatus('copied');
      setOpen(false);
    } catch {
      setStatus('error');
    }
  }

  const label =
    status === 'copied'
      ? 'Copied'
      : status === 'copying'
        ? 'Copying…'
        : status === 'error'
          ? 'Retry copy'
          : 'Copy page';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="docs-copy-actions">
        <button type="button" onClick={copyPage} disabled={status === 'copying'} className="docs-copy-button">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <rect x="8" y="8" width="12" height="13" rx="2" />
            <path d="M16 5V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h1" />
          </svg>
          <span aria-live="polite">{label}</span>
        </button>
        <PopoverTrigger className="docs-copy-toggle" aria-label="Page actions">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
          </svg>
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" className="docs-copy-menu" aria-label="Page actions">
        <button type="button" onClick={copyPage} disabled={status === 'copying'}>
          {label}
        </button>
        <a href={markdownUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          View as Markdown
        </a>
        {status === 'error' && <p role="alert">Could not copy. Try viewing the Markdown instead.</p>}
      </PopoverContent>
    </Popover>
  );
};
