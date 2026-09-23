import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { resetStyles } from './core';

type Message = { type: 'playground:render'; code: string } | { type: 'playground:theme'; dark: boolean };

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
const status = document.getElementById('status') as HTMLElement;

function pickComponent(module: Record<string, unknown>): ComponentType | undefined {
  if (typeof module.default === 'function') return module.default as ComponentType;

  for (const value of Object.values(module)) {
    if (typeof value === 'function') return value as ComponentType;
  }

  return undefined;
}

async function render(code: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));

  try {
    resetStyles();
    const module = (await import(/* webpackIgnore: true */ url)) as Record<string, unknown>;
    const Component = pickComponent(module);

    if (!Component) {
      root.render(null);
      status.textContent = 'Export a component to see it rendered.';
      return;
    }

    status.textContent = '';
    root.render(createElement(Component));
  } catch (error) {
    root.render(null);
    status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    URL.revokeObjectURL(url);
  }
}

window.addEventListener('message', (event: MessageEvent<Message>) => {
  if (event.data?.type === 'playground:render') void render(event.data.code);
  if (event.data?.type === 'playground:theme') {
    document.documentElement.style.colorScheme = event.data.dark ? 'dark' : 'light';
  }
});

window.parent.postMessage({ type: 'playground:ready' }, '*');
