import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';

const ContextMenuRoot = (props: ContextMenuPrimitive.ContextMenuProps) => {
  return <ContextMenuPrimitive.Root {...props} />;
};
ContextMenuRoot.displayName = 'ContextMenu';

const ContextMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Trigger>
>((props, ref) => {
  return <ContextMenuPrimitive.Trigger ref={ref} {...props} />;
});
ContextMenuTrigger.displayName = 'ContextMenuTrigger';

const ContextMenuPortal = (
  props: ContextMenuPrimitive.ContextMenuPortalProps,
) => {
  return <ContextMenuPrimitive.Portal {...props} />;
};
ContextMenuPortal.displayName = 'ContextMenuPortal';

const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>((props, ref) => {
  return <ContextMenuPrimitive.Content ref={ref} {...props} />;
});
ContextMenuContent.displayName = 'ContextMenuContent';

const ContextMenuGroup = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Group>
>((props, ref) => {
  return <ContextMenuPrimitive.Group ref={ref} {...props} />;
});
ContextMenuGroup.displayName = 'ContextMenuGroup';

const ContextMenuLabel = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>
>((props, ref) => {
  return <ContextMenuPrimitive.Label ref={ref} {...props} />;
});
ContextMenuLabel.displayName = 'ContextMenuLabel';

const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item>
>((props, ref) => {
  return <ContextMenuPrimitive.Item ref={ref} {...props} />;
});
ContextMenuItem.displayName = 'ContextMenuItem';

const ContextMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>((props, ref) => {
  return <ContextMenuPrimitive.CheckboxItem ref={ref} {...props} />;
});
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

const ContextMenuRadioGroup = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioGroup>
>((props, ref) => {
  return <ContextMenuPrimitive.RadioGroup ref={ref} {...props} />;
});
ContextMenuRadioGroup.displayName = 'ContextMenuRadioGroup';

const ContextMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>((props, ref) => {
  return <ContextMenuPrimitive.RadioItem ref={ref} {...props} />;
});
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';

const ContextMenuItemIndicator = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.ItemIndicator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.ItemIndicator>
>((props, ref) => {
  return <ContextMenuPrimitive.ItemIndicator ref={ref} {...props} />;
});
ContextMenuItemIndicator.displayName = 'ContextMenuItemIndicator';

const ContextMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>((props, ref) => {
  return <ContextMenuPrimitive.Separator ref={ref} {...props} />;
});
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

const ContextMenuArrow = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Arrow> & {
    styleName?: StyleName;
  }
>((props, ref) => {
  return <ContextMenuPrimitive.Arrow ref={ref} {...props} />;
});
ContextMenuArrow.displayName = 'ContextMenuArrow';

const ContextMenuSub = (props: ContextMenuPrimitive.ContextMenuSubProps) => {
  return <ContextMenuPrimitive.Sub {...props} />;
};
ContextMenuSub.displayName = 'ContextMenuSub';

const ContextMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger>
>((props, ref) => {
  return <ContextMenuPrimitive.SubTrigger ref={ref} {...props} />;
});
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';

const ContextMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>((props, ref) => {
  return <ContextMenuPrimitive.SubContent ref={ref} {...props} />;
});
ContextMenuSubContent.displayName = 'ContextMenuSubContent';

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Portal: ContextMenuPortal,
  Content: ContextMenuContent,
  Group: ContextMenuGroup,
  Label: ContextMenuLabel,
  Item: ContextMenuItem,
  CheckboxItem: ContextMenuCheckboxItem,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  ItemIndicator: ContextMenuItemIndicator,
  Separator: ContextMenuSeparator,
  Arrow: ContextMenuArrow,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
});
