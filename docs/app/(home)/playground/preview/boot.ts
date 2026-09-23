import { createElement, useEffect, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { beginStyles, commitStyles, discardStyles } from './core';

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

function Preview({ component: Component }: { component: ComponentType }) {
  useEffect(() => {
    window.parent.postMessage({ type: 'playground:rendered' }, '*');
  }, []);
  return createElement(Component);
}

async function render(code: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));

  try {
    beginStyles();
    const module = (await import(/* webpackIgnore: true */ url)) as Record<string, unknown>;
    const Component = pickComponent(module);

    if (!Component) {
      discardStyles();
      root.render(null);
      status.textContent = 'Export a component to see it rendered.';
      return;
    }

    status.textContent = '';
    flushSync(() => root.render(createElement(Preview, { component: Component })));
    commitStyles();
  } catch (error) {
    window.parent.postMessage({ type: 'playground:rendered' }, '*');
    discardStyles();
    status.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    URL.revokeObjectURL(url);
  }
}

let renderQueue = Promise.resolve();
let revision = 0;

window.addEventListener('message', (event: MessageEvent<Message>) => {
  if (event.data?.type === 'playground:render') {
    const current = ++revision;
    const code = event.data.code;
    renderQueue = renderQueue.then(() => (current === revision ? render(code) : undefined));
  }
  if (event.data?.type === 'playground:theme') {
    document.documentElement.style.colorScheme = event.data.dark ? 'dark' : 'light';
  }
});

window.parent.postMessage({ type: 'playground:ready' }, '*');
