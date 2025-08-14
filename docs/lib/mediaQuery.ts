import { css } from '@plumeria/core';

export const breakpoints = css.defineConsts({
  xs: '@media (max-width: 480px)',
  sm: '@media (max-width: 640px)',
  md: '@media (max-width: 768px)',
  lg: '@media (max-width: 1024px)',
  xl: '@media (max-width: 1280px)',
});
