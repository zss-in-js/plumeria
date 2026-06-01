import { createTheme } from '../src/createTheme';
import { genBase36Hash } from 'zss-engine';

describe('createTheme', () => {
  test('handles class selector with atomic hashes', () => {
    const result = createTheme('.dark', {
      color: {
        default: 'black',
        theme: 'white',
      },
    });

    const colorHash = genBase36Hash(
      { color: { default: 'black', theme: 'white' } },
      1,
      8,
    );

    expect(result[':where(:root)']).toEqual({
      [`--${colorHash}-color`]: 'black',
    });
    expect((result as any)['.dark']).toEqual({
      [`--${colorHash}-color`]: 'white',
    });
  });

  test('handles media query with atomic hashes', () => {
    const result = createTheme('@media (prefers-color-scheme: dark)', {
      color: {
        default: 'black',
        theme: 'white',
      },
    });

    const colorHash = genBase36Hash(
      { color: { default: 'black', theme: 'white' } },
      1,
      8,
    );

    expect(result[':where(:root)']).toEqual({
      [`--${colorHash}-color`]: 'black',
      '@media (prefers-color-scheme: dark)': {
        [`--${colorHash}-color`]: 'white',
      },
    });
  });

  test('formats plain word selector as class selector', () => {
    const result = createTheme('dark', {
      color: {
        default: 'black',
        theme: 'white',
      },
    });

    const colorHash = genBase36Hash(
      { color: { default: 'black', theme: 'white' } },
      1,
      8,
    );

    expect((result as any)['.dark']).toEqual({
      [`--${colorHash}-color`]: 'white',
    });
    expect(result[':where(:root)']).toEqual({
      [`--${colorHash}-color`]: 'black',
    });
  });

  test('handles container queries', () => {
    const result = createTheme('@container (min-width: 500px)', {
      gap: {
        default: '10px',
        theme: '20px',
      },
    });

    const gapHash = genBase36Hash(
      { gap: { default: '10px', theme: '20px' } },
      1,
      8,
    );

    expect(result[':where(:root)']).toEqual({
      [`--${gapHash}-gap`]: '10px',
      '@container (min-width: 500px)': {
        [`--${gapHash}-gap`]: '20px',
      },
    });
  });

  test('handles multiple properties with camelCase and kebab-case conversion', () => {
    const result = createTheme('.custom-theme', {
      textColor: {
        default: 'blue',
        theme: 'red',
      },
      fontSize: {
        default: 16,
        theme: 20,
      },
    });

    const textHash = genBase36Hash(
      { textColor: { default: 'blue', theme: 'red' } },
      1,
      8,
    );
    const fontHash = genBase36Hash(
      { fontSize: { default: 16, theme: 20 } },
      1,
      8,
    );

    expect((result as any)['.custom-theme']).toEqual({
      [`--${textHash}-text-color`]: 'red',
      [`--${fontHash}-font-size`]: 20,
    });

    expect(result[':where(:root)']).toEqual({
      [`--${textHash}-text-color`]: 'blue',
      [`--${fontHash}-font-size`]: 16,
    });
  });
});
