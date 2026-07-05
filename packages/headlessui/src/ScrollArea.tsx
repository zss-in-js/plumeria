import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

const ScrollAreaRoot = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>((props, ref) => {
  return <ScrollAreaPrimitive.Root ref={ref} {...props} />;
});
ScrollAreaRoot.displayName = 'ScrollArea';

const ScrollAreaViewport = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport>
>((props, ref) => {
  return <ScrollAreaPrimitive.Viewport ref={ref} {...props} />;
});
ScrollAreaViewport.displayName = 'ScrollAreaViewport';

const ScrollAreaScrollbar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>((props, ref) => {
  return <ScrollAreaPrimitive.Scrollbar ref={ref} {...props} />;
});
ScrollAreaScrollbar.displayName = 'ScrollAreaScrollbar';

const ScrollAreaThumb = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Thumb>
>((props, ref) => {
  return <ScrollAreaPrimitive.Thumb ref={ref} {...props} />;
});
ScrollAreaThumb.displayName = 'ScrollAreaThumb';

const ScrollAreaCorner = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Corner>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Corner>
>((props, ref) => {
  return <ScrollAreaPrimitive.Corner ref={ref} {...props} />;
});
ScrollAreaCorner.displayName = 'ScrollAreaCorner';

export const ScrollArea = Object.assign(ScrollAreaRoot, {
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
});
