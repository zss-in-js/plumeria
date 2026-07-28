import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// The module reads PLUMERIA_PROFILE once at import time, so every case loads a
// fresh copy with the environment already set the way it wants it.
const loadProfiler = (outPath?: string) => {
  const previous = process.env.PLUMERIA_PROFILE;
  if (outPath) process.env.PLUMERIA_PROFILE = outPath;
  else delete process.env.PLUMERIA_PROFILE;

  let mod: typeof import('../src/profiler');
  jest.isolateModules(() => {
    mod = require('../src/profiler');
  });

  if (previous === undefined) delete process.env.PLUMERIA_PROFILE;
  else process.env.PLUMERIA_PROFILE = previous;

  return mod!;
};

const tmpFile = () =>
  path.join(
    os.tmpdir(),
    `plumeria-profile-${Date.now()}-${Math.random()}.jsonl`,
  );

describe('profiler', () => {
  describe('when PLUMERIA_PROFILE is unset', () => {
    it('reports itself as disabled and records nothing', () => {
      const p = loadProfiler();

      expect(p.profiling).toBe(false);
      // mark() must not even read the clock when disabled
      expect(p.mark()).toBe(0);

      p.measure('anything', p.mark());
      p.tally('anything');
      expect(p.timed('anything', () => 'value')).toBe('value');
    });

    it('still runs the wrapped work', async () => {
      const p = loadProfiler();
      const fn = jest.fn(() => 7);

      expect(p.timed('label', fn)).toBe(7);
      await expect(p.timedAsync('label', async () => 8)).resolves.toBe(8);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('when PLUMERIA_PROFILE points at a file', () => {
    it('aggregates spans and counts, and writes them on exit', () => {
      const out = tmpFile();
      const p = loadProfiler(out);

      expect(p.profiling).toBe(true);
      expect(p.mark()).toBeGreaterThan(0);

      p.measure('phase', p.mark());
      p.measure('phase', p.mark());
      p.tally('counter');
      p.tally('counter', 4);
      expect(p.timed('sync', () => 'ok')).toBe('ok');

      // The exit handler is what flushes; invoking the listeners directly is
      // the only way to observe it without ending the test process.
      process.emit('exit', 0);

      const lines = fs.readFileSync(out, 'utf8').trim().split('\n');
      const record = JSON.parse(lines[lines.length - 1]);

      expect(record.pid).toBe(process.pid);
      expect(record.buckets.phase.n).toBe(2);
      expect(record.buckets.counter.n).toBe(5);
      expect(record.buckets.sync.n).toBe(1);
      expect(typeof record.wall).toBe('number');

      fs.rmSync(out, { force: true });
    });

    it('times an async span and keeps the resolved value', async () => {
      const out = tmpFile();
      const p = loadProfiler(out);

      await expect(p.timedAsync('async', async () => 'value')).resolves.toBe(
        'value',
      );

      process.emit('exit', 0);
      const lines = fs.readFileSync(out, 'utf8').trim().split('\n');
      const record = JSON.parse(lines[lines.length - 1]);
      expect(record.buckets.async.n).toBe(1);

      fs.rmSync(out, { force: true });
    });

    it('records a span even when the timed function throws', () => {
      const out = tmpFile();
      const p = loadProfiler(out);

      expect(() =>
        p.timed('boom', () => {
          throw new Error('nope');
        }),
      ).toThrow('nope');

      process.emit('exit', 0);
      const lines = fs.readFileSync(out, 'utf8').trim().split('\n');
      expect(JSON.parse(lines[lines.length - 1]).buckets.boom.n).toBe(1);

      fs.rmSync(out, { force: true });
    });

    it('never lets an unwritable destination break the build', () => {
      // A directory path can't be appended to, so the flush must swallow it.
      const p = loadProfiler(os.tmpdir());
      p.tally('something');

      expect(() => process.emit('exit', 0)).not.toThrow();
    });

    it('writes nothing when no span was ever recorded', () => {
      const out = tmpFile();
      loadProfiler(out);

      process.emit('exit', 0);

      expect(fs.existsSync(out)).toBe(false);
    });
  });
});
