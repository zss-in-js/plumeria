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

      <p classStyle={styles.text}>
        This policy covers plumeria.dev and the Plumeria plugins for Claude, ChatGPT, and Codex. The plugins contain
        only a skill: written instructions for writing, reviewing, and fixing Plumeria styles. They include no MCP
        server and no code that runs on our side.
      </p>

      <h2 classStyle={styles.heading}>Personal data we collect</h2>
      <p classStyle={styles.text}>
        The plugins collect no personal data. They do not send your prompts, files, or conversations to us or to anyone
        else. Your conversations are handled by the AI product you use the plugin in, under that provider&apos;s own
        privacy policy.
      </p>
      <p classStyle={styles.text}>
        plumeria.dev uses Vercel Web Analytics to count page views. Each page view records the page URL, the referrer,
        the country and region, the browser, the operating system, and the device type. It sets no cookies, and visitors
        are counted by a hash of the request instead of an identifier.
      </p>

      <h2 classStyle={styles.heading}>How we use it</h2>
      <p classStyle={styles.text}>
        We use the aggregated page view counts only to see which documentation is read and to improve it. We do not use
        them to identify you, for advertising, or for profiling.
      </p>

      <h2 classStyle={styles.heading}>Who receives it</h2>
      <p classStyle={styles.text}>
        Vercel, which hosts plumeria.dev, processes the page view data as our service provider. We do not sell or share
        it with anyone else.
      </p>

      <h2 classStyle={styles.heading}>How long we keep it</h2>
      <p classStyle={styles.text}>
        The visitor hash is discarded after 24 hours. The aggregated statistics are kept in Vercel&apos;s dashboard for
        the retention period of the hosting plan and are then deleted by Vercel.
      </p>

      <h2 classStyle={styles.heading}>Your choices</h2>
      <p classStyle={styles.text}>
        You can block the analytics script with a content blocker without losing any part of the site. Your color theme
        preference is saved in your browser&apos;s local storage, never leaves your device, and is removed when you
        clear your site data. To stop using a plugin, uninstall it from the AI product you added it to.
      </p>

      <h2 classStyle={styles.heading}>Contact</h2>
      <p classStyle={styles.text}>
        For questions about this policy or help with the plugins, open an issue on{' '}
        <Link href="https://github.com/zss-in-js/plumeria/issues" classStyle={styles.link}>
          GitHub
        </Link>
        .
      </p>
    </main>
  );
}
