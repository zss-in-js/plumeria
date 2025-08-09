import type { RxVariableSet } from 'zss-engine';

const rx = (className: string, varSet: RxVariableSet) => ({
  className,
  style: Object.fromEntries(
    Object.entries(varSet).map(([key, value]) => [key, value]),
  ),
});

export { rx };
