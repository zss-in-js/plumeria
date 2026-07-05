import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

const SliderRoot = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>((props, ref) => {
  return <SliderPrimitive.Root ref={ref} {...props} />;
});
SliderRoot.displayName = 'Slider';

const SliderTrack = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Track>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Track>
>((props, ref) => {
  return <SliderPrimitive.Track ref={ref} {...props} />;
});
SliderTrack.displayName = 'SliderTrack';

const SliderRange = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Range>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Range>
>((props, ref) => {
  return <SliderPrimitive.Range ref={ref} {...props} />;
});
SliderRange.displayName = 'SliderRange';

const SliderThumb = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb>
>((props, ref) => {
  return <SliderPrimitive.Thumb ref={ref} {...props} />;
});
SliderThumb.displayName = 'SliderThumb';

export const Slider = Object.assign(SliderRoot, {
  Track: SliderTrack,
  Range: SliderRange,
  Thumb: SliderThumb,
});
