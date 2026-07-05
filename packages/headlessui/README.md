# @plumeria/headlessui

![License](https://img.shields.io/badge/License-MIT-10B981)
![npm](https://img.shields.io/npm/v/@plumeria/headlessui?&color=10B981)

A curated set of essential headless primitives, built on [Radix UI](https://www.radix-ui.com/) and designed to work seamlessly with Plumeria's `styleName` abstraction layer.

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
import { Accordion } from '@plumeria/headlessui';

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
    <Accordion.Item value="item-1">
      <Accordion.Header>
        <Accordion.Trigger styleName={styles.trigger}>
          Is it accessible?
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content styleName={styles.content}>
        Yes. It adheres to the WAI-ARIA design pattern.
      </Accordion.Content>
    </Accordion.Item>
  </Accordion>
);
```

## Components

The following twenty component groups are exported. All components support `ref` forwarding and props spread.

### Accordion

- `Item`
- `Header`
- `Trigger`
- `Content`

### AlertDialog

- `Trigger`
- `Portal`
- `Overlay`
- `Content`
- `Title`
- `Description`
- `Action`
- `Cancel`

### Checkbox

- `Indicator`

### Collapsible

- `Trigger`
- `Content`

### ContextMenu

- `Trigger`
- `Portal`
- `Content`
- `Group`
- `Label`
- `Item`
- `CheckboxItem`
- `RadioGroup`
- `RadioItem`
- `ItemIndicator`
- `Separator`
- `Arrow`
- `Sub`
- `SubTrigger`
- `SubContent`

### Dialog

- `Trigger`
- `Portal`
- `Overlay`
- `Content`
- `Title`
- `Description`
- `Close`

### DropdownMenu

- `Trigger`
- `Portal`
- `Content`
- `Group`
- `Label`
- `Item`
- `CheckboxItem`
- `RadioGroup`
- `RadioItem`
- `ItemIndicator`
- `Separator`
- `Arrow`
- `Sub`
- `SubTrigger`
- `SubContent`

### Menubar

- `Menu`
- `Trigger`
- `Portal`
- `Content`
- `Group`
- `Label`
- `Item`
- `CheckboxItem`
- `RadioGroup`
- `RadioItem`
- `ItemIndicator`
- `Separator`
- `Arrow`
- `Sub`
- `SubTrigger`
- `SubContent`

### NavigationMenu

- `Sub`
- `List`
- `Item`
- `Trigger`
- `Link`
- `Indicator`
- `Content`
- `Viewport`

### Popover

- `Trigger`
- `Portal`
- `Content`
- `Close`
- `Arrow`
- `Anchor`

### RadioGroup

- `Item`
- `Indicator`

### ScrollArea

- `Viewport`
- `Scrollbar`
- `Thumb`
- `Corner`

### Select

- `Trigger`
- `Value`
- `Icon`
- `Portal`
- `Content`
- `Viewport`
- `Group`
- `Label`
- `Item`
- `ItemText`
- `ItemIndicator`
- `ScrollUpButton`
- `ScrollDownButton`
- `Separator`
- `Arrow`

### Slider

- `Track`
- `Range`
- `Thumb`

### Switch

- `Thumb`

### Tabs

- `List`
- `Trigger`
- `Content`

### Toast

- `Provider`
- `Viewport`
- `Title`
- `Description`
- `Action`
- `Close`

### Toggle


### ToggleGroup

- `Item`

### Tooltip

- `Provider`
- `Trigger`
- `Portal`
- `Content`
- `Arrow`

## License

Plumeria is MIT licensed.
