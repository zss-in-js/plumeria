import type { XVariableSet, ReturnX } from 'zss-engine';

const x = (className: string, varSet: XVariableSet): ReturnX => ({
  className,
  style: Object.fromEntries(
    Object.entries(varSet).map(([key, value]) => [key, value]),
  ),
});

export { x };
