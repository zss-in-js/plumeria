import '@builder.io/qwik';
import type { Style } from '@plumeria/core';

declare module '@builder.io/qwik' {
  interface HTMLAttributes extends JSX.HTMLAttributes {
    classStyle?: Style;
  }
  interface SVGAttributes extends JSX.SVGAttributes {
    classStyle?: Style;
  }
}
