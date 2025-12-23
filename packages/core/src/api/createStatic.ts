import type { CreateValues } from 'zss-engine';

const createStatic = <const T extends CreateValues>(rule: T): T => {
  return rule;
};

export { createStatic };
