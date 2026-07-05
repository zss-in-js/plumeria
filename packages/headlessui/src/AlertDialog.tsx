import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

const AlertDialogRoot = (props: AlertDialogPrimitive.AlertDialogProps) => {
  return <AlertDialogPrimitive.Root {...props} />;
};
AlertDialogRoot.displayName = 'AlertDialog';

const AlertDialogTrigger = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Trigger>
>((props, ref) => {
  return <AlertDialogPrimitive.Trigger ref={ref} {...props} />;
});
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

const AlertDialogPortal = (props: AlertDialogPrimitive.AlertDialogPortalProps) => {
  return <AlertDialogPrimitive.Portal {...props} />;
};
AlertDialogPortal.displayName = 'AlertDialogPortal';

const AlertDialogOverlay = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>((props, ref) => {
  return <AlertDialogPrimitive.Overlay ref={ref} {...props} />;
});
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>((props, ref) => {
  return <AlertDialogPrimitive.Content ref={ref} {...props} />;
});
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogTitle = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>((props, ref) => {
  return <AlertDialogPrimitive.Title ref={ref} {...props} />;
});
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>((props, ref) => {
  return <AlertDialogPrimitive.Description ref={ref} {...props} />;
});
AlertDialogDescription.displayName = 'AlertDialogDescription';

const AlertDialogAction = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>((props, ref) => {
  return <AlertDialogPrimitive.Action ref={ref} {...props} />;
});
AlertDialogAction.displayName = 'AlertDialogAction';

const AlertDialogCancel = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>((props, ref) => {
  return <AlertDialogPrimitive.Cancel ref={ref} {...props} />;
});
AlertDialogCancel.displayName = 'AlertDialogCancel';

export const AlertDialog = Object.assign(AlertDialogRoot, {
  Trigger: AlertDialogTrigger,
  Portal: AlertDialogPortal,
  Overlay: AlertDialogOverlay,
  Content: AlertDialogContent,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Action: AlertDialogAction,
  Cancel: AlertDialogCancel,
});
