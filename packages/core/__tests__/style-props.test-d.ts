import * as css from '@plumeria/core';

const styles = css.create({
  ok: {
    padding: 8,
    color: 'red',
  },
  banned: {
    position: 'absolute',
  },
  nestedOk: {
    ':hover': {
      color: 'blue',
    },
  },
  nestedBanned: {
    ':hover': {
      position: 'fixed',
    },
  },
  atBanned: {
    '@media (min-width: 640px)': {
      position: 'sticky',
    },
  },
  sized: (width: number) => ({
    width,
    color: 'red',
  }),
});

type Enumerated = css.StyleProps<'color' | 'padding' | 'width'>;

export const a: Enumerated = styles.ok;
export const b: Enumerated = [styles.ok, false];
export const c: Enumerated = styles.sized(8);

// @ts-expect-error position is not one of the enumerated properties
export const d: Enumerated = styles.banned;

type NoPosition = css.WithoutProperties<'position'>;

export const e: NoPosition = styles.ok;
export const f: NoPosition = styles.nestedOk;
export const g: NoPosition = [styles.ok, false, [styles.nestedOk]];

// @ts-expect-error position is excluded
export const h: NoPosition = styles.banned;

// @ts-expect-error position is excluded inside a pseudo class
export const i: NoPosition = styles.nestedBanned;

// @ts-expect-error position is excluded inside an at-rule
export const j: NoPosition = styles.atBanned;

type EnumeratedStatic = css.StaticStyles<'color' | 'padding' | 'width'>;

export const k: EnumeratedStatic = styles.ok;
export const l: EnumeratedStatic = [styles.ok, false];

// @ts-expect-error a dynamic style carries a function key
export const m: EnumeratedStatic = styles.sized(8);

// @ts-expect-error a dynamic style is rejected inside a style list
export const n: EnumeratedStatic = [styles.ok, styles.sized(8)];

// @ts-expect-error position is not one of the enumerated properties
export const o: EnumeratedStatic = styles.banned;

type NoDynamic = css.StaticStyles;

export const p: NoDynamic = styles.ok;
export const q: NoDynamic = styles.banned;
export const r: NoDynamic = styles.nestedBanned;
export const s: NoDynamic = [styles.ok, false, [styles.atBanned]];

// @ts-expect-error an omitted type argument still rejects a function key
export const t: NoDynamic = styles.sized(8);

// @ts-expect-error a function key is rejected anywhere in a style list
export const u: NoDynamic = [styles.ok, [styles.sized(8)]];
