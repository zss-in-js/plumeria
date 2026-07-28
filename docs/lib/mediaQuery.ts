import * as css from '@plumeria/core';

export const breakpoints = css.createStatic({
  xs: '@media (max-width: 480px)',
  sm: '@media (max-width: 640px)',
  md: '@media (max-width: 768px)',
  lg: '@media (max-width: 1023.98px)',
  xl: '@media (max-width: 1280px)',
  // Desktop counterpart of `lg`, so the two never overlap nor leave a gap.
  lgup: '@media (min-width: 1024px)',
});
