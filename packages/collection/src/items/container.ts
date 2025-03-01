const range = (range: string): string => `@container (${range})`;
const max = (size: string): string => `@container (max-${size})`;
const min = (size: string): string => `@container (min-${size})`;

export const container = {
  range,
  max,
  min,
};
