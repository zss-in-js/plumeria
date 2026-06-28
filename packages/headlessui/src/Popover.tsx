import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as PopoverPrimitive from '@radix-ui/react-popover';

export const Popover = (props: PopoverPrimitive.PopoverProps) => {
  return <PopoverPrimitive.Root {...props} />;
};
Popover.displayName = 'Popover';

export const PopoverTrigger = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => {
  return <PopoverPrimitive.Trigger ref={ref} {...props} />;
});
PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverPortal = (props: PopoverPrimitive.PopoverPortalProps) => {
  return <PopoverPrimitive.Portal {...props} />;
};
PopoverPortal.displayName = 'PopoverPortal';

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>((props, ref) => {
  return <PopoverPrimitive.Content ref={ref} {...props} />;
});
PopoverContent.displayName = 'PopoverContent';

export const PopoverClose = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close>
>((props, ref) => {
  return <PopoverPrimitive.Close ref={ref} {...props} />;
});
PopoverClose.displayName = 'PopoverClose';

export const PopoverArrow = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow> & { styleName?: StyleName }
>((props, ref) => {
  return <PopoverPrimitive.Arrow ref={ref} {...props} />;
});
PopoverArrow.displayName = 'PopoverArrow';

export const PopoverAnchor = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>((props, ref) => {
  return <PopoverPrimitive.Anchor ref={ref} {...props} />;
});
PopoverAnchor.displayName = 'PopoverAnchor';
