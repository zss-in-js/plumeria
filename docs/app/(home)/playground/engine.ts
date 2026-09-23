import type { Engine } from './engine-types';

const BASE = '/playground';

export type LoadedEngine = { engine: Engine; libs: Record<string, string> };

type Listener = (progress: number) => void;

const listeners = new Set<Listener>();
const received = new Map<string, number>();
let sizes: Record<string, number> | undefined;
let progress = 0;
let pending: Promise<LoadedEngine> | undefined;

function report() {
  if (!sizes) return;
  let total = 0;
  let done = 0;
  for (const [name, size] of Object.entries(sizes)) {
    total += size;
    done += Math.min(received.get(name) ?? 0, size);
  }
  progress = total > 0 ? done / total : 0;
  for (const listener of listeners) listener(progress);
}

async function download(name: string): Promise<Blob> {
  const response = await fetch(`${BASE}/${name}`, { cache: 'no-cache' });
  if (!response.ok || !response.body) throw new Error(`playground: failed to load ${name}`);

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  const reader = response.body.getReader();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    bytes += value.byteLength;
    received.set(name, bytes);
    report();
  }

  return new Blob(chunks);
}

async function load(): Promise<LoadedEngine> {
  received.clear();
  void fetch(`${BASE}/manifest.json`, { cache: 'no-cache' })
    .then((response) => (response.ok ? (response.json() as Promise<Record<string, number>>) : undefined))
    .then((value) => {
      sizes = value;
      report();
    })
    .catch(() => {});

  const [engineSource, libsSource] = await Promise.all([download('engine.mjs'), download('libs.json')]);

  const url = URL.createObjectURL(new Blob([engineSource], { type: 'text/javascript' }));
  try {
    const engine = (await import(/* turbopackIgnore: true */ url)) as Engine;
    const libs = JSON.parse(await libsSource.text()) as Record<string, string>;
    return { engine, libs };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function loadEngine(): Promise<LoadedEngine> {
  pending ??= load().catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

export function onEngineProgress(listener: Listener): () => void {
  listeners.add(listener);
  listener(progress);
  return () => {
    listeners.delete(listener);
  };
}
