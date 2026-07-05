import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';

const AccordionRoot = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
>((props, ref) => {
  return <AccordionPrimitive.Root ref={ref} {...props} />;
});
AccordionRoot.displayName = 'Accordion';

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>((props, ref) => {
  return <AccordionPrimitive.Item ref={ref} {...props} />;
});
AccordionItem.displayName = 'AccordionItem';

const AccordionHeader = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Header>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Header>
>((props, ref) => {
  return <AccordionPrimitive.Header ref={ref} {...props} />;
});
AccordionHeader.displayName = 'AccordionHeader';

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>((props, ref) => {
  return <AccordionPrimitive.Trigger ref={ref} {...props} />;
});
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>((props, ref) => {
  return <AccordionPrimitive.Content ref={ref} {...props} />;
});
AccordionContent.displayName = 'AccordionContent';

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
