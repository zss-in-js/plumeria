import 'preact';
import type { StyleName } from '@plumeria/core';

declare module 'preact' {
  namespace JSX {
    interface HTMLAttributes {
      styleName?: StyleName;
    }
  }
}
