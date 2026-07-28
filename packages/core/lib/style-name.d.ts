import type { Style } from '#types';

global {
  namespace React {
    interface HTMLAttributes<T> {
      styleName?: Style;
    }
    interface SVGAttributes<T> {
      styleName?: Style;
    }
  }
}
