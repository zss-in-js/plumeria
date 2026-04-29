import * as css from '@plumeria/core';
import type { ReactNode } from 'react';
import { breakpoints } from 'lib/mediaQuery';
import Link from 'next/link';
import { pseudos } from 'lib/pseudos';

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
    cursor: 'pointer',
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
    ':active': {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
    },
    ':focus': {
      outline: 'none',
    },
  },
  getstarted: {
    color: 'var(--text-main-header-line)',
    background: 'var(--card-bg)',
    borderRadius: '16px',
    boxShadow: 'var(--card-box-shadow)',
    transition: 'all 0.3s ease',
    [pseudos.hover]: {
      scale: 1.1,
    },
    [breakpoints.md]: {
      padding: '12px 24px',
    },
  },
  installation: {
    color: 'var(--text-main-header-line)',
    background: 'var(--card-bg)',
    borderRadius: '16px',
    boxShadow: 'var(--card-box-shadow)',
    transition: 'all 0.3s ease',
    [pseudos.hover]: {
      scale: 1.05,
    },
    [breakpoints.md]: {
      padding: '12px 24px',
    },
  },
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

const getButtonStyle = css.variants({
  variant: {
    getstarted: styles.getstarted,
    installation: styles.installation,
  },
  size: {
    medium: styles.medium,
  },
});

interface Props {
  children: ReactNode;
  variant: 'getstarted' | 'installation';
  href: string;
}

export const ButtonLink = ({ children, variant, href }: Props) => {
  return (
    <Link href={href} styleName={[styles.button, getButtonStyle({ variant, size: 'medium' })]}>
      {children}
    </Link>
  );
};
