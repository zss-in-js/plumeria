import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

const CollapsibleRoot = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>((props, ref) => {
  return <CollapsiblePrimitive.Root ref={ref} {...props} />;
});
CollapsibleRoot.displayName = 'Collapsible';

const CollapsibleTrigger = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>((props, ref) => {
  return <CollapsiblePrimitive.Trigger ref={ref} {...props} />;
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

const CollapsibleContent = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>((props, ref) => {
  return <CollapsiblePrimitive.Content ref={ref} {...props} />;
});
CollapsibleContent.displayName = 'CollapsibleContent';

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});
