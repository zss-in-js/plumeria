import type { Style } from '#types';

declare global {
  namespace React {
    interface HTMLAttributes<T> {
      classStyle?: Style;
    }
    interface SVGAttributes<T> {
      classStyle?: Style;
    }
  }
}
