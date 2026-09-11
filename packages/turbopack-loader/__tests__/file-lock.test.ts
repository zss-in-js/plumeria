import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { acquireLock, releaseLockSync } from '../src/file-lock';

let directory: string;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-lock-'));
});
afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

it('acquires an available lock with the default retry settings', async () => {
  const lock = path.join(directory, 'css.lock');
  await acquireLock(lock);
  expect(fs.existsSync(lock)).toBe(true);
});

it('rethrows errors that are not caused by lock contention', async () => {
  const lock = path.join(directory, 'missing', 'css.lock');
  await expect(acquireLock(lock)).rejects.toMatchObject({ code: 'ENOENT' });
});

it('fails with an actionable error when a stale lock never releases', async () => {
  const lock = path.join(directory, 'css.lock');
  fs.mkdirSync(lock);
  await expect(acquireLock(lock, 1, 2, 10)).rejects.toThrow(
    'Timed out waiting for CSS lock',
  );
  expect(fs.existsSync(lock)).toBe(true);
});

it('acquires a contended lock after the current writer releases it', async () => {
  const lock = path.join(directory, 'css.lock');
  fs.mkdirSync(lock);
  const pending = acquireLock(lock, 1, 2, 1000);
  releaseLockSync(lock);
  await pending;
  expect(fs.existsSync(lock)).toBe(true);
  releaseLockSync(lock);
  expect(fs.existsSync(lock)).toBe(false);
});

it('ignores errors when the lock has already been released', () => {
  const lock = path.join(directory, 'css.lock');
  expect(() => releaseLockSync(lock)).not.toThrow();
});
