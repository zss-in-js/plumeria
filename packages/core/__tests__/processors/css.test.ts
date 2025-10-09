import {
  buildProps,
  buildGlobal,
  initPromise_1,
  resolvePromise_1,
  globalPromise_1,
  initPromise_2,
  resolvePromise_2,
  globalPromise_2,
} from '../../src/processors/css';
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

  it('should correctly handle the entire flow of buildProps and buildGlobal', async () => {
    // --- Test buildProps flow ---

    // 1. initPromise_1 should initialize globalPromise_1 as a Promise
    initPromise_1();
    expect(globalPromise_1).toBeInstanceOf(Promise);

    // 2. resolvePromise_1 should push stylesheet to queue and resolve the promise
    const testSheet1 = '.test1 { color: red; }';
    resolvePromise_1(testSheet1);
    await expect(globalPromise_1).resolves.toBe(testSheet1);

    // 3. buildProps should process the queue when not processing and queue is not empty
    await buildProps('test1.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet1, 'test1.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(1);

    // 4. buildProps should not call build in development mode
    mockZssEngine.isDevelopment = true;
    const testSheet2 = '.test2 { color: blue; }';
    resolvePromise_1(testSheet2);
    await buildProps('test2.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(1); // Still 1 from previous call

    // 5. Reset development mode and add another sheet
    mockZssEngine.isDevelopment = false;
    const testSheet3 = '.test3 { font-size: 12px; }';
    resolvePromise_1(testSheet3);
    await buildProps('test3.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet3, 'test3.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(2);

    // 6. buildProps should not process if already processing
    const testSheet4 = '.test4 { background: yellow; }';
    resolvePromise_1(testSheet4);
    const promise1 = buildProps('test4.css');
    const promise2 = buildProps('test4.css');
    await Promise.all([promise1, promise2]);
    expect(mockZssEngine.build).toHaveBeenCalledTimes(3); // Only one more call
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet4, 'test4.css');

    // --- Test buildGlobal flow ---

    // 7. initPromise_2 should initialize globalPromise_2 as a Promise
    initPromise_2();
    expect(globalPromise_2).toBeInstanceOf(Promise);

    // 8. resolvePromise_2 should push stylesheet to queue and resolve the promise
    const testSheet5 = '.global1 { color: orange; }';
    resolvePromise_2(testSheet5);
    await expect(globalPromise_2).resolves.toBe(testSheet5);

    // 9. buildGlobal should process the queue when not processing and queue is not empty
    await buildGlobal('global1.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet5, 'global1.css', '--global');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(4); // 3 from buildProps + 1 here

    // 10. buildGlobal should not call build in development mode
    mockZssEngine.isDevelopment = true;
    const testSheet6 = '.global2 { font-weight: bold; }';
    resolvePromise_2(testSheet6);
    await buildGlobal('global2.css');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(4); // Still 4 from previous calls

    // 11. Reset development mode and add another sheet
    mockZssEngine.isDevelopment = false;
    const testSheet7 = '.global3 { border: 1px solid black; }';
    resolvePromise_2(testSheet7);
    await buildGlobal('global3.css');
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet7, 'global3.css', '--global');
    expect(mockZssEngine.build).toHaveBeenCalledTimes(5);

    // 12. buildGlobal should not process if already processing
    const testSheet8 = '.global4 { padding: 10px; }';
    resolvePromise_2(testSheet8);
    const promise3 = buildGlobal('global4.css');
    const promise4 = buildGlobal('global4.css');
    await Promise.all([promise3, promise4]);
    expect(mockZssEngine.build).toHaveBeenCalledTimes(6); // Only one more call
    expect(mockZssEngine.build).toHaveBeenCalledWith(testSheet8, 'global4.css', '--global');
  });
});
