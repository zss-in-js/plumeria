import * as fs from 'fs';

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function acquireLock(
  lockDir: string,
  delayMs = 2,
  maxDelayMs = 50,
  timeoutMs = 30_000,
) {
  const started = Date.now();
  let delay = delayMs;
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      return;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        const remaining = timeoutMs - (Date.now() - started);
        if (remaining <= 0) {
          throw new Error(
            `Plumeria: Timed out waiting for CSS lock "${lockDir}". If no build is running, remove the stale lock directory and retry.`,
            { cause: err },
          );
        }
        await sleep(Math.min(delay, remaining));
        delay = Math.min(delay * 2, maxDelayMs);
        continue;
      }
      throw err;
    }
  }
}

export function releaseLockSync(lockDir: string) {
  try {
    fs.rmdirSync(lockDir);
  } catch (e) {
    // ignore
  }
}
