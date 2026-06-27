import * as fs from 'fs';

export function acquireLockSync(lockDir: string, delayMs = 2) {
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      return;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        const start = Date.now();
        while (Date.now() - start < delayMs) {
          // waiting
        }
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
