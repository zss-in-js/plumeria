import * as css from '@plumeria/core';
import Link from 'next/link';
import type { Metadata } from 'next';
import { breakpoints } from 'lib/mediaQuery';
import generateSEOData from 'lib/generateSEOData';

const styles = css.create({
  page: {
    width: '100%',
    maxWidth: 720,
    paddingBlock: 64,
    paddingInline: 32,
    marginInline: 'auto',
    [breakpoints.md]: {
      paddingInline: 24,
    },
  },
  title: {
    margin: '0 0 8px',
    fontSize: 32,
    fontWeight: 700,
  },
  updated: {
    margin: '0 0 40px',
    fontSize: 14,
    color: 'var(--color-fd-muted-foreground)',
  },
  heading: {
    margin: '40px 0 12px',
    fontSize: 20,
    fontWeight: 600,
  },
  text: {
    margin: '0 0 12px',
    lineHeight: 1.7,
    color: 'var(--color-fd-muted-foreground)',
  },
  link: {
    color: 'var(--color-fd-foreground)',
    textDecoration: 'underline',
    textUnderlineOffset: 4,
  },
});

export const metadata: Metadata = generateSEOData({
  title: 'Privacy Policy',
  subtitle: 'How plumeria.dev and the Plumeria plugins handle your data.',
  path: '/privacy',
});

export default function Page() {
  return (
    <main classStyle={styles.page}>
      <h1 classStyle={styles.title}>Privacy Policy</h1>
      <p classStyle={styles.updated}>Last updated: October 5, 2026</p>

      <h2 classStyle={styles.heading}>Plumeria plugins</h2>
      <p classStyle={styles.text}>
        The Plumeria plugins for Claude, ChatGPT, and Codex contain only a skill: written instructions for writing,
        reviewing, and fixing Plumeria styles. They include no MCP server and no code that runs on our side. They do
        not collect, store, or send any personal data, prompts, or files to us or to any third party.
      </p>
      <p classStyle={styles.text}>
        Your conversations are handled by the AI product you use the plugin in, under that provider&apos;s own privacy
        policy.
      </p>

      <h2 classStyle={styles.heading}>plumeria.dev</h2>
      <p classStyle={styles.text}>
        This site uses Vercel Web Analytics to count page views. It does not use cookies and reports only aggregated,
        anonymous data such as the page visited, the referrer, and the country. We do not use this data to identify
        you.
      </p>
      <p classStyle={styles.text}>
        Your color theme preference is saved in your browser&apos;s local storage and never leaves your device.
      </p>

      <h2 classStyle={styles.heading}>Contact</h2>
      <p classStyle={styles.text}>
        For questions about this policy, open an issue on{' '}
        <Link href="https://github.com/zss-in-js/plumeria/issues" classStyle={styles.link}>
          GitHub
        </Link>
        .
      </p>
    </main>
  );
}
