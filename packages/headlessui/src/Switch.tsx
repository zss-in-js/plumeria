import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

const SwitchRoot = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>((props, ref) => {
  return <SwitchPrimitive.Root ref={ref} {...props} />;
});
SwitchRoot.displayName = 'Switch';

const SwitchThumb = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Thumb>
>((props, ref) => {
  return <SwitchPrimitive.Thumb ref={ref} {...props} />;
});
SwitchThumb.displayName = 'SwitchThumb';

export const Switch = Object.assign(SwitchRoot, {
  Thumb: SwitchThumb,
});
