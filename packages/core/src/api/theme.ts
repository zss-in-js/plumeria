import type { CreateTheme, ReturnVariableType } from 'zss-engine';
import { camelToKebabCase } from 'zss-engine';
import { getCurrentlyExecutingFile } from '../checker/state';
import { recordVarDefinition } from '../checker/duplication-checker';
import { global } from './global';

const defineTheme = <const T extends CreateTheme>(object: T) => {
  const styles: Record<string, Record<string, string | number | object>> = {};
  const result = {} as ReturnVariableType<T>;
  const filePath = getCurrentlyExecutingFile();

  Object.entries(object).forEach(([key, value]) => {
    if (filePath) {
      recordVarDefinition(key, filePath);
    }

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

export { defineTheme };
