import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

const CheckboxRoot = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>((props, ref) => {
  return <CheckboxPrimitive.Root ref={ref} {...props} />;
});
CheckboxRoot.displayName = 'Checkbox';

const CheckboxIndicator = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>
>((props, ref) => {
  return <CheckboxPrimitive.Indicator ref={ref} {...props} />;
});
CheckboxIndicator.displayName = 'CheckboxIndicator';

export const Checkbox = Object.assign(CheckboxRoot, {
  Indicator: CheckboxIndicator,
});
