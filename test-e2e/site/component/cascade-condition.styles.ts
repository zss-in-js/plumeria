import * as css from '@plumeria/core';

export const cascadeCondition = css.create({
  box: {
    '@media (min-width: 600px)': {
      padding: 40,
    },
  },
  text: {
    '@media (min-width: 600px)': {
      ':hover': {
        color: 'blue',
      },
    },
  },
});
