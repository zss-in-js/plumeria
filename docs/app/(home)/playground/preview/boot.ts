import { createElement, useEffect, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { beginStyles, commitStyles, discardStyles } from './core';

type Message =
  | { type: 'playground:render'; files: Record<string, string>; entry: string }
  | { type: 'playground:theme'; dark: boolean };

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

const RELATIVE_SPECIFIER = /(from\s*|import\s*\(\s*)(['"])(\.[^'"]*)\2/g;

function moduleKey(specifier: string, files: Record<string, string>): string | undefined {
  const name = specifier.replace(/^\.\//, '').replace(/\.[jt]sx?$/, '');
  return Object.keys(files).find((path) => path.replace(/^\//, '').replace(/\.[jt]sx?$/, '') === name);
}

function linkModules(files: Record<string, string>, created: string[]): Record<string, string> {
  const urls: Record<string, string> = {};
  const remaining = new Set(Object.keys(files));

  while (remaining.size > 0) {
    const ready = [...remaining].filter((path) =>
      [...files[path].matchAll(RELATIVE_SPECIFIER)].every(([, , , specifier]) => {
        const key = moduleKey(specifier, files);
        return !key || key in urls;
      }),
    );
    const batch = ready.length > 0 ? ready : [...remaining];

    for (const path of batch) {
      const linked = files[path].replace(RELATIVE_SPECIFIER, (match, head, quote, specifier: string) => {
        const key = moduleKey(specifier, files);
        return key && urls[key] ? `${head}${quote}${urls[key]}${quote}` : match;
      });
      const url = URL.createObjectURL(new Blob([linked], { type: 'text/javascript' }));
      created.push(url);
      urls[path] = url;
      remaining.delete(path);
    }
  }

  return urls;
}

async function render(files: Record<string, string>, entry: string): Promise<void> {
  const created: string[] = [];
  const urls = linkModules(files, created);

  try {
    beginStyles();
    const module = (await import(/* webpackIgnore: true */ urls[entry])) as Record<string, unknown>;
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
    for (const url of created) URL.revokeObjectURL(url);
  }
}

let renderQueue = Promise.resolve();
let revision = 0;

window.addEventListener('message', (event: MessageEvent<Message>) => {
  if (event.data?.type === 'playground:render') {
    const current = ++revision;
    const { files, entry } = event.data;
    renderQueue = renderQueue.then(() => (current === revision ? render(files, entry) : undefined));
  }
  if (event.data?.type === 'playground:theme') {
    document.documentElement.style.colorScheme = event.data.dark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', event.data.dark);
  }
});

window.parent.postMessage({ type: 'playground:ready' }, '*');
