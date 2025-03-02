const range = (range: string) => `@container (${range})` as '@container ()';
const max = (str: string) => `@container (max-${str})` as '@container (max-)';
const min = (str: string) => `@container (min-${str})` as '@container (min-)';

export const container = {
  range,
  max,
  min,
};
