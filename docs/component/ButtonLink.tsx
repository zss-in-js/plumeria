import * as css from '@plumeria/core';
import type { ReactNode } from 'react';
import { gradientShift } from './animation';
import { breakpoints } from 'lib/mediaQuery';
import Link from 'next/link';

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
    transition: 'all 0.16s ease-in-out',
    '[disabled]': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    ':hover': {
      boxShadow: '0 7px 10px rgba(0, 0, 0, 0.15)',
      filter: 'brightness(0.95)',
    },
    ':active': {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      filter: 'brightness(0.9)',
    },
    ':focus': {
      outline: 'none',
    },
  },
  gradient: {
    background: 'var(--plume-accent)',
    
  },
  metallic: {
    color: '#333536',
    background: '#c3c3c3',
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
    gradient: styles.gradient,
    metallic: styles.metallic,
  },
  size: {
    medium: styles.medium,
  },
});

interface Props {
  children: ReactNode;
  variant: 'gradient' | 'metallic';
  href: string;
}

export const ButtonLink = ({ children, variant, href }: Props) => {
  return (
    <Link href={href} className={css.props(styles.button, getButtonStyle({ variant, size: 'medium' }))}>
      {children}
    </Link>
  );
};
