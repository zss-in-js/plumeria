import * as React from 'react';
import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden';

const VisuallyHiddenRoot = React.forwardRef<
  React.ComponentRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>((props, ref) => {
  return <VisuallyHiddenPrimitive.Root ref={ref} {...props} />;
});
VisuallyHiddenRoot.displayName = 'VisuallyHidden';

export const VisuallyHidden = VisuallyHiddenRoot;
