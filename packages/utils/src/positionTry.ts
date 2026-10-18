import type { CSSProperties } from 'zss-engine';

export const createPositionTry = (rule: CSSProperties, hash: string) => ({
  [`@position-try --pt-${hash}`]: rule,
});
