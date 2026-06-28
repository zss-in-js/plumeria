import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = (props: DialogPrimitive.DialogProps) => {
  return <DialogPrimitive.Root {...props} />;
};
Dialog.displayName = 'Dialog';

export const DialogTrigger = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
  return <DialogPrimitive.Trigger ref={ref} {...props} />;
});
DialogTrigger.displayName = 'DialogTrigger';

export const DialogPortal = (props: DialogPrimitive.DialogPortalProps) => {
  return <DialogPrimitive.Portal {...props} />;
};
DialogPortal.displayName = 'DialogPortal';

export const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>((props, ref) => {
  return <DialogPrimitive.Overlay ref={ref} {...props} />;
});
DialogOverlay.displayName = 'DialogOverlay';

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>((props, ref) => {
  return <DialogPrimitive.Content ref={ref} {...props} />;
});
DialogContent.displayName = 'DialogContent';

export const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>((props, ref) => {
  return <DialogPrimitive.Title ref={ref} {...props} />;
});
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>((props, ref) => {
  return <DialogPrimitive.Description ref={ref} {...props} />;
});
DialogDescription.displayName = 'DialogDescription';

export const DialogClose = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>((props, ref) => {
  return <DialogPrimitive.Close ref={ref} {...props} />;
});
DialogClose.displayName = 'DialogClose';
