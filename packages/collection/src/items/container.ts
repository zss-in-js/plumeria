const range = (range: string) => `@container (${range})` as '@container (range)';
const max = (size: string) => `@container (max-${size})` as '@container (max-size)';
const min = (size: string) => `@container (min-${size})` as '@container (min-size)';

export const container = {
  range,
  max,
  min,
};
