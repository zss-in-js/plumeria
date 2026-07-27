import * as fs from 'fs';

const OUT = process.env.PLUMERIA_PROFILE;
export const profiling = !!OUT;

interface Bucket {
  total: number;
  count: number;
}

const buckets = new Map<string, Bucket>();

const bucket = (label: string): Bucket => {
  let b = buckets.get(label);
  if (!b) {
    b = { total: 0, count: 0 };
    buckets.set(label, b);
  }
  return b;
};

/** Start a span. Returns 0 when profiling is off. */
export const mark = (): number => (profiling ? performance.now() : 0);

/** Close a span opened with `mark()`. */
export function measure(label: string, start: number): void {
  if (!profiling) return;
  const b = bucket(label);
  b.total += performance.now() - start;
  b.count++;
}

/** Bump a counter without timing it. */
export function tally(label: string, n = 1): void {
  if (!profiling) return;
  bucket(label).count += n;
}

/** Time a synchronous call. */
export function timed<T>(label: string, fn: () => T): T {
  if (!profiling) return fn();
  const start = performance.now();
  try {
    return fn();
  } finally {
    measure(label, start);
  }
}

/** Time an async call. */
export async function timedAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!profiling) return fn();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    measure(label, start);
  }
}

if (profiling) {
  const started = performance.now();

  const flush = () => {
    if (buckets.size === 0) return;
    const record: Record<string, unknown> = {
      pid: process.pid,
      argv: process.argv.slice(1, 3).join(' '),
      wall: +(performance.now() - started).toFixed(2),
      buckets: Object.fromEntries(
        Array.from(buckets, ([label, b]) => [
          label,
          { ms: +b.total.toFixed(2), n: b.count },
        ]),
      ),
    };
    try {
      fs.appendFileSync(OUT!, JSON.stringify(record) + '\n');
    } catch {
      // ignore
    }
  };

  setInterval(flush, 250).unref();
  process.on('exit', flush);
  process.on('SIGTERM', flush);
  process.on('SIGINT', flush);
}
