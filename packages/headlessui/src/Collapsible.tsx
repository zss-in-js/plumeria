import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

export const Collapsible = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>((props, ref) => {
  return <CollapsiblePrimitive.Root ref={ref} {...props} />;
});
Collapsible.displayName = 'Collapsible';

export const CollapsibleTrigger = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>((props, ref) => {
  return <CollapsiblePrimitive.Trigger ref={ref} {...props} />;
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

export const CollapsibleContent = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>((props, ref) => {
  return <CollapsiblePrimitive.Content ref={ref} {...props} />;
});
CollapsibleContent.displayName = 'CollapsibleContent';
