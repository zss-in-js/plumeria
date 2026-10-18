declare module '@napi-rs/wasm-runtime' {
  type Imports = Record<string, Record<string, unknown>>;

  export class WASI {
    constructor(options: { version: 'preview1'; fs?: unknown; preopens?: Record<string, string> });
  }

  export function getDefaultContext(): unknown;

  export function instantiateNapiModuleSync(
    wasm: ArrayBuffer | WebAssembly.Module,
    options: {
      childThread: true;
      wasi: WASI;
      overwriteImports?: (importObject: Imports) => Imports | void;
    },
  ): unknown;

  export function instantiateNapiModule(
    wasm: ArrayBuffer | WebAssembly.Module,
    options: {
      context?: unknown;
      asyncWorkPoolSize?: number;
      reuseWorker?: { size: number; strict?: boolean };
      wasi: WASI;
      onCreateWorker?: () => Worker;
      overwriteImports?: (importObject: Imports) => Imports | void;
      beforeInit?: (source: { instance: WebAssembly.Instance }) => void;
    },
  ): Promise<{ napiModule: { exports: unknown } }>;

  export class MessageHandler {
    constructor(options: {
      onLoad: (data: { wasmModule: WebAssembly.Module; wasmMemory: WebAssembly.Memory }) => unknown;
    });
    handle(event: MessageEvent): void;
  }
}

declare module '@napi-rs/wasm-runtime/fs' {
  export function memfs(json?: Record<string, string | null>): {
    fs: {
      writeFileSync: (path: string, data: string) => void;
      existsSync: (path: string) => boolean;
    };
  };
}
