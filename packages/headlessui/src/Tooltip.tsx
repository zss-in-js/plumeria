import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = (props: TooltipPrimitive.TooltipProviderProps) => {
  return <TooltipPrimitive.Provider {...props} />;
};
TooltipProvider.displayName = 'TooltipProvider';

export const Tooltip = (props: TooltipPrimitive.TooltipProps) => {
  return <TooltipPrimitive.Root {...props} />;
};
Tooltip.displayName = 'Tooltip';

export const TooltipTrigger = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>((props, ref) => {
  return <TooltipPrimitive.Trigger ref={ref} {...props} />;
});
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipPortal = (props: TooltipPrimitive.TooltipPortalProps) => {
  return <TooltipPrimitive.Portal {...props} />;
};
TooltipPortal.displayName = 'TooltipPortal';

export const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>((props, ref) => {
  return <TooltipPrimitive.Content ref={ref} {...props} />;
});
TooltipContent.displayName = 'TooltipContent';

export const TooltipArrow = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow> & { styleName?: StyleName }
>((props, ref) => {
  return <TooltipPrimitive.Arrow ref={ref} {...props} />;
});
TooltipArrow.displayName = 'TooltipArrow';
