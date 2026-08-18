import * as css from '@plumeria/core';

export const buckets = css.create({
  wide: {
    width: '100%',
  },
  narrow: {
    '@media (max-width: 768px)': {
      width: 200,
    },
  },
});
