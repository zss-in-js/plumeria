import type { Style } from '#types';

global {
  namespace React {
    interface HTMLAttributes<T> {
      classStyle?: Style;
    }
    interface SVGAttributes<T> {
      classStyle?: Style;
    }
  }
}
