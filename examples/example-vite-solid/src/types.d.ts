import '@solidjs/web';
import type { Style } from '@plumeria/core';

declare module '@solidjs/web' {
  namespace JSX {
    interface HTMLAttributes<T> {
      classStyle?: Style;
    }
    interface SVGAttributes<T> {
      classStyle?: Style;
    }
  }
}
