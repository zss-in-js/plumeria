import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as MenubarPrimitive from '@radix-ui/react-menubar';

const MenubarRoot = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>((props, ref) => {
  return <MenubarPrimitive.Root ref={ref} {...props} />;
});
MenubarRoot.displayName = 'Menubar';

const MenubarMenu = (props: MenubarPrimitive.MenubarMenuProps) => {
  return <MenubarPrimitive.Menu {...props} />;
};
MenubarMenu.displayName = 'MenubarMenu';

const MenubarTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>((props, ref) => {
  return <MenubarPrimitive.Trigger ref={ref} {...props} />;
});
MenubarTrigger.displayName = 'MenubarTrigger';

const MenubarPortal = (props: MenubarPrimitive.MenubarPortalProps) => {
  return <MenubarPrimitive.Portal {...props} />;
};
MenubarPortal.displayName = 'MenubarPortal';

const MenubarContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>((props, ref) => {
  return <MenubarPrimitive.Content ref={ref} {...props} />;
});
MenubarContent.displayName = 'MenubarContent';

const MenubarGroup = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Group>
>((props, ref) => {
  return <MenubarPrimitive.Group ref={ref} {...props} />;
});
MenubarGroup.displayName = 'MenubarGroup';

const MenubarLabel = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label>
>((props, ref) => {
  return <MenubarPrimitive.Label ref={ref} {...props} />;
});
MenubarLabel.displayName = 'MenubarLabel';

const MenubarItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>((props, ref) => {
  return <MenubarPrimitive.Item ref={ref} {...props} />;
});
MenubarItem.displayName = 'MenubarItem';

const MenubarCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>((props, ref) => {
  return <MenubarPrimitive.CheckboxItem ref={ref} {...props} />;
});
MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';

const MenubarRadioGroup = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup>
>((props, ref) => {
  return <MenubarPrimitive.RadioGroup ref={ref} {...props} />;
});
MenubarRadioGroup.displayName = 'MenubarRadioGroup';

const MenubarRadioItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>((props, ref) => {
  return <MenubarPrimitive.RadioItem ref={ref} {...props} />;
});
MenubarRadioItem.displayName = 'MenubarRadioItem';

const MenubarItemIndicator = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.ItemIndicator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.ItemIndicator>
>((props, ref) => {
  return <MenubarPrimitive.ItemIndicator ref={ref} {...props} />;
});
MenubarItemIndicator.displayName = 'MenubarItemIndicator';

const MenubarSeparator = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>((props, ref) => {
  return <MenubarPrimitive.Separator ref={ref} {...props} />;
});
MenubarSeparator.displayName = 'MenubarSeparator';

const MenubarArrow = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Arrow> & {
    styleName?: StyleName;
  }
>((props, ref) => {
  return <MenubarPrimitive.Arrow ref={ref} {...props} />;
});
MenubarArrow.displayName = 'MenubarArrow';

const MenubarSub = (props: MenubarPrimitive.MenubarSubProps) => {
  return <MenubarPrimitive.Sub {...props} />;
};
MenubarSub.displayName = 'MenubarSub';

const MenubarSubTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>
>((props, ref) => {
  return <MenubarPrimitive.SubTrigger ref={ref} {...props} />;
});
MenubarSubTrigger.displayName = 'MenubarSubTrigger';

const MenubarSubContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>((props, ref) => {
  return <MenubarPrimitive.SubContent ref={ref} {...props} />;
});
MenubarSubContent.displayName = 'MenubarSubContent';

export const Menubar = Object.assign(MenubarRoot, {
  Menu: MenubarMenu,
  Trigger: MenubarTrigger,
  Portal: MenubarPortal,
  Content: MenubarContent,
  Group: MenubarGroup,
  Label: MenubarLabel,
  Item: MenubarItem,
  CheckboxItem: MenubarCheckboxItem,
  RadioGroup: MenubarRadioGroup,
  RadioItem: MenubarRadioItem,
  ItemIndicator: MenubarItemIndicator,
  Separator: MenubarSeparator,
  Arrow: MenubarArrow,
  Sub: MenubarSub,
  SubTrigger: MenubarSubTrigger,
  SubContent: MenubarSubContent,
});
