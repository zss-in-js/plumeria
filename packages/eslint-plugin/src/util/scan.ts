import { scanAll, styleReceivers } from '@plumeria/compiler';

const SCAN_REUSE_MS = 1000;
let recentScan:
  | {
      key: string;
      at: number;
      tables: ReturnType<typeof scanAll> & {
        styleReceiverTable: ReturnType<typeof styleReceivers>;
      };
    }
  | undefined;

export const scanTables = (cwd: string, styleProp: string) => {
  const key = `${cwd}\0${styleProp}`;
  const now = Date.now();
  if (
    !recentScan ||
    recentScan.key !== key ||
    now - recentScan.at > SCAN_REUSE_MS
  ) {
    const summary = scanAll(cwd, styleProp);
    recentScan = {
      key,
      at: now,
      tables: { ...summary, styleReceiverTable: styleReceivers() },
    };
  }
  return recentScan.tables;
};
