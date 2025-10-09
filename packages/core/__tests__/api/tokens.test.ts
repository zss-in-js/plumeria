import { defineTokens } from '../../src/api/tokens';
import { global } from '../../src/api/global';

jest.mock('../../src/api/global', () => ({
  global: jest.fn(),
}));

describe('defineTokens', () => {
  beforeEach(() => {
    (global as jest.Mock).mockClear();
  });

  it('should return an object with CSS variable strings and call global with default values', () => {
    const tokens = {
      fontSize: {
        default: '16px',
      },
      primaryColor: {
        default: '#007bff',
      },
    };

    const result = defineTokens(tokens);

    expect(result).toEqual({
      fontSize: 'var(--font-size)',
      primaryColor: 'var(--primary-color)',
    });

    expect(global).toHaveBeenCalledWith({
      ':root': {
        '--font-size': '16px',
        '--primary-color': '#007bff',
      },
    });
  });

  it('should handle multiple themes', () => {
    const tokens = {
      backgroundColor: {
        default: '#ffffff',
        dark: '#000000',
      },
    };

    defineTokens(tokens);

    expect(global).toHaveBeenCalledWith({
      ':root': {
        '--background-color': '#ffffff',
      },
      ':root[data-theme="dark"]': {
        '--background-color': '#000000',
      },
    });
  });

  it('should handle media queries', () => {
    const tokens = {
      fontSize: {
        default: '16px',
        '@media (min-width: 768px)': '18px',
      },
    };

    defineTokens(tokens);

    expect(global).toHaveBeenCalledWith({
      ':root': {
        '--font-size': '16px',
        '@media (min-width: 768px)': {
          '--font-size': '18px',
        },
      },
    });
  });

  it('should handle mixed themes and media queries', () => {
    const tokens = {
      textColor: {
        default: '#333333',
        dark: '#eeeeee',
        '@media (prefers-color-scheme: dark)': '#f0f0f0',
      },
    };

    defineTokens(tokens);

    expect(global).toHaveBeenCalledWith({
      ':root': {
        '--text-color': '#333333',
        '@media (prefers-color-scheme: dark)': {
          '--text-color': '#f0f0f0',
        },
      },
      ':root[data-theme="dark"]': {
        '--text-color': '#eeeeee',
      },
    });
  });

  it('should convert camelCase keys to kebab-case for CSS variables', () => {
    const tokens = {
      verySpecificValue: {
        default: '1rem',
      },
    };

    const result = defineTokens(tokens);

    expect(result).toEqual({
      verySpecificValue: 'var(--very-specific-value)',
    });

    expect(global).toHaveBeenCalledWith({
      ':root': {
        '--very-specific-value': '1rem',
      },
    });
  });
});
