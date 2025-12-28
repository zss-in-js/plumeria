// createTheme.test.ts
import { createTheme } from '../src/createTheme';

describe('createTheme', () => {
  test('handles default theme', () => {
    const result = createTheme({
      color: {
        default: 'red',
      },
    } as any);

    expect(result[':root']).toEqual({
      '--color': 'red',
    });
  });

  test('handles named theme', () => {
    const result = createTheme({
      color: {
        dark: 'black',
      },
    } as any);

    expect(result[':root[data-theme="dark"]']).toEqual({
      '--color': 'black',
    });
  });

  test('handles media query', () => {
    const result = createTheme({
      color: {
        '@media (prefers-color-scheme: dark)': 'white',
      },
    } as any);

    expect(result[':root']['@media (prefers-color-scheme: dark)']).toEqual({
      '--color': 'white',
    });
  });
});
