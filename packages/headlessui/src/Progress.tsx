import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

const ProgressRoot = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>((props, ref) => {
  return <ProgressPrimitive.Root ref={ref} {...props} />;
});
ProgressRoot.displayName = 'Progress';

const ProgressIndicator = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Indicator>
>((props, ref) => {
  return <ProgressPrimitive.Indicator ref={ref} {...props} />;
});
ProgressIndicator.displayName = 'ProgressIndicator';

export const Progress = Object.assign(ProgressRoot, {
  Indicator: ProgressIndicator,
});
