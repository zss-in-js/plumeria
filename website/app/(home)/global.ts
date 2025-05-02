import { css } from '@plumeria/core';

css.global({
  '.dark body': {
    background: 'black',
  },
  pre: {
    '& span': {
      fontFamily: 'var(--font-geist-mono)',
    },
  },
  figure: {
    border: 'solid 1px #dedede',
  },
  '.dark figure': {
    background: 'black',
    border: 'solid 1px #272727',
  },
  code: {
    fontFamily: 'var(--font-geist-mono)',
  },
  '.dark aside': {
    background: '#0b0b0b',
  },
});
