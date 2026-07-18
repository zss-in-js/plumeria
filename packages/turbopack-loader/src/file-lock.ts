import * as fs from 'fs';

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function acquireLock(
  lockDir: string,
  delayMs = 2,
  maxDelayMs = 50,
) {
  let delay = delayMs;
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      return;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        await sleep(delay);
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
