import { build, isDevelopment } from 'zss-engine';

const createProcessor = () => {
  let resolve: (value: string) => void;
  let promise: Promise<string>;
  const queue: string[] = [];
  let processing = false;

  const init = () => {
    promise = new Promise<string>((r) => {
      resolve = (value: string) => {
        queue.push(value);
        r(value);
      };
    });
  };

  const process = async (filePath: string) => {
    while (queue.length > 0) {
      const sheet = queue.shift();
      if (!isDevelopment && sheet) build(sheet, filePath);
    }
    processing = false;
  };

  const buildFiles = async (filePath: string) => {
    if (!promise) init();
    if (!processing && queue.length > 0) {
      processing = true;
      process(filePath);
    }
  };

  return {
    get resolve() {
      return resolve;
    },
    get promise() {
      return promise;
    },
    init,
    build: buildFiles,
  };
};

export const gQueue = createProcessor();
export const pQueue = createProcessor();
