/**
 * @fileoverview What two declarations do to each other on one element
 */

import { DIRECT_LONGHANDS } from 'zss-engine';

const coverages = new Map<string, Set<string>>();

/** The longhands a property finally writes, so a shorthand can be compared. */
export const coverageOf = (property: string): Set<string> => {
  const cached = coverages.get(property);
  if (cached) return cached;
  const longhands = (DIRECT_LONGHANDS as Record<string, string[]>)[property];
  const coverage = longhands
    ? new Set(longhands.flatMap((longhand) => [...coverageOf(longhand)]))
    : new Set([property]);
  coverages.set(property, coverage);
  return coverage;
};

/** Whether the two reach any one longhand — `padding` against `padding-top`. */
export const overlaps = (first: string, second: string): boolean => {
  const left = coverageOf(first);
  return [...coverageOf(second)].some((leaf) => left.has(leaf));
};

/**
 * Where a declaration lands and how far Plumeria ranks it. The rank is the
 * count of `:not(#\#)` the atom carries: a declaration under an at-rule takes
 * one more than the same property would at the base, whichever at-rule it is
 * and however deeply the at-rules nest.
 */
export interface Held {
  property: string;
  /** The pseudo chain the declaration sits under; two only meet under one. */
  suffix: string;
  conditional: boolean;
  /** Where the rule sat in the stylesheet. */
  place: number;
}

/**
 * How two sets of declarations settle against each other.
 *
 * `ranked` — Plumeria decides, whatever order the call site writes them in.
 * `crossing` — they are level, so the order of the array is what decides.
 */
export const relate = (
  left: Held[],
  right: Held[],
): { ranked?: 'left' | 'right'; crossing: boolean } => {
  let ranked: 'left' | 'right' | undefined;
  let crossing = false;
  for (const mine of left)
    for (const theirs of right) {
      if (mine.suffix !== theirs.suffix) continue;
      if (!overlaps(mine.property, theirs.property)) continue;
      if (mine.conditional === theirs.conditional) crossing = true;
      else if (mine.conditional) ranked ??= 'left';
      else ranked ??= 'right';
    }
  return { ranked, crossing };
};
