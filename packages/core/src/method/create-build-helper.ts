import { build, isDevelopment } from 'zss-engine';

let resolvePromise: (value: string) => void;
let globalPromise: Promise<string>;
const sheetQueue: string[] = [];
let isProcessing = false;

function initPromise() {
  globalPromise = new Promise<string>((resolve) => {
    resolvePromise = (value: string) => {
      sheetQueue.push(value);
      resolve(value);
    };
  });
}

async function processQueue() {
  const path = await import('path');
  const filePath = path.join(__dirname, '../../../stylesheet/core.css');

  while (sheetQueue.length > 0) {
    const styleSheet = sheetQueue.shift();
    if (!isDevelopment && styleSheet) build(styleSheet, filePath);
  }
  isProcessing = false;
}

export async function buildCreate(): Promise<void> {
  if (typeof globalPromise === 'undefined') initPromise();
  if (!isProcessing && sheetQueue.length > 0) {
    isProcessing = true;
    processQueue();
  }
}

export { resolvePromise, globalPromise, initPromise };
