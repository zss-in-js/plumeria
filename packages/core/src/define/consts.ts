import type { CreateValues } from 'zss-engine';

const defineConsts = <const T extends CreateValues>(constants: T) => {
  return constants;
};

export { defineConsts };
