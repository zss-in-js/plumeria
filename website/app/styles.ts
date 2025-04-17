import { css } from '@plumeria/core';

export const styles = css.create({
  top_link: {
    position: 'relative',
    left: 100,
  },
  top_logo: {
    position: 'absolute',
    left: -80,
    scale: 0.28,
    [css.media.max('width: 804px')]: {
      top: -10,
      left: -50,
      scale: 0.34,
    },
  },
});
