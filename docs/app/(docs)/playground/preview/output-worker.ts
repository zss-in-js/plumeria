import { loadCompiler } from './runtime';

const loaded = loadCompiler(4);

globalThis.onmessage = async (event: MessageEvent<{ sources: Record<string, string> }>) => {
  const { sources } = event.data;
  try {
    const { compile } = await loaded;
    postMessage(compile(sources));
  } catch (error) {
    const message = `/* ${error instanceof Error ? error.message : String(error)} */`;
    postMessage({ jsx: Object.fromEntries(Object.keys(sources).map((path) => [path, message])), css: message });
  }
};
