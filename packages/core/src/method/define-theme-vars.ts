import { global } from './global.js';
import type { VarsDefinition, VarsTransformed } from 'zss-engine';

export const defineThemeVars = <const T extends VarsDefinition>(object: T) => {
  const globalStyles: Record<
    string,
    Record<string, string | number | object>
  > = {};

  const result = {} as {
    [K in keyof T]: `var(--${string & K})`;
  };

  Object.entries(object).forEach(([key, value]) => {
    result[key as keyof T] = `var(--${key})`;

    if (typeof value === 'string') {
      (globalStyles[':root'] ||= {})[`--${key}`] = value;
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (subKey.startsWith('@media')) {
          (globalStyles[':root'] ||= {})[subKey] ||= {};
          (globalStyles[':root'][subKey] as Record<string, string | number>)[
            `--${key}`
          ] = subValue;
        } else {
          const themeSelector =
            subKey === 'default' ? ':root' : `:root[data-theme="${subKey}"]`;
          (globalStyles[themeSelector] ||= {})[`--${key}`] = subValue;
        }
      });
    }
  });

  global(globalStyles as VarsTransformed);

  return result;
};
