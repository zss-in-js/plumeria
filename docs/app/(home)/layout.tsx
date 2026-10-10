import * as css from '@plumeria/core';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logo } from 'app/layout.config';
import { breakpoints } from 'lib/mediaQuery';
import { theme } from 'lib/theme';

const panelBg = 'color-mix(in oklab, var(--color-fd-background) 80%, transparent)';

const styles = css.create({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    height: 56,
    background: theme.pageBg,
    [breakpoints.md]: {
      ':has(:popover-open)': {
        background: panelBg,
        backdropFilter: 'blur(16px)',
      },
    },
  },
  nav: {
    boxSizing: 'border-box',
    display: 'flex',
    gap: 24,
    alignItems: 'center',
    maxWidth: 1200,
    height: '100%',
    paddingInline: 32,
    marginInline: 'auto',
    [breakpoints.md]: {
      gap: 16,
      paddingInline: 24,
    },
  },
  title: {
    color: 'var(--color-fd-foreground)',
    textDecoration: 'none',
  },
  menu: {
    position: 'static',
    display: 'flex',
    flex: 1,
    gap: 24,
    alignItems: 'center',
    width: 'auto',
    height: 'auto',
    padding: 0,
    margin: 0,
    overflow: 'visible',
    color: 'inherit',
    background: 'none',
    borderWidth: 0,
    [breakpoints.md]: {
      display: 'none',
      ':popover-open': {
        position: 'fixed',
        inset: '56px 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        alignItems: 'stretch',
        padding: '8px 24px 16px',
        background: panelBg,
        borderBottomColor: 'var(--color-fd-border)',
        borderBottomStyle: 'solid',
        borderBottomWidth: 1,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 16,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        backdropFilter: 'blur(16px)',
      },
    },
  },
  link: {
    fontSize: 14,
    color: 'var(--color-fd-muted-foreground)',
    textDecoration: 'none',
    [breakpoints.md]: {
      paddingBlock: 6,
      fontSize: 16,
      color: 'var(--color-fd-foreground)',
    },
    ':hover': {
      color: 'var(--color-fd-foreground)',
      textDecoration: 'underline',
      textUnderlineOffset: 4,
    },
  },
  external: {
    display: 'inline-flex',
    gap: 4,
    alignItems: 'center',
    marginLeft: 'auto',
    [breakpoints.md]: {
      marginLeft: 0,
    },
  },
  toggle: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    padding: 6,
    marginLeft: 'auto',
    color: 'var(--color-fd-foreground)',
    cursor: 'pointer',
    background: 'none',
    borderWidth: 0,
    borderRadius: 6,
    [breakpoints.md]: {
      display: 'inline-flex',
      ':has(+ :popover-open)': {
        background: 'color-mix(in oklab, var(--color-fd-accent) 50%, transparent)',
        transform: 'rotate(180deg)',
      },
    },
    ':hover': {
      background: 'var(--color-fd-accent)',
    },
  },
  main: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header classStyle={styles.header}>
        <nav classStyle={styles.nav}>
          <Link href="/" classStyle={styles.title}>
            {logo}
          </Link>
          <button type="button" popoverTarget="home-menu" aria-label="Toggle Menu" classStyle={styles.toggle}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div id="home-menu" popover="auto" classStyle={styles.menu}>
            <Link href="/docs" classStyle={styles.link}>
              Docs
            </Link>
            <Link href="/playground" classStyle={styles.link}>
              Playground
            </Link>
            <a
              href="https://github.com/zss-in-js/plumeria"
              target="_blank"
              rel="noreferrer noopener"
              classStyle={[styles.link, styles.external]}
            >
              GitHub
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M11 5H4v15h15v-7" />
                <path d="M14 3h7v7M21 3 11 13" />
              </svg>
            </a>
          </div>
        </nav>
      </header>
      <main classStyle={styles.main}>{children}</main>
    </>
  );
}
