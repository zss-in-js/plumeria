import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';

const ToggleRoot = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>((props, ref) => {
  return <TogglePrimitive.Root ref={ref} {...props} />;
});
ToggleRoot.displayName = 'Toggle';

export const Toggle = ToggleRoot;
