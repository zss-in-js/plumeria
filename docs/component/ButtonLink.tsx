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
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0 7px 10px rgba(0, 0, 0, 0.15)',
      filter: 'brightness(0.95)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      filter: 'brightness(0.9)',
      transform: 'translateY(-1px) scale(0.98)',
    },
    '&:focus': {
      outline: 'none',
    },
    '&[disabled]': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  // Variants
  gradient: {
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    backgroundSize: '400% 400%',
    border: '1px solid transparent',
    animationName: gradientShift,
    animationDuration: '15s',
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
  },
  metallic: {
    color: '#18181b',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
    background: 'linear-gradient(145deg, #d4d4d8, #a1a1aa, #71717a, #a1a1aa, #d4d4d8)',
    backgroundSize: '200% 200%',
    border: '1px solid rgba(0,0,0,0.2)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2)',
    '&:hover': {
      filter: 'brightness(1.1)',
    },
  },
  // Sizes
  small: {
    '--padding': '8px 24px',
    '--font-size': '10px',
    '--border-radius': '8px',
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
  large: {
    '--padding': '16px 40px',
    '--font-size': '14px',
    '--border-radius': '14px',
  },
});

const getButtonStyle = css.variants({
  variant: {
    gradient: styles.gradient,
    metallic: styles.metallic,
  },
  size: {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
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
