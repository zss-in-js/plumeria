import { css } from '@plumeria/core';

export const utils = css.defineVars({
  mini: '12px',
  medium: '16px',
  large: '24px',
});

// Synchronize with documents
export const tokens = css.defineVars({
  white: 'white',
  black: 'black',
  textPrimary: '#eaeaea',
  textSecondary: '#333',
  link: 'lightblue',
  accent: 'purple',
});

tokens.textPrimary;

export const theme = css.defineTheme({
  textPrimary: {
    default: 'rgb(60,60,60)',
    light: 'black',
    dark: 'white',
  },
  bgPrimary: {
    light: 'white',
    dark: 'black',
  },
});
