import type { CSSProperties } from 'react';

/**
 * Home and blog run on the docs layout so they share its sidebar drawer, but they have no
 * page of their own to put beside it: the sidebar column collapses to zero (`global.css`
 * hides what is left of it above the drawer breakpoint) and the content spans the grid.
 */
export const plainContainerProps = {
  className: 'fd-plain',
  style: {
    '--fd-layout-width': '1440px',
    '--fd-header-height': '56px',
    '--fd-sidebar-width': '0px',
  } as CSSProperties,
};

export const plainMainStyle: CSSProperties = {
  gridRow: 'main',
  gridColumn: '1 / -1',
  // Same reason as the header: spanning the whole grid would otherwise hand this content's
  // min-content width to the outer `minmax(min-content, 1fr)` tracks and blow the layout
  // out past the viewport.
  contain: 'inline-size',
};
