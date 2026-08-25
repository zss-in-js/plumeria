import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

const AvatarRoot = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>((props, ref) => {
  return <AvatarPrimitive.Root ref={ref} {...props} />;
});
AvatarRoot.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>((props, ref) => {
  return <AvatarPrimitive.Image ref={ref} {...props} />;
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>((props, ref) => {
  return <AvatarPrimitive.Fallback ref={ref} {...props} />;
});
AvatarFallback.displayName = 'AvatarFallback';

export const Avatar = Object.assign(AvatarRoot, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
});
