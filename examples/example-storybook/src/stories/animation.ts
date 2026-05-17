import * as css from '@plumeria/core';

export const rippleEffect = css.keyframes({
  to: {
    transform: 'scale(4)',
    opacity: 0,
  },
});

export const spin = css.keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
});

export const shimmer = css.keyframes({
  '0%': {
    backgroundPosition: '-200% center',
  },
  '100%': {
    backgroundPosition: '200% center',
  },
});

export const gradientShift = css.keyframes({
  '0%': {
    backgroundPosition: '0% 50%',
  },
  '50%': {
    backgroundPosition: '100% 50%',
  },
  '100%': {
    backgroundPosition: '0% 50%',
  },
});

export const aurora = css.keyframes({
  '0%': {
    backgroundPosition: '0% 50%',
  },
  '50%': {
    backgroundPosition: '100% 50%',
  },
  '100%': {
    backgroundPosition: '0% 50%',
  },
});
