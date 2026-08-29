import { createTheme, themeHashOf } from '../src/createTheme';
import { genBase36Hash } from 'zss-engine';

type Rule = Record<string, { default: string; theme: string }>;

const themed = (selector: string, rule: Rule) => {
  const themeHash = themeHashOf(selector, rule);
  return {
    result: createTheme(selector, rule, themeHash),
    hashOf: (key: string) =>
      genBase36Hash({ _theme: themeHash, [key]: rule[key] }, 1, 8),
  };
};

describe('createTheme', () => {
  test('handles class selector with atomic hashes', () => {
    const { result, hashOf } = themed('.dark', {
      color: { default: 'black', theme: 'white' },
    });
    const colorHash = hashOf('color');

    expect(result[':where(:root)']).toEqual({
      [`--${colorHash}-color`]: 'black',
    });
    expect((result as any)['.dark']).toEqual({
      [`--${colorHash}-color`]: 'white',
    });
  });

  test('handles media query with atomic hashes', () => {
    const { result, hashOf } = themed('@media (prefers-color-scheme: dark)', {
      color: { default: 'black', theme: 'white' },
    });
    const colorHash = hashOf('color');

    expect(result[':where(:root)']).toEqual({
      [`--${colorHash}-color`]: 'black',
      '@media (prefers-color-scheme: dark)': {
        [`--${colorHash}-color`]: 'white',
      },
    });
  });

  test('formats plain word selector as class selector', () => {
    const { result, hashOf } = themed('dark', {
      color: { default: 'black', theme: 'white' },
    });
    const colorHash = hashOf('color');

    expect((result as any)['.dark']).toEqual({
      [`--${colorHash}-color`]: 'white',
    });
    expect(result[':where(:root)']).toEqual({
      [`--${colorHash}-color`]: 'black',
    });
  });

  test('handles container queries', () => {
    const { result, hashOf } = themed('@container (min-width: 500px)', {
      gap: { default: '10px', theme: '20px' },
    });
    const gapHash = hashOf('gap');

    expect(result[':where(:root)']).toEqual({
      [`--${gapHash}-gap`]: '10px',
      '@container (min-width: 500px)': {
        [`--${gapHash}-gap`]: '20px',
      },
    });
  });

  test('handles multiple properties with camelCase and kebab-case conversion', () => {
    const { result, hashOf } = themed('.custom-theme', {
      textColor: { default: 'blue', theme: 'red' },
      fontSize: { default: '16px', theme: '20px' },
    });
    const textHash = hashOf('textColor');
    const fontHash = hashOf('fontSize');

    expect((result as any)['.custom-theme']).toEqual({
      [`--${textHash}-text-color`]: 'red',
      [`--${fontHash}-font-size`]: '20px',
    });

    expect(result[':where(:root)']).toEqual({
      [`--${textHash}-text-color`]: 'blue',
      [`--${fontHash}-font-size`]: '16px',
    });
  });

  test('gives two selectors sharing one rule different variables', () => {
    const rule = { color: { default: 'black', theme: 'white' } };

    const dark = themed('.dark', rule).result;
    const sepia = themed('.sepia', rule).result;

    expect(Object.keys(dark[':where(:root)'])).not.toEqual(
      Object.keys(sepia[':where(:root)']),
    );
  });
});
