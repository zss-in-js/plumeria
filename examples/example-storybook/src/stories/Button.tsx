import * as css from '@plumeria/core';
import { useState, type ReactNode, type MouseEvent } from 'react';
import {
  rippleEffect,
  spin,
  shimmer,
  gradientShift,
  aurora,
} from './animation';

const styles = css.create({
  content: {
    position: 'relative',
    zIndex: 1,
  },
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
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    background: 'var(--bg-gradient)',
    borderColor: 'currentColor',
    borderStyle: 'none',
    borderWidth: 'medium',
    borderRadius: 'var(--border-radius)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
    '[disabled]': {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    ':hover': {
      boxShadow: '0 7px 10px rgba(0, 0, 0, 0.15)',
      filter: 'brightness(0.95)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      filter: 'brightness(0.9)',
      transform: 'translateY(-1px) scale(0.98)',
    },
    ':focus': {
      outline: 'none',
    },
  },
  ripple: (top: number, left: number, size: number) => ({
    position: 'absolute',
    top,
    left,
    width: size,
    height: size,
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    transform: 'scale(0)',
    animationName: rippleEffect,
    animationDuration: '0.6s',
    animationTimingFunction: 'linear',
  }),
  spinner: {
    width: '1.2em',
    height: '1.2em',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'solid',
    borderWidth: '2px',
    borderTopColor: 'white',
    borderTopStyle: 'solid',
    borderTopWidth: '2px',
    borderRadius: '50%',
    animationName: spin,
    animationDuration: '0.8s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
});

const variantStyles = css.create({
  primary: {
    '--bg-gradient': 'linear-gradient(-45deg, #0EA5E9, #38BDF8)',
  },
  secondary: {
    '--bg-gradient': 'linear-gradient(-45deg, #22C55E, #4ADE80)',
  },
  tertiary: {
    '--bg-gradient': 'linear-gradient(-45deg, #F97316, #FB923C)',
  },
  danger: {
    '--bg-gradient': 'linear-gradient(-45deg, #EF4444, #F87171)',
  },
  warning: {
    '--bg-gradient': 'linear-gradient(-45deg, #EAB308, #FACC15)',
  },
  info: {
    '--bg-gradient': 'linear-gradient(-45deg, #06B6D4, #22D3EE)',
  },
  light: {
    color: '#1F2937',
    '--bg-gradient': 'linear-gradient(-45deg, #F3F4F6, #FFFFFF)',
  },
  dark: {
    '--bg-gradient': 'linear-gradient(-45deg, #1F2937, #374151)',
  },
  glass: {
    color: '#ddddddff',
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'solid',
    borderWidth: '1px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.2)',
    },
  },
  neon: {
    color: '#0ff',
    textShadow: '0 0 5px #0ff',
    background: '#000',
    borderColor: '#0ff',
    borderStyle: 'solid',
    borderWidth: '2px',
    boxShadow: '0 0 5px #0ff, 0 0 10px #0ff',
    ':hover': {
      background: '#000',
      boxShadow: '0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff',
    },
  },
  gradient: {
    background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    backgroundSize: '400% 400%',
    animationName: gradientShift,
    animationDuration: '15s',
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
  },
  shimmer: {
    background:
      'linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #764ba2 75%, #667eea 100%)',
    backgroundSize: '200% auto',
    animationName: shimmer,
    animationDuration: '3s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  metallic: {
    color: '#18181b',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
    background:
      'linear-gradient(145deg, #d4d4d8, #a1a1aa, #71717a, #a1a1aa, #d4d4d8)',
    backgroundSize: '200% 200%',
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'solid',
    borderWidth: '1px',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2)',
    ':hover': {
      filter: 'brightness(1.1)',
    },
  },
  aurora: {
    background:
      'linear-gradient(-45deg, #00f5ff, #ff00ff, #00ff88, #ffaa00, #00f5ff)',
    backgroundSize: '400% 400%',
    boxShadow: '0 0 20px rgba(0, 245, 255, 0.5)',
    animationName: aurora,
    animationDuration: '10s',
    animationTimingFunction: 'ease',
    animationIterationCount: 'infinite',
  },
});

const sizeStyles = css.create({
  small: {
    '--padding': '8px 24px',
    '--font-size': '10px',
    '--border-radius': '8px',
  },
  medium: {
    '--padding': '12px 32px',
    '--font-size': '12px',
    '--border-radius': '12px',
  },
  large: {
    '--padding': '16px 40px',
    '--font-size': '14px',
    '--border-radius': '14px',
  },
});

interface Ripple {
  id: number;
  top: number;
  left: number;
  size: number;
}

type ButtonVariant = keyof typeof variantStyles;

type ButtonSize = keyof typeof sizeStyles;

interface Props {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  name?: string;
  'aria-label'?: string;
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  name,
  'aria-label': ariaLabel,
}: Props) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const isDisabled = disabled || loading;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const rippleSize = Math.max(button.clientWidth, button.clientHeight);

    const newRipple: Ripple = {
      top: event.clientY - rect.top - rippleSize / 2,
      left: event.clientX - rect.left - rippleSize / 2,
      id: Date.now(),
      size: rippleSize,
    };

    setRipples((prevRipples) => [...prevRipples, newRipple]);

    setTimeout(() => {
      setRipples((prevRipples) =>
        prevRipples.filter((r) => r.id !== newRipple.id),
      );
    }, 600);

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <button
      classStyle={[styles.button, variantStyles[variant], sizeStyles[size]]}
      name={name}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={loading ? '...loading' : ariaLabel}
      aria-busy={loading}
    >
      {loading ? (
        <div classStyle={styles.spinner} />
      ) : (
        <span classStyle={styles.content}>{children}</span>
      )}
      {!loading &&
        ripples.map((ripple) => (
          <span
            key={ripple.id}
            classStyle={styles.ripple(ripple.top, ripple.left, ripple.size)}
          />
        ))}
    </button>
  );
};
