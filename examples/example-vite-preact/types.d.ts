import 'preact';
import type { Style } from '@plumeria/core';

declare module 'preact' {
  namespace JSX {
    interface HTMLAttributes {
      classStyle?: Style;
    }
    interface SVGAttributes {
      classStyle?: Style;
    }
  }
}
