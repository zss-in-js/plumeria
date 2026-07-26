jest.mock('@rust-gear/glob', () => ({ globSync: jest.fn(() => []) }));
// The loader compiles to `__importStar(require('fs'))`, so it captures a copy of
// the namespace: jest.spyOn(fs, ...) from here would patch a different object.
// Mocking the module keeps one shared jest.fn that both sides call through.
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return { ...actual, writeFileSync: jest.fn(actual.writeFileSync) };
});

import * as fs from 'fs';
import * as path from 'path';
import loader from '../src/index';

/**
 * The dev write path is the loader's only shared mutable state, and the write
 * is not atomic: writeFileSync opens with O_TRUNC, so a failure part-way
 * through can leave the shared file truncated. The catch restores it.
 *
 * What it restores matters. Rules arrive from many worker processes, so the
 * only content this worker knows is current is the one it read inside the lock
 * it still holds. Restoring anything held across compiles would republish a
 * snapshot from before other workers appended their rules.
 */

const VIRTUAL_FILE_PATH = path.resolve(__dirname, '..', 'zero-virtual.css');
const LOCK_DIR_PATH = VIRTUAL_FILE_PATH + '.lock';

const moduleUsing = (color: string) => `import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Box = () => <div styleName={styles.box} />;
`;

const writeFileSyncMock = fs.writeFileSync as unknown as jest.Mock;

/** Resolves with the error the loader reported, or null on success. */
const runLoader = (source: string): Promise<Error | null> =>
  new Promise((resolve, reject) => {
    const context = {
      resourcePath: path.join(__dirname, 'write-failure-fixture.tsx'),
      async: () => (err: Error | null) => resolve(err),
      addDependency: () => {},
      clearDependencies: () => {},
    };

    (loader as unknown as (this: unknown, source: string) => Promise<void>)
      .call(context, source)
      .catch(reject);
  });

/** Arms the loader's next write to fail, ignoring writes made by the setup. */
const failNextWrite = (code: string) => {
  writeFileSyncMock.mockClear();
  writeFileSyncMock.mockImplementationOnce(() => {
    throw new Error(code);
  });
};

describe('shared virtual CSS write failure', () => {
  let backup: string;

  beforeEach(() => {
    backup = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
  });

  afterEach(() => {
    writeFileSyncMock.mockReset();
    writeFileSyncMock.mockImplementation(
      jest.requireActual('fs').writeFileSync,
    );
    fs.writeFileSync(VIRTUAL_FILE_PATH, backup, 'utf-8');
  });

  it('restores the file and surfaces the error', async () => {
    const existing = '.existing { color: blue; }\n';
    fs.writeFileSync(VIRTUAL_FILE_PATH, existing, 'utf-8');
    failNextWrite('ENOSPC: no space left on device');

    const error = await runLoader(moduleUsing('red'));

    expect(error?.message).toContain('ENOSPC');
    expect(fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8')).toBe(existing);
    // the failing write plus the restore
    expect(writeFileSyncMock).toHaveBeenCalledTimes(2);
  });

  it('does not drop rules another worker added since this worker last wrote', async () => {
    fs.writeFileSync(VIRTUAL_FILE_PATH, '', 'utf-8');

    // this worker compiles once, so any cross-compile snapshot is now populated
    expect(await runLoader(moduleUsing('red'))).toBeNull();
    const afterFirstCompile = fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8');
    expect(afterFirstCompile).toContain('red');

    // a different worker appends its own rule straight to the shared file
    const fromOtherWorker =
      afterFirstCompile + '\n.other-worker { margin: 0; }\n';
    fs.writeFileSync(VIRTUAL_FILE_PATH, fromOtherWorker, 'utf-8');

    // this worker compiles again and its write fails
    failNextWrite('EIO: i/o error');
    const error = await runLoader(moduleUsing('green'));

    expect(error?.message).toContain('EIO');
    expect(fs.readFileSync(VIRTUAL_FILE_PATH, 'utf-8')).toBe(fromOtherWorker);
  });

  it('releases the lock so the next compile is not blocked', async () => {
    fs.writeFileSync(VIRTUAL_FILE_PATH, '', 'utf-8');
    failNextWrite('EIO: i/o error');

    await runLoader(moduleUsing('red'));

    expect(fs.existsSync(LOCK_DIR_PATH)).toBe(false);
    // the lock is reusable, not just absent
    expect(await runLoader(moduleUsing('green'))).toBeNull();
  });
});
