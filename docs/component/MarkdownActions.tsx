'use client';

import * as css from '@plumeria/core';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { theme } from 'lib/theme';

const styles = css.create({
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
    height: 30,
    paddingInline: 10,
    fontSize: 13,
    color: theme.textSecondary,
    textDecoration: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    borderColor: theme.cardBorder,
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: 6,
    ':hover': {
      color: theme.textPrimary,
      borderColor: theme.cardHoverBorder,
    },
  },
});

export const MarkdownActions = ({ markdownUrl }: { markdownUrl: string }) => {
  const [copied, onClick] = useCopyButton(async () => {
    const res = await fetch(markdownUrl);
    await navigator.clipboard.writeText(await res.text());
  });

  return (
    <div classStyle={styles.row}>
      <button type="button" onClick={onClick} classStyle={styles.button}>
        {copied ? 'Copied' : 'Copy as Markdown'}
      </button>
      <a href={markdownUrl} target="_blank" rel="noreferrer" classStyle={styles.button}>
        View as Markdown
      </a>
    </div>
  );
};
