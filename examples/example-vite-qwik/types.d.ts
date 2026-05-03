import '@builder.io/qwik';
import type { StyleName } from '@plumeria/core';

declare module '@builder.io/qwik' {
  interface HTMLAttributes extends JSX.HTMLAttributes {
    styleName?: StyleName;
  }
}
