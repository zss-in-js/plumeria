import { instantiateNapiModuleSync, MessageHandler, WASI } from '@napi-rs/wasm-runtime';
import { memfs } from '@napi-rs/wasm-runtime/fs';

const { fs } = memfs({ '/playground': null });

const handler = new MessageHandler({
  onLoad({ wasmModule, wasmMemory }) {
    return instantiateNapiModuleSync(wasmModule, {
      childThread: true,
      wasi: new WASI({ version: 'preview1', fs, preopens: { '/': '/' } }),
      overwriteImports(importObject) {
        importObject.env = { ...importObject.env, ...importObject.napi, ...importObject.emnapi, memory: wasmMemory };
      },
    });
  },
});

globalThis.onmessage = (event: MessageEvent<{ type?: string; paths?: string[] }>) => {
  if (event.data?.type === 'plumeria:paths') {
    for (const path of event.data.paths ?? []) {
      if (!fs.existsSync(path)) fs.writeFileSync(path, '');
    }
    return;
  }
  handler.handle(event);
};
