import type { CreateTokens, ReturnVariableType } from 'zss-engine';
import { camelToKebabCase } from 'zss-engine';
import { global } from './global';

const defineTokens = <const T extends CreateTokens>(object: T) => {
  const styles: Record<string, Record<string, string | number | object>> = {};
  const result = {} as ReturnVariableType<T>;

  Object.entries(object).forEach(([key, value]) => {
    const kebabKey = camelToKebabCase(key);
    (result as any)[key] = `var(--${kebabKey})`;

    Object.entries(value).forEach(([subKey, subValue]) => {
      if (subKey.startsWith('@media')) {
        styles[':root'] ||= {};
        styles[':root'][subKey] ||= {};
        (styles[':root'][subKey] as Record<string, string | number>)[
          `--${key}`
        ] = subValue;
      } else {
        const themeSelector =
          subKey === 'default' ? ':root' : `:root[data-theme="${subKey}"]`;
        styles[themeSelector] ||= {};
        styles[themeSelector][`--${key}`] = subValue;
      }
    });
  });

  global(styles);
  return result;
};

export { defineTokens };
