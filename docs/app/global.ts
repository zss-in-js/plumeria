import { css } from '@plumeria/core';

css.global({
  body: {
    background: '#fffaff',
  },
  '.dark body': {
    background: 'black',
  },
  pre: {
    background: 'white',
    '& span': {
      fontFamily: 'var(--font-geist-mono)',
    },
  },
  '.dark pre': {
    background: 'black',
  },
  figure: {
    background: 'white',
    border: 'solid 1px #eeeeee',
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
  '.text-3xl': {
    fontSize: 36,
    fontWeight: 550,
  },
});
