import { css, media } from '@plumeria/core';

export const breakpoints = css.defineConsts({
  xs: media.maxWidth(480),
  sm: media.maxWidth(640),
  md: media.maxWidth(768),
  lg: media.maxWidth(1024),
  xl: media.maxWidth(1280),
});
