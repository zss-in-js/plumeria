export const scheme = {
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
} as const;

const range = (range: string) => `@media (${range})` as '@media ()';
const max = (str: string) => `@media (max-${str})` as '@media (max-)';
const min = (str: string) => `@media (min-${str})` as '@media (min-)';

export const media = {
  min_sm: '@media (min-width: 640px)',
  min_md: '@media (min-width: 768px)',
  min_lg: '@media (min-width: 1024px)',
  min_xl: '@media (min-width: 1280px)',
  min_2xl: '@media (min-width: 1536px)',
  max_sm: '@media (max-width: 640px)',
  max_md: '@media (max-width: 768px)',
  max_lg: '@media (max-width: 1024px)',
  max_xl: '@media (max-width: 1280px)',
  max_2xl: '@media (max-width: 1536px)',
  range,
  max,
  min,
  scheme,
} as const;
