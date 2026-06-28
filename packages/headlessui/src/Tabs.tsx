import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

export const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>((props, ref) => {
  return <TabsPrimitive.Root ref={ref} {...props} />;
});
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>((props, ref) => {
  return <TabsPrimitive.List ref={ref} {...props} />;
});
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>((props, ref) => {
  return <TabsPrimitive.Trigger ref={ref} {...props} />;
});
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>((props, ref) => {
  return <TabsPrimitive.Content ref={ref} {...props} />;
});
TabsContent.displayName = 'TabsContent';
