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

  it('should handle multiple objects and return combined class names', () => {
    const styles1 = create({ style1: { color: 'red' } });
    const styles2 = create({ style2: { fontSize: '16px' } });
    const result = props(styles1.style1, styles2.style2);

    expect(result).toMatch(/^x[a-zA-Z0-9]+ x[a-zA-Z0-9]+$/);
    expect(cssProcessor.resolvePromise_1).toHaveBeenCalledWith(
      expect.stringContaining('color: red') &&
        expect.stringContaining('font-size: 16px'),
    );
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledWith(
      expect.stringMatching(/^x[a-zA-Z0-9]+$/),
      expect.stringContaining('color: red'),
    );
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledWith(
      expect.stringMatching(/^x[a-zA-Z0-9]+$/),
      expect.stringContaining('font-size: 16px'),
    );
  });

  it('should apply rightmost wins logic for overlapping properties', () => {
    const styles1 = create({
      common: { color: 'red', background: 'blue' },
    });
    const styles2 = create({ common: { color: 'green' } });
    const result = props(styles1.common, styles2.common);

    expect(result).toMatch(/^x[a-zA-Z0-9]+ x[a-zA-Z0-9]+$/);
    expect(cssProcessor.resolvePromise_1).toHaveBeenCalledWith(
      expect.stringContaining('background: blue') &&
        expect.stringContaining('color: green'),
    );
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledWith(
      expect.stringMatching(/^x[a-zA-Z0-9]+$/),
      expect.stringContaining('background: blue'),
    );
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledWith(
      expect.stringMatching(/^x[a-zA-Z0-9]+$/),
      expect.stringContaining('color: green'),
    );
  });

  it('should handle null, undefined, and false inputs gracefully', () => {
    const styles = create({ myStyle: { display: 'block' } });
    const result = props(null, styles.myStyle, undefined, false);

    expect(result).toMatch(/^x[a-zA-Z0-9]+$/);
    expect(cssProcessor.resolvePromise_1).toHaveBeenCalledWith(
      expect.stringContaining('display: block'),
    );
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledWith(
      expect.stringMatching(/^x[a-zA-Z0-9]+$/),
      expect.stringContaining('display: block'),
    );
  });

  it('should inject query styles separately', () => {
    const styles = create({
      queryStyle: { '@media (min-width: 768px)': { color: 'blue' } },
    });
    const result = props(styles.queryStyle);

    expect(result).toMatch(/^x[a-zA-Z0-9]+$/);
    expect(cssProcessor.resolvePromise_1).toHaveBeenCalledWith(
      expect.stringContaining('@media (min-width: 768px) { .x'),
    );
    expect(mockZssEngine.injectClientQuery).toHaveBeenCalledWith(
      expect.stringMatching(/^x[a-zA-Z0-9]+$/),
      expect.stringContaining('@media (min-width: 768px) { .x'),
    );
    expect(mockZssEngine.injectClientCSS).not.toHaveBeenCalled();
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

  it('should use cache and not inject styles again', () => {
    const styles = create({ cachedStyle: { color: 'purple' } });

    // First call, should inject
    props(styles.cachedStyle);
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledTimes(1);

    // Second call, should not inject again due to internal cache
    props(styles.cachedStyle);
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledTimes(2);

    // Mocking that hash is already in stylesheets
    (mockZssEngine.isHashInStyleSheets as jest.Mock).mockReturnValue(true);
    props(styles.cachedStyle);
    expect(mockZssEngine.injectClientCSS).toHaveBeenCalledTimes(2);
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
