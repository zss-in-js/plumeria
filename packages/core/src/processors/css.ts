import { build, isDevelopment } from 'zss-engine';

let resolvePromise_1: (value: string) => void;
let globalPromise_1: Promise<string>;
const sheetQueue_1: string[] = [];
let isProcessing_1 = false;

function initPromise_1() {
  globalPromise_1 = new Promise<string>((resolve) => {
    resolvePromise_1 = (value: string) => {
      sheetQueue_1.push(value);
      resolve(value);
    };
  });
}

async function processQueue_1(filePath: string) {
  while (sheetQueue_1.length > 0) {
    const styleSheet = sheetQueue_1.shift();
    if (!isDevelopment && styleSheet) build(styleSheet, filePath);
  }
  isProcessing_1 = false;
}

export async function buildCreate(filePath: string): Promise<void> {
  if (typeof globalPromise_1 === 'undefined') initPromise_1();
  if (!isProcessing_1 && sheetQueue_1.length > 0) {
    isProcessing_1 = true;
    processQueue_1(filePath);
  }
}

export { resolvePromise_1, globalPromise_1, initPromise_1 };

let resolvePromise_2: (value: string) => void;
let globalPromise_2: Promise<string>;
const sheetQueue_2: string[] = [];
let isProcessing_2 = false;

function initPromise_2() {
  globalPromise_2 = new Promise<string>((resolve) => {
    resolvePromise_2 = (value: string) => {
      sheetQueue_2.push(value);
      resolve(value);
    };
  });
}

async function processQueue_2(filePath: string) {
  while (sheetQueue_2.length > 0) {
    const styleSheet = sheetQueue_2.shift();
    if (!isDevelopment && styleSheet) build(styleSheet, filePath, '--global');
  }
  isProcessing_2 = false;
}

export async function buildGlobal(filePath: string): Promise<void> {
  if (typeof globalPromise_2 === 'undefined') initPromise_2();
  if (!isProcessing_2 && sheetQueue_2.length > 0) {
    isProcessing_2 = true;
    processQueue_2(filePath);
  }
}

export { resolvePromise_2, globalPromise_2, initPromise_2 };
