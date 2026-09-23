import type { Engine } from './engine-types';

const ENGINE_URL = '/playground/engine.mjs?v=3';

let pending: Promise<Engine> | undefined;

export function loadEngine(): Promise<Engine> {
  pending ??= import(/* turbopackIgnore: true */ ENGINE_URL) as Promise<Engine>;
  return pending;
}
