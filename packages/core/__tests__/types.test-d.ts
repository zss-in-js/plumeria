import * as css from '@plumeria/core';

const styles = css.create({
  text: {
    fontSize: '12px',
    color: 'red',
  },
  hover: {
    ':hover': {
      color: 'blue',
    },
  },
  media: {
    '@media (min-width: 640px)': {
      display: 'flex',
    },
  },
  attr: {
    '[data-active="true"]': {
      opacity: 1,
    },
  },
  variant: (size: number) => ({
    width: `${size}px`,
  }),
});

export const atomic: string = styles.text.color;
export const branded: css.AtomicClassNameFor<'color', 'red'> =
  styles.text.color;
export const nested: string = styles.hover[':hover'].color;
export const inAtRule: string =
  styles.media['@media (min-width: 640px)'].display;
export const inAttr: string = styles.attr['[data-active="true"]'].opacity;
export const fromVariant: string = styles.variant(8).width;

// @ts-expect-error atomic class names are branded per property
export const crossed: css.AtomicClassNameFor<'color', 'red'> =
  styles.text.fontSize;

const theme = css.createTheme('.dark', {
  textColor: { default: 'black', theme: 'white' },
});
export const themed: string = theme.textColor.theme;

// @ts-expect-error a theme selector must start with `.`, `[` or an at-rule
css.createTheme('dark', { textColor: { default: 'black', theme: 'white' } });

// @ts-expect-error theme values are strings on both sides
css.createTheme('.dark', { fontSize: { default: 16, theme: 20 } });

export const statics: { readonly space: '4px'; readonly depth: 10 } =
  css.createStatic({
    space: '4px',
    depth: 10,
  });

export const frames: string = css.keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
  '50%': {
    opacity: 0.5,
  },
});

export const transition: string = css.viewTransition({
  old: {
    opacity: 0,
  },
  new: {
    opacity: 1,
  },
});

export const marked = css.marker('badge', '::before');
export const extended: '@container style(--badge-hover: 1)' = css.extended(
  'badge',
  ':hover',
);

export const merged: string = css.use(styles.text, false, null, undefined, [
  styles.hover,
]);
