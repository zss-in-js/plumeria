import type { CreateValues } from 'zss-engine';

const defineConsts = <const T extends CreateValues>(constants: T): T => {
  return constants;
};

export { defineConsts };
