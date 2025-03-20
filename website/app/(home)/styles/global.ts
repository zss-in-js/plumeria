import { css } from '@plumeria/core';

css.global({
  '.dark body': {
    background: 'black',
  },

  '.dark pre': {
    background: '#000000',
  },

  pre: {
    '& span': {
      fontFamily: 'var(--font-geist-mono)',
    },
  },

  code: {
    fontFamily: 'var(--font-geist-mono)',
  },
  '.dark aside': {
    background: '#0b0b0b',
  },
});
