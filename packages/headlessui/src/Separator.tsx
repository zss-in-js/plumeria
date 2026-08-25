import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

const SeparatorRoot = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>((props, ref) => {
  return <SeparatorPrimitive.Root ref={ref} {...props} />;
});
SeparatorRoot.displayName = 'Separator';

export const Separator = SeparatorRoot;
