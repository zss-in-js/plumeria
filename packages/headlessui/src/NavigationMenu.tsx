import * as React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';

const NavigationMenuRoot = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>((props, ref) => {
  return <NavigationMenuPrimitive.Root ref={ref} {...props} />;
});
NavigationMenuRoot.displayName = 'NavigationMenu';

const NavigationMenuSub = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Sub>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Sub>
>((props, ref) => {
  return <NavigationMenuPrimitive.Sub ref={ref} {...props} />;
});
NavigationMenuSub.displayName = 'NavigationMenuSub';

const NavigationMenuList = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>((props, ref) => {
  return <NavigationMenuPrimitive.List ref={ref} {...props} />;
});
NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>
>((props, ref) => {
  return <NavigationMenuPrimitive.Item ref={ref} {...props} />;
});
NavigationMenuItem.displayName = 'NavigationMenuItem';

const NavigationMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>((props, ref) => {
  return <NavigationMenuPrimitive.Trigger ref={ref} {...props} />;
});
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

const NavigationMenuLink = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>((props, ref) => {
  return <NavigationMenuPrimitive.Link ref={ref} {...props} />;
});
NavigationMenuLink.displayName = 'NavigationMenuLink';

const NavigationMenuIndicator = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>((props, ref) => {
  return <NavigationMenuPrimitive.Indicator ref={ref} {...props} />;
});
NavigationMenuIndicator.displayName = 'NavigationMenuIndicator';

const NavigationMenuContent = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>((props, ref) => {
  return <NavigationMenuPrimitive.Content ref={ref} {...props} />;
});
NavigationMenuContent.displayName = 'NavigationMenuContent';

const NavigationMenuViewport = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>((props, ref) => {
  return <NavigationMenuPrimitive.Viewport ref={ref} {...props} />;
});
NavigationMenuViewport.displayName = 'NavigationMenuViewport';

export const NavigationMenu = Object.assign(NavigationMenuRoot, {
  Sub: NavigationMenuSub,
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Link: NavigationMenuLink,
  Indicator: NavigationMenuIndicator,
  Content: NavigationMenuContent,
  Viewport: NavigationMenuViewport,
});
