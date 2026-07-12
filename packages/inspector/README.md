# @plumeria/inspector

A development inspector for visualizing and debugging styled components in the browser.

## Features

- **Inlined CSS** — No additional `.css` imports required. The stylesheet is bundled into the JavaScript output.
- **Zero production overhead** — Renders `null` and skips CSS injection when `process.env.NODE_ENV === 'production'`. Safe to leave in your root layout.

## Documentation(Demo)

Read the [documentation](https://plumeria.dev/docs/api-reference/components/inspector) for more details.
## Installation

```bash
pnpm install -D @plumeria/inspector
```

## Usage

```tsx
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

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd + I` / `Ctrl + I` | Toggle inspector |
| `Shift` | Lock / unlock target element |
