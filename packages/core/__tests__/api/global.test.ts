import { global } from '../../src/api/global';
import * as zssEngine from 'zss-engine';
import * as cssProcessor from '../../src/processors/css';

jest.mock('zss-engine', () => ({
  ...jest.requireActual('zss-engine'),
  transpile: jest.fn(() => ({ styleSheet: '/* transpiled css */' })),
  injectClientGlobalCSS: jest.fn(),
  isServer: false,
  isTestingDevelopment: true,
}));

jest.mock('../../src/processors/css', () => ({
  ...jest.requireActual('../../src/processors/css'),
  gQueue: {
    init: jest.fn(),
    resolve: jest.fn(),
    promise: undefined,
  },
}));

describe('global', () => {
  let mockZssEngine: typeof zssEngine;
  let mockCssProcessor: typeof cssProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockZssEngine = require('zss-engine');
    mockCssProcessor = require('../../src/processors/css');
  });

  it('should call transpile with the correct arguments', () => {
    const styles = { body: { margin: 0 } };
    global(styles);
    expect(mockZssEngine.transpile).toHaveBeenCalledWith(
      styles,
      undefined,
      '--global',
    );
  });

  it('should call gQueue.resolve with the transpiled stylesheet', () => {
    const styles = { h1: { fontSize: '2rem' } };
    global(styles);
    expect(mockCssProcessor.gQueue.resolve).toHaveBeenCalledWith(
      '/* transpiled css */',
    );
  });

  it('should initialize promise if it is undefined', () => {
    (mockCssProcessor as any).gQueue.promise = undefined;
    const styles = { div: { padding: '1em' } };
    global(styles);
    expect(mockCssProcessor.gQueue.init).toHaveBeenCalled();
  });
});
