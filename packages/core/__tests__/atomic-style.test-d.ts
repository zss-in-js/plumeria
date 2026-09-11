import * as css from '@plumeria/core';

const styles = css.create({
  tinted: {
    color: 'red',
  },
  padded: {
    padding: 8,
    color: 'red',
  },
  pinned: {
    position: 'absolute',
  },
  flex: {
    display: 'flex',
  },
  grid: {
    display: 'grid',
  },
  hover: {
    ':hover': {
      padding: 8,
      color: 'blue',
    },
  },
  hoverPosition: {
    ':hover': {
      position: 'fixed',
    },
  },
  sized: (width: number) => ({
    width,
    color: 'red',
  }),
  widthOnly: (width: number) => ({
    width,
  }),
});

type NeedsColor = css.AtomicStyle<{ color: string }>;

export const required: NeedsColor = styles.tinted;
export const additional: NeedsColor = styles.padded;

// @ts-expect-error a style must contain the required property
export const missing: NeedsColor = styles.pinned;

type MustBeFlex = css.AtomicStyle<{ display: 'flex' }>;

export const literal: MustBeFlex = styles.flex;

// @ts-expect-error the property exists but its value does not match
export const wrongValue: MustBeFlex = styles.grid;

type NeedsHoverColor = css.AtomicStyle<{ ':hover': { color: 'blue' } }>;

export const nested: NeedsHoverColor = styles.hover;

// @ts-expect-error a root property does not satisfy a nested requirement
export const missingSelector: NeedsHoverColor = styles.tinted;

// @ts-expect-error the selector must contain the required property
export const missingNestedProperty: NeedsHoverColor = styles.hoverPosition;

export const acceptsDynamic: NeedsColor = styles.sized(120);

type DynamicColor = css.AtomicDynamicStyle<{ color: string }>;

export const dynamic: DynamicColor = styles.sized(120);

// @ts-expect-error a static style does not carry the dynamic brand
export const staticAsDynamic: DynamicColor = styles.tinted;

// @ts-expect-error dynamic styles must also contain the required property
export const dynamicMissingProperty: DynamicColor = styles.widthOnly(120);

// @ts-expect-error the function must be called to produce a style
export const uncalled: DynamicColor = styles.sized;

// @ts-expect-error an explicitly typed dynamic style is still not static
export const dynamicAsStatic: css.StaticStyles = dynamic;

// @ts-expect-error an atomic style is a single style, not a list
export const list: NeedsColor = [styles.tinted];

// @ts-expect-error a dynamic atomic style is not a list either
export const dynamicList: DynamicColor = [styles.sized(120)];

// @ts-expect-error falsy values belong to style lists
export const falseStyle: NeedsColor = false;

// @ts-expect-error null is not a single style
export const nullStyle: NeedsColor = null;

// @ts-expect-error undefined is not a single style
export const undefinedStyle: NeedsColor = undefined;

// @ts-expect-error the object holding the styles is not a single style
export const namespaces: NeedsColor = styles;

const foreign = { color: styles.tinted.color };

// @ts-expect-error even a correctly branded property does not brand its object
export const unbranded: NeedsColor = foreign;
