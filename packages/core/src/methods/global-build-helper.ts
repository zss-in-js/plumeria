import { build, isDevelopment } from 'zss-engine';

let resolvePromise: (value: [string, string]) => void;
let globalPromise: Promise<[string, string]>;
const seetQueue: [string, string?][] = [];
let isProcessing = false;

function initPromise() {
  globalPromise = new Promise<[string, string]>(resolve => {
    resolvePromise = (value: [string, string]) => {
      seetQueue.push(value);
      resolve(value);
    };
  });
}

async function processSheets(filePath: string) {
  while (seetQueue.length > 0) {
    const [styleSheet, option] = seetQueue.shift() as [string, string];
    if (!isDevelopment && styleSheet) build(styleSheet, filePath, option);
  }
  isProcessing = false;
}

export async function buildGlobal(filePath: string): Promise<void> {
  if (typeof globalPromise === 'undefined') initPromise();
  if (!isProcessing && seetQueue.length > 0) {
    isProcessing = true;
    processSheets(filePath);
  }
}

export { resolvePromise, globalPromise, initPromise };
