import * as css from '@plumeria/core';
import Link from 'next/link';
import type { Metadata } from 'next';
import { breakpoints } from 'lib/mediaQuery';
import generateSEOData from 'lib/generateSEOData';
import { latestBlogUrl } from 'lib/source';

const styles = css.create({
  page: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    maxWidth: 1200,
    paddingInline: 32,
    marginInline: 'auto',
    [breakpoints.md]: {
      paddingInline: 24,
    },
  },
  hero: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100svh - 57px)',
    paddingBlock: 48,
    textAlign: 'center',
    [breakpoints.md]: {
      paddingBlock: 40,
    },
  },
  title: {
    margin: 0,
    fontSize: 'clamp(56px, 10vw, 112px)',
    fontWeight: 650,
    lineHeight: 1.1,
    letterSpacing: '-0.065em',
  },
  description: {
    maxWidth: 640,
    margin: '28px 0 0',
    fontSize: 'clamp(20px, 2.5vw, 28px)',
    lineHeight: 1.5,
    color: 'var(--color-fd-muted-foreground)',
    letterSpacing: '-0.02em',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginTop: 36,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 500,
    textDecoration: 'none',
    borderColor: 'var(--color-fd-border)',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: 6,
    ':hover': {
      background: 'var(--color-fd-accent)',
    },
  },
  primary: {
    color: 'var(--color-fd-background)',
    background: 'var(--color-fd-foreground)',
    borderColor: 'var(--color-fd-foreground)',
    ':hover': {
      background: 'var(--color-fd-foreground)',
      opacity: 0.85,
    },
  },
  footer: {
    paddingBlock: 40,
    marginTop: 'auto',
    borderTopColor: 'var(--color-fd-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 1,
  },
  groups: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 32,
    [breakpoints.sm]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
  heading: {
    margin: '0 0 16px',
    fontSize: 14,
    fontWeight: 600,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
  link: {
    fontSize: 14,
    color: 'var(--color-fd-muted-foreground)',
    textDecoration: 'none',
    ':hover': {
      color: 'var(--color-fd-foreground)',
      textDecoration: 'underline',
      textUnderlineOffset: 4,
    },
  },
});
const groups = [
  {
    title: 'Develop',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API reference', href: '/docs/api-reference' },
      { label: 'Integrations', href: '/docs/integration' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Why Plumeria?', href: '/docs/why-plumeria' },
      { label: 'Blog', href: latestBlogUrl },
      { label: 'CSS references', href: '/docs/specificity' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'GitHub', href: 'https://github.com/zss-in-js/plumeria' },
      { label: 'AI agent resources', href: '/docs/ai-agent-resources' },
      { label: 'llms.txt', href: '/llms.txt' },
    ],
  },
];
export const metadata: Metadata = generateSEOData({
  title: 'Plumeria - Zero-cost abstraction layer',
  subtitle: 'Plumeria is a zero-cost abstraction layer for styling React components.',
});
export default function Page() {
  return (
    <div classStyle={styles.page}>
      <main classStyle={styles.hero}>
        <h1 classStyle={styles.title}>Plumeria</h1>
        <p classStyle={styles.description}>
          Type-safe styling for React.
          <br />
          Compiled to atomic CSS. Zero runtime.
        </p>
        <div classStyle={styles.actions}>
          <Link href="/docs" classStyle={[styles.button, styles.primary]}>
            Get started
          </Link>
          <Link href="/docs/why-plumeria" classStyle={styles.button}>
            Why Plumeria?
          </Link>
        </div>
      </main>
      <footer classStyle={styles.footer}>
        <nav aria-label="Resources" classStyle={styles.groups}>
          {groups.map((group) => (
            <div key={group.title}>
              <h2 classStyle={styles.heading}>{group.title}</h2>
              <ul classStyle={styles.list}>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} classStyle={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </footer>
    </div>
  );
}
