import { props } from '../../src/api/props';
import { create } from '../../src/api/create';
import * as zssEngine from 'zss-engine';
import * as cssProcessor from '../../src/processors/css';

jest.mock('zss-engine', () => ({
  ...jest.requireActual('zss-engine'),
  injectClientCSS: jest.fn(),
  injectClientQuery: jest.fn(),
  isHashInStyleSheets: jest.fn(() => false),
  isServer: false,
  isTestingDevelopment: true,
  camelToKebabCase: jest.fn((str) =>
    str.replace(/[A-Z]/g, (match: string) => '-' + match.toLowerCase()),
  ),
  applyCssValue: jest.fn((value) => value),
}));

jest.mock('../../src/processors/css', () => ({
  ...jest.requireActual('../../src/processors/css'),
  initPromise_1: jest.fn(),
  resolvePromise_1: jest.fn(),
}));

describe('props', () => {
  let mockZssEngine: typeof zssEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    mockZssEngine = require('zss-engine');
  });

  it('should return a string when passed an object created by create', () => {
    const styles = create({ myStyle: { color: 'red' } });
    const result = props(styles.myStyle);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/^x[a-zA-Z0-9]+$/);
  });

  it('should not inject CSS if not in testing development or on server', () => {
    const styles = create({ noInject: { color: 'red' } });

    // Temporarily override mock values for this test
    mockZssEngine.isTestingDevelopment = false;
    mockZssEngine.isServer = true;

    const result = props(styles.noInject);

    expect(result).toMatch(/^x[a-zA-Z0-9]+$/);
    expect(cssProcessor.resolvePromise_1).toHaveBeenCalled();
    expect(mockZssEngine.injectClientCSS).not.toHaveBeenCalled();
    expect(mockZssEngine.injectClientQuery).not.toHaveBeenCalled();

    // Restore original mock values
    mockZssEngine.isTestingDevelopment = true;
    mockZssEngine.isServer = false;
  });

  it('should handle objects not created by create function', () => {
    const styles = create({ validStyle: { color: 'red' } });

    // A regular object not registered in styleAtomMap
    const invalidObject = { color: 'blue' } as any;

    const result = props(invalidObject.color, styles.validStyle, null);

    // If there is an object that is not registered in create,
    // an error occurs in the type, but no class is returned even if it is passed through any.
    expect(result).toMatch(/^x[a-zA-Z0-9]+$/);
    expect(cssProcessor.resolvePromise_1).toHaveBeenCalledWith(
      expect.stringContaining(''),
    );
  });
});
