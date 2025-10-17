import { createCSS, createVars, createTokens } from '../src/create';
import * as zss from 'zss-engine';

describe('createCSS', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should set isOverridden true and break the loop when matched', () => {
    // eslint-disable-next-line @plumeria/sort-properties
    const result = createCSS({ key1: { marginTop: 1, margin: 2 } });
    expect(result).not.toContain('margin-top');
  });

  it('should define frozen style object getter', () => {
    const result: any = {};
    const styleObj = { color: 'red' };
    const key = 'text';

    Object.defineProperty(result, key, {
      get: () => Object.freeze(styleObj),
    });

    const returned = result[key];
    expect(Object.isFrozen(returned)).toBe(true);
    expect(returned.color).toBe('red');
  });

  it('should push @media and @container sheets into propQuerySheets', () => {
    const result = createCSS({
      key1: {
        '@media max-width: 768px': { marginTop: 1 },
        '@container min-width: 248px': { margin: 2 },
      },
    });
    expect(result).toContain('@media max-width');
    expect(result).toContain('@container min-width');
  });

  it('should compile simple flat CSS object', () => {
    jest.spyOn(zss, 'splitAtomicAndNested').mockImplementation((obj, flat) => {
      Object.assign(flat, obj);
    });
    jest
      .spyOn(zss, 'processAtomicProps')
      .mockImplementation((_props, hashes, sheets) => {
        hashes.add('a1');
        sheets.add('.a{color:red}');
      });
    jest.spyOn(zss, 'camelToKebabCase').mockImplementation((x) => x);
    jest.spyOn(zss, 'SHORTHAND_PROPERTIES', 'get').mockReturnValue({});
    jest.spyOn(zss, 'LONG_TO_SHORT', 'get').mockReturnValue({});

    const result = createCSS({
      base: { color: 'red' },
    });

    expect(result).toContain('.a{color:red}');
  });

  it('should compile nested object (pseudo or at-rule)', () => {
    jest
      .spyOn(zss, 'splitAtomicAndNested')
      .mockImplementation((_obj, _flat, nonFlat) => {
        Object.assign(nonFlat, { ':hover': { color: 'blue' } });
      });
    jest.spyOn(zss, 'genBase36Hash').mockReturnValue('h123');
    jest
      .spyOn(zss, 'transpile')
      .mockReturnValue({ styleSheet: '.hover{color:blue}' });

    const result = createCSS({
      btn: { ':hover': { color: 'blue' } },
    });

    expect(result).toContain('.hover{color:blue}');
  });
});

describe('createVars', () => {
  it('should create CSS variable definitions under :root', () => {
    const vars = createVars({
      primaryColor: '#fff',
      fontSize: '16px',
    });

    expect(vars).toEqual({
      ':root': {
        '--primaryColor': '#fff',
        '--fontSize': '16px',
      },
    });
  });
});

describe('createTokens', () => {
  it('should create root and themed token variables', () => {
    const tokens = createTokens({
      color: { default: 'red', dark: 'black' },
    });

    expect(tokens).toEqual({
      ':root': { '--color': 'red' },
      ':root[data-theme="dark"]': { '--color': 'black' },
    });
  });

  it('should handle @media keys specially', () => {
    const tokens = createTokens({
      spacing: { '@media (max-width:600px)': '8px' },
    });

    expect(tokens).toEqual({
      ':root': {
        '@media (max-width:600px)': { '--spacing': '8px' },
      },
    });
  });
});
