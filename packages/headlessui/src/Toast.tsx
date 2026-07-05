import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';

const ToastProvider = (props: ToastPrimitive.ToastProviderProps) => {
  return <ToastPrimitive.Provider {...props} />;
};
ToastProvider.displayName = 'ToastProvider';

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>((props, ref) => {
  return <ToastPrimitive.Viewport ref={ref} {...props} />;
});
ToastViewport.displayName = 'ToastViewport';

const ToastRoot = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>
>((props, ref) => {
  return <ToastPrimitive.Root ref={ref} {...props} />;
});
ToastRoot.displayName = 'Toast';

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>((props, ref) => {
  return <ToastPrimitive.Title ref={ref} {...props} />;
});
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>((props, ref) => {
  return <ToastPrimitive.Description ref={ref} {...props} />;
});
ToastDescription.displayName = 'ToastDescription';

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>((props, ref) => {
  return <ToastPrimitive.Action ref={ref} {...props} />;
});
ToastAction.displayName = 'ToastAction';

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>((props, ref) => {
  return <ToastPrimitive.Close ref={ref} {...props} />;
});
ToastClose.displayName = 'ToastClose';

export const Toast = Object.assign(ToastRoot, {
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
});
