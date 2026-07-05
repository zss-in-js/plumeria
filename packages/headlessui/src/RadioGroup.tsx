import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

const RadioGroupRoot = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>((props, ref) => {
  return <RadioGroupPrimitive.Root ref={ref} {...props} />;
});
RadioGroupRoot.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>((props, ref) => {
  return <RadioGroupPrimitive.Item ref={ref} {...props} />;
});
RadioGroupItem.displayName = 'RadioGroupItem';

const RadioGroupIndicator = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Indicator>
>((props, ref) => {
  return <RadioGroupPrimitive.Indicator ref={ref} {...props} />;
});
RadioGroupIndicator.displayName = 'RadioGroupIndicator';

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
});
