# @plumeria/inspector

A development inspector for visualizing and debugging styled components in the browser.

## Documentation(Demo)

Read the [documentation](https://plumeria.dev/docs/api-reference/components/inspector) for more details.
## Installation

```bash
pnpm install -D @plumeria/inspector
```

## Usage

```tsx
// Use '@plumeria/inspector/production' subpath in production.
import { Inspector } from '@plumeria/inspector'; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Inspector />
      </body>
    </html>
  );
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `initial` | `boolean` | `false` | If `true`, the inspector starts toggled ON. If `false`, it starts toggled OFF. |

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd + I` / `Ctrl + I` | Toggle inspector |
| `Shift` | Lock / unlock target element |

