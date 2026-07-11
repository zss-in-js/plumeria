import * as css from '@plumeria/core';
import type { ReactNode } from 'react';
import { breakpoints } from 'lib/mediaQuery';
import Link from 'next/link';
import { pseudos } from 'lib/pseudos';
import { theme } from 'lib/theme';

const styles = css.create({
  button: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--padding)',
    overflow: 'hidden',
    fontSize: 'var(--font-size)',
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: '1px',
    background: 'var(--bg-gradient)',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transitionDuration: '0.2s',
    '[disabled]': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    '@media (any-hover: hover)': {
      [pseudos.hover]: {
        scale: 1.03,
      },
    },
  },
  base: {
    color: theme.textMainHeaderLine,
    background: theme.cardBg,
    borderRadius: '16px',
    boxShadow: theme.cardBoxShadow,
    transition: 'all 0.3s ease',
    [breakpoints.md]: {
      padding: '12px 24px',
    },
  },
});

const sizeStyles = css.create({
  medium: {
    '--padding': '12px 32px',
    '--font-size': '12px',
    '--border-radius': '12px',
    [breakpoints.md]: {
      '--padding': '10px 24px',
      '--font-size': '11px',
    },
  },
});

type Props = {
  children: ReactNode;
  href: string;
};

export const ButtonLink = ({ children, href }: Props) => {
  return (
    <Link href={href} styleName={[styles.button, styles.base, sizeStyles.medium]}>
      {children}
    </Link>
  );
};
