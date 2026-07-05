import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

const DropdownMenuRoot = (props: DropdownMenuPrimitive.DropdownMenuProps) => {
  return <DropdownMenuPrimitive.Root {...props} />;
};
DropdownMenuRoot.displayName = 'DropdownMenu';

const DropdownMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>((props, ref) => {
  return <DropdownMenuPrimitive.Trigger ref={ref} {...props} />;
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuPortal = (
  props: DropdownMenuPrimitive.DropdownMenuPortalProps,
) => {
  return <DropdownMenuPrimitive.Portal {...props} />;
};
DropdownMenuPortal.displayName = 'DropdownMenuPortal';

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>((props, ref) => {
  return <DropdownMenuPrimitive.Content ref={ref} {...props} />;
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuGroup = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>
>((props, ref) => {
  return <DropdownMenuPrimitive.Group ref={ref} {...props} />;
});
DropdownMenuGroup.displayName = 'DropdownMenuGroup';

const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>((props, ref) => {
  return <DropdownMenuPrimitive.Label ref={ref} {...props} />;
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>((props, ref) => {
  return <DropdownMenuPrimitive.Item ref={ref} {...props} />;
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>((props, ref) => {
  return <DropdownMenuPrimitive.CheckboxItem ref={ref} {...props} />;
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioGroup = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioGroup>
>((props, ref) => {
  return <DropdownMenuPrimitive.RadioGroup ref={ref} {...props} />;
});
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>((props, ref) => {
  return <DropdownMenuPrimitive.RadioItem ref={ref} {...props} />;
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuItemIndicator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.ItemIndicator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.ItemIndicator>
>((props, ref) => {
  return <DropdownMenuPrimitive.ItemIndicator ref={ref} {...props} />;
});
DropdownMenuItemIndicator.displayName = 'DropdownMenuItemIndicator';

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>((props, ref) => {
  return <DropdownMenuPrimitive.Separator ref={ref} {...props} />;
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuArrow = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Arrow> & {
    styleName?: StyleName;
  }
>((props, ref) => {
  return <DropdownMenuPrimitive.Arrow ref={ref} {...props} />;
});
DropdownMenuArrow.displayName = 'DropdownMenuArrow';

const DropdownMenuSub = (props: DropdownMenuPrimitive.DropdownMenuSubProps) => {
  return <DropdownMenuPrimitive.Sub {...props} />;
};
DropdownMenuSub.displayName = 'DropdownMenuSub';

const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>((props, ref) => {
  return <DropdownMenuPrimitive.SubTrigger ref={ref} {...props} />;
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>((props, ref) => {
  return <DropdownMenuPrimitive.SubContent ref={ref} {...props} />;
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Portal: DropdownMenuPortal,
  Content: DropdownMenuContent,
  Group: DropdownMenuGroup,
  Label: DropdownMenuLabel,
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  ItemIndicator: DropdownMenuItemIndicator,
  Separator: DropdownMenuSeparator,
  Arrow: DropdownMenuArrow,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
});
