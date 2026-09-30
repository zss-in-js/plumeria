import { scanAll } from '@plumeria/compiler';

const SCAN_REUSE_MS = 1000;
let recentScan:
  | { key: string; at: number; tables: ReturnType<typeof scanAll> }
  | undefined;

export const scanTables = (cwd: string, styleProp: string) => {
  const key = `${cwd}\0${styleProp}`;
  const now = Date.now();
  if (
    !recentScan ||
    recentScan.key !== key ||
    now - recentScan.at > SCAN_REUSE_MS
  ) {
    recentScan = { key, at: now, tables: scanAll(cwd, styleProp) };
  }
  return recentScan.tables;
};
