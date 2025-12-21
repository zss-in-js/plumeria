import { gQueue, pQueue } from '../../src/processors/css';
import * as zssEngine from 'zss-engine';

jest.mock('zss-engine', () => ({
  ...jest.requireActual('zss-engine'),
  build: jest.fn(),
  isDevelopment: false,
}));

describe('css processor (single sequential test)', () => {
  let mockZssEngine: typeof zssEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    // Note: Module-level state will persist across tests in this suite
    // as we are not using jest.resetModules() for the module under test.
    mockZssEngine = require('zss-engine');
  });

  it('should correctly handle the entire flow of pQueue and gQueue', async () => {
    // --- Test pQueue flow (props) ---

    // 1. pQueue.init should initialize promise as a Promise
    pQueue.init();
    expect(pQueue.promise).toBeInstanceOf(Promise);

    // 2. pQueue.resolve should push stylesheet to queue and resolve the promise
    const testSheet1 = '.test1 { color: red; }';
    pQueue.resolve(testSheet1);
    await expect(pQueue.promise).resolves.toBe(testSheet1);

    // 3. pQueue.build should process the queue when not processing and queue is not empty
    await pQueue.build('test1.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet1, 'test1.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(1);

    // 4. pQueue.build should not call build in development mode
    mockZssEngine.isDevelopment = true;
    const testSheet2 = '.test2 { color: blue; }';
    pQueue.resolve(testSheet2);
    await pQueue.build('test2.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(1); // Still 1 from previous call

    // 5. Reset development mode and add another sheet
    mockZssEngine.isDevelopment = false;
    const testSheet3 = '.test3 { font-size: 12px; }';
    pQueue.resolve(testSheet3);
    await pQueue.build('test3.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet3, 'test3.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(2);

    // 6. pQueue.build should not process if already processing
    const testSheet4 = '.test4 { background: yellow; }';
    pQueue.resolve(testSheet4);
    const promise1 = pQueue.build('test4.css');
    const promise2 = pQueue.build('test4.css');
    await Promise.all([promise1, promise2]);
    expect(mockZssEngine.build).toHaveBeenCalledTimes(3); // Only one more call
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet4, 'test4.css');

    // --- Test gQueue flow (global) ---

    // 7. gQueue.init should initialize promise as a Promise
    gQueue.init();
    expect(gQueue.promise).toBeInstanceOf(Promise);

    // 8. gQueue.resolve should push stylesheet to queue and resolve the promise
    const testSheet5 = '.global1 { color: orange; }';
    gQueue.resolve(testSheet5);
    await expect(gQueue.promise).resolves.toBe(testSheet5);

    // 9. gQueue.build should process the queue when not processing and queue is not empty
    await gQueue.build('global1.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet5, 'global1.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(4); // 3 from pQueue + 1 here

    // 10. gQueue.build should not call build in development mode
    mockZssEngine.isDevelopment = true;
    const testSheet6 = '.global2 { font-weight: bold; }';
    gQueue.resolve(testSheet6);
    await gQueue.build('global2.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(4); // Still 4 from previous calls

    // 11. Reset development mode and add another sheet
    mockZssEngine.isDevelopment = false;
    const testSheet7 = '.global3 { border: 1px solid black; }';
    gQueue.resolve(testSheet7);
    await gQueue.build('global3.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet7, 'global3.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(5);

    // 12. gQueue.build should not process if already processing
    const testSheet8 = '.global4 { padding: 10px; }';
    gQueue.resolve(testSheet8);
    const promise3 = gQueue.build('global4.css');
    const promise4 = gQueue.build('global4.css');
    await Promise.all([promise3, promise4]);
    expect(mockZssEngine.build).toHaveBeenCalledTimes(6); // Only one more call
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet8, 'global4.css');
  });
});

describe('css processor lazy initialization', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('pQueue should initialize promise on first call', async () => {
    const cssProcessor = require('../../src/processors/css');
    require('zss-engine');
    jest.mock('zss-engine', () => ({
      ...jest.requireActual('zss-engine'),
      build: jest.fn(),
      isDevelopment: false,
    }));

    expect(cssProcessor.pQueue.resolve).toBeUndefined();
    await cssProcessor.pQueue.build('test.css');

    const cssProcessorAfter = require('../../src/processors/css');
    expect(cssProcessorAfter.pQueue.resolve).toBeInstanceOf(Function);
  });

  it('gQueue should initialize promise on first call', async () => {
    const cssProcessor = require('../../src/processors/css');
    require('zss-engine');
    jest.mock('zss-engine', () => ({
      ...jest.requireActual('zss-engine'),
      build: jest.fn(),
      isDevelopment: false,
    }));

    expect(cssProcessor.gQueue.resolve).toBeUndefined();
    await cssProcessor.gQueue.build('test.css');

    const cssProcessorAfter = require('../../src/processors/css');
    expect(cssProcessorAfter.gQueue.resolve).toBeInstanceOf(Function);
  });
});
