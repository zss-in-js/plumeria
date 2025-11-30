import type { RxVariableSet } from 'zss-engine';

const x = (className: string, varSet: RxVariableSet) => ({
  className,
  style: Object.fromEntries(
    Object.entries(varSet).map(([key, value]) => [key, value]),
  ),
});

export { x };
