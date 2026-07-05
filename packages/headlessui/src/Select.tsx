import * as React from 'react';
import type { StyleName } from '@plumeria/core';
import * as SelectPrimitive from '@radix-ui/react-select';

const SelectRoot = (props: SelectPrimitive.SelectProps) => {
  return <SelectPrimitive.Root {...props} />;
};
SelectRoot.displayName = 'Select';

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>((props, ref) => {
  return <SelectPrimitive.Trigger ref={ref} {...props} />;
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>((props, ref) => {
  return <SelectPrimitive.Value ref={ref} {...props} />;
});
SelectValue.displayName = 'SelectValue';

const SelectIcon = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Icon>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Icon>
>((props, ref) => {
  return <SelectPrimitive.Icon ref={ref} {...props} />;
});
SelectIcon.displayName = 'SelectIcon';

const SelectPortal = (props: SelectPrimitive.SelectPortalProps) => {
  return <SelectPrimitive.Portal {...props} />;
};
SelectPortal.displayName = 'SelectPortal';

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>((props, ref) => {
  return <SelectPrimitive.Content ref={ref} {...props} />;
});
SelectContent.displayName = 'SelectContent';

const SelectViewport = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Viewport>
>((props, ref) => {
  return <SelectPrimitive.Viewport ref={ref} {...props} />;
});
SelectViewport.displayName = 'SelectViewport';

const SelectGroup = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>
>((props, ref) => {
  return <SelectPrimitive.Group ref={ref} {...props} />;
});
SelectGroup.displayName = 'SelectGroup';

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>((props, ref) => {
  return <SelectPrimitive.Label ref={ref} {...props} />;
});
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>((props, ref) => {
  return <SelectPrimitive.Item ref={ref} {...props} />;
});
SelectItem.displayName = 'SelectItem';

const SelectItemText = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ItemText>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ItemText>
>((props, ref) => {
  return <SelectPrimitive.ItemText ref={ref} {...props} />;
});
SelectItemText.displayName = 'SelectItemText';

const SelectItemIndicator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ItemIndicator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ItemIndicator>
>((props, ref) => {
  return <SelectPrimitive.ItemIndicator ref={ref} {...props} />;
});
SelectItemIndicator.displayName = 'SelectItemIndicator';

const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>((props, ref) => {
  return <SelectPrimitive.ScrollUpButton ref={ref} {...props} />;
});
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>((props, ref) => {
  return <SelectPrimitive.ScrollDownButton ref={ref} {...props} />;
});
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>((props, ref) => {
  return <SelectPrimitive.Separator ref={ref} {...props} />;
});
SelectSeparator.displayName = 'SelectSeparator';

const SelectArrow = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Arrow> & {
    styleName?: StyleName;
  }
>((props, ref) => {
  return <SelectPrimitive.Arrow ref={ref} {...props} />;
});
SelectArrow.displayName = 'SelectArrow';

export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Value: SelectValue,
  Icon: SelectIcon,
  Portal: SelectPortal,
  Content: SelectContent,
  Viewport: SelectViewport,
  Group: SelectGroup,
  Label: SelectLabel,
  Item: SelectItem,
  ItemText: SelectItemText,
  ItemIndicator: SelectItemIndicator,
  ScrollUpButton: SelectScrollUpButton,
  ScrollDownButton: SelectScrollDownButton,
  Separator: SelectSeparator,
  Arrow: SelectArrow,
});
