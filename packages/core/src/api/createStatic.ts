import type { CreateValues } from 'zss-engine';

const createStatic = <const T extends CreateValues>(object: T): T => {
  return object;
};

export { createStatic };
