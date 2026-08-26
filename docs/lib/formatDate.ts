export const formatDate = (value: string | number | Date): string =>
  new Date(value).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
