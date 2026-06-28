# @plumeria/headlessui

![License](https://img.shields.io/badge/License-MIT-10B981)
![npm](https://img.shields.io/npm/v/@plumeria/headlessui?&color=10B981)

Accessible UI component wrappers built on [Radix UI](https://www.radix-ui.com/) primitives, designed to work seamlessly with Plumeria's `styleName` abstraction layer.

Each component is a pure passthrough — it forwards refs and spreads props onto the underlying Radix primitive. `styleName` is compiled to `className`/`style` at the call site before the component runs, so no Plumeria-specific logic is needed inside the components.

## Documentation

Read the [documentation](https://plumeria.dev/docs/api-reference/components/headlessui) for more details.

## Installation

```sh
pnpm i @plumeria/headlessui
```

> **Note:** `@plumeria/core` and a bundler plugin are required. See the [Installation guide](https://plumeria.dev/docs/getting-started/installation).

## Example

```tsx
import * as css from '@plumeria/core';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from '@plumeria/headlessui';

const styles = css.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    border: '1px solid #e4e4e7',
    borderRadius: '8px',
  },
  trigger: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
  },
  content: {
    padding: '14px 18px',
    fontSize: '13.5px',
    borderTop: '1px solid #e4e4e7',
  },
});

export const FAQ = () => (
  <Accordion type="single" collapsible styleName={styles.root}>
    <AccordionItem value="item-1">
      <AccordionHeader>
        <AccordionTrigger styleName={styles.trigger}>
          Is it accessible?
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent styleName={styles.content}>
        Yes. It adheres to the WAI-ARIA design pattern.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
```

## Components

| Component group | Primitives |
|---|---|
| **Dialog** | Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose |
| **Popover** | Popover, PopoverTrigger, PopoverPortal, PopoverContent, PopoverClose, PopoverArrow, PopoverAnchor |
| **Tooltip** | TooltipProvider, Tooltip, TooltipTrigger, TooltipPortal, TooltipContent, TooltipArrow |
| **Accordion** | Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent |
| **Tabs** | Tabs, TabsList, TabsTrigger, TabsContent |
| **Collapsible** | Collapsible, CollapsibleTrigger, CollapsibleContent |

## License

Plumeria is MIT licensed.
