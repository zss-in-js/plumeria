/**
 * @fileoverview What two declarations do to each other on one element
 */

import { DIRECT_LONGHANDS } from 'zss-engine';

const SHORTHANDS_OF: Record<string, string[]> = {};
for (const [shorthand, longhands] of Object.entries(DIRECT_LONGHANDS))
  for (const longhand of longhands as string[])
    (SHORTHANDS_OF[longhand] ??= []).push(shorthand);

const depths = new Map<string, number>();

/**
 * How many steps a property sits below the shorthands that write it. Plumeria
 * adds one `:not(#\#)` per step, which is what makes a longhand outrank the
 * shorthand it narrows however the two are composed.
 */
export const depthOf = (property: string): number => {
  const cached = depths.get(property);
  if (cached !== undefined) return cached;
  depths.set(property, 0);
  let depth = 0;
  for (const shorthand of SHORTHANDS_OF[property] ?? [])
    depth = Math.max(depth, depthOf(shorthand) + 1);
  depths.set(property, depth);
  return depth;
};

/**
 * What Plumeria ranks a declaration at. A custom property is left where it is;
 * everything else takes one step for being written at all, one more for
 * sitting under an at-rule — whichever at-rule, however deeply they nest — and
 * one per step down the shorthand graph.
 */
export const rankOf = (property: string, conditional: boolean): number =>
  property.startsWith('--') ? 0 : 1 + (conditional ? 1 : 0) + depthOf(property);

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
  /** What Plumeria ranks it at — see `rankOf`. */
  rank: number;
  /** Where the declaration sat in the stylesheet. */
  place: number;
}

/**
 * Whether the two hold a pair of declarations no array can order.
 *
 * Where two declarations reach one property on one element, CSS gives it to
 * the one written later and Plumeria to the one it ranks higher. They agree
 * wherever the later declaration is the higher-ranked one, and the array
 * settles a tie. What no call site can undo is a declaration outranked by one
 * written before it: Plumeria hands the property back to the earlier rule.
 *
 * Passing one list twice asks the question of a single key, which holds both
 * declarations and has no array to settle them with.
 */
export const unrepresentable = (left: Held[], right: Held[]): boolean =>
  left.some((mine) =>
    right.some((theirs) => {
      if (mine.suffix !== theirs.suffix) return false;
      if (mine.place === theirs.place) return false;
      if (!overlaps(mine.property, theirs.property)) return false;
      const [earlier, later] =
        mine.place < theirs.place ? [mine, theirs] : [theirs, mine];
      return earlier.rank > later.rank;
    }),
  );
