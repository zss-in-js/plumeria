import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

const DialogRoot = (props: DialogPrimitive.DialogProps) => {
  return <DialogPrimitive.Root {...props} />;
};
DialogRoot.displayName = 'Dialog';

const DialogTrigger = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
  return <DialogPrimitive.Trigger ref={ref} {...props} />;
});
DialogTrigger.displayName = 'DialogTrigger';

const DialogPortal = (props: DialogPrimitive.DialogPortalProps) => {
  return <DialogPrimitive.Portal {...props} />;
};
DialogPortal.displayName = 'DialogPortal';

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>((props, ref) => {
  return <DialogPrimitive.Overlay ref={ref} {...props} />;
});
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>((props, ref) => {
  return <DialogPrimitive.Content ref={ref} {...props} />;
});
DialogContent.displayName = 'DialogContent';

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>((props, ref) => {
  return <DialogPrimitive.Title ref={ref} {...props} />;
});
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>((props, ref) => {
  return <DialogPrimitive.Description ref={ref} {...props} />;
});
DialogDescription.displayName = 'DialogDescription';

const DialogClose = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>((props, ref) => {
  return <DialogPrimitive.Close ref={ref} {...props} />;
});
DialogClose.displayName = 'DialogClose';

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});
