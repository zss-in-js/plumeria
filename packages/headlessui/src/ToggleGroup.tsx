import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

const ToggleGroupRoot = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>((props, ref) => {
  return <ToggleGroupPrimitive.Root ref={ref} {...props} />;
});
ToggleGroupRoot.displayName = 'ToggleGroup';

const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>((props, ref) => {
  return <ToggleGroupPrimitive.Item ref={ref} {...props} />;
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export const ToggleGroup = Object.assign(ToggleGroupRoot, {
  Item: ToggleGroupItem,
});
