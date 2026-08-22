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
 * Whether the two hold a pair of declarations no array can order.
 *
 * Plumeria ranks a declaration under an at-rule above a plain one; CSS ranks
 * the two by where they were written, because an at-rule carries no
 * specificity. Where a plain declaration was written after a conditional one
 * it overlaps, CSS gives it the win and Plumeria cannot, whatever the call
 * site composes. The pairs are read one declaration at a time: a key answers
 * for the last rule that named it, which says nothing about where the
 * declaration that disagrees actually sat.
 *
 * Passing one list twice asks the question of a single key, which holds both
 * declarations and has no array to settle them with.
 */
export const unrepresentable = (left: Held[], right: Held[]): boolean =>
  left.some((mine) =>
    right.some((theirs) => {
      if (mine.suffix !== theirs.suffix) return false;
      if (mine.conditional === theirs.conditional) return false;
      if (!overlaps(mine.property, theirs.property)) return false;
      const plain = mine.conditional ? theirs : mine;
      const conditional = mine.conditional ? mine : theirs;
      return plain.place > conditional.place;
    }),
  );
