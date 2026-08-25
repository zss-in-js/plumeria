import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

const LabelRoot = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>((props, ref) => {
  return <LabelPrimitive.Root ref={ref} {...props} />;
});
LabelRoot.displayName = 'Label';

export const Label = LabelRoot;
