import { getDefaultContext, instantiateNapiModule, WASI } from '@napi-rs/wasm-runtime';
import { memfs } from '@napi-rs/wasm-runtime/fs';

type StyleRecord = { key: string; hash: string; sheet: string };

export type Compiler = {
  getStyleRecords: (styleRule: Record<string, unknown>, weights?: Record<string, number>) => StyleRecord[];
  themeHashOf: (themeSelector: string, rule: Record<string, unknown>) => string;
  createTheme: (
    themeSelector: string,
    rule: Record<string, unknown>,
    themeHash: string,
  ) => Record<string, Record<string, unknown>>;
  transformSource: (options: {
    source: string;
    moduleId: string;
    filePath: string;
    root: string;
    cwd: string;
    styleProp: string;
    isDev: boolean;
  }) => { code: string };
  compileCSS: (options: {
    include: string[];
    exclude: string[];
    files: string[];
    cwd: string;
    styleProp: string;
  }) => string;
  optimizer: (css: string) => string;
};

export type Output = { jsx: Record<string, string>; css: string };

const ROOT = '/playground';

export async function loadCompiler(threads: number) {
  const { fs } = memfs({ [ROOT]: null });
  const workers: Worker[] = [];
  const memory = new WebAssembly.Memory({ initial: 1024, maximum: 16384, shared: true });
  const wasm = await fetch(new URL('./compiler.wasm32-wasi.wasm', import.meta.url)).then((response) =>
    response.arrayBuffer(),
  );

  const { napiModule } = await instantiateNapiModule(wasm, {
    context: getDefaultContext(),
    asyncWorkPoolSize: 0,
    reuseWorker: threads > 0 ? { size: threads, strict: true } : undefined,
    wasi: new WASI({ version: 'preview1', fs, preopens: { '/': '/' } }),
    onCreateWorker() {
      const worker = new Worker(new URL('./compiler-worker.mjs', import.meta.url), { type: 'module' });
      workers.push(worker);
      return worker;
    },
    overwriteImports(importObject) {
      importObject.env = { ...importObject.env, ...importObject.napi, ...importObject.emnapi, memory };
      return importObject;
    },
    beforeInit({ instance }) {
      for (const name of Object.keys(instance.exports)) {
        if (name.startsWith('__napi_register__')) (instance.exports[name] as () => void)();
      }
    },
  });

  const compiler = napiModule.exports as Compiler;
  let known = '';

  function failure(error: unknown): string {
    return `/* ${error instanceof Error ? error.message : String(error)} */`;
  }

  function compile(sources: Record<string, string>): Output {
    const files = Object.keys(sources).map((path) => ROOT + path);
    for (const [path, source] of Object.entries(sources)) fs.writeFileSync(ROOT + path, source);
    if (files.join() !== known) {
      known = files.join();
      for (const worker of workers) worker.postMessage({ type: 'plumeria:paths', paths: files });
    }

    const jsx: Record<string, string> = {};
    for (const [path, source] of Object.entries(sources)) {
      const file = ROOT + path;
      try {
        jsx[path] = compiler.transformSource({
          source,
          moduleId: file,
          filePath: file,
          root: ROOT,
          cwd: ROOT,
          styleProp: 'classStyle',
          isDev: false,
        }).code;
      } catch (error) {
        jsx[path] = failure(error);
      }
    }

    let css: string;
    try {
      css = compiler.optimizer(
        compiler.compileCSS({ include: [], exclude: [], files, cwd: ROOT, styleProp: 'classStyle' }),
      );
    } catch (error) {
      css = failure(error);
    }

    return { jsx, css };
  }

  return { compiler, compile };
}
