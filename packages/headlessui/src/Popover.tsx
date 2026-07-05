import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as PopoverPrimitive from '@radix-ui/react-popover';

const PopoverRoot = (props: PopoverPrimitive.PopoverProps) => {
  return <PopoverPrimitive.Root {...props} />;
};
PopoverRoot.displayName = 'Popover';

const PopoverTrigger = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>((props, ref) => {
  return <PopoverPrimitive.Trigger ref={ref} {...props} />;
});
PopoverTrigger.displayName = 'PopoverTrigger';

const PopoverPortal = (props: PopoverPrimitive.PopoverPortalProps) => {
  return <PopoverPrimitive.Portal {...props} />;
};
PopoverPortal.displayName = 'PopoverPortal';

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>((props, ref) => {
  return <PopoverPrimitive.Content ref={ref} {...props} />;
});
PopoverContent.displayName = 'PopoverContent';

const PopoverClose = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close>
>((props, ref) => {
  return <PopoverPrimitive.Close ref={ref} {...props} />;
});
PopoverClose.displayName = 'PopoverClose';

const PopoverArrow = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow> & {
    styleName?: StyleName;
  }
>((props, ref) => {
  return <PopoverPrimitive.Arrow ref={ref} {...props} />;
});
PopoverArrow.displayName = 'PopoverArrow';

const PopoverAnchor = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>((props, ref) => {
  return <PopoverPrimitive.Anchor ref={ref} {...props} />;
});
PopoverAnchor.displayName = 'PopoverAnchor';

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Content: PopoverContent,
  Close: PopoverClose,
  Arrow: PopoverArrow,
  Anchor: PopoverAnchor,
});
