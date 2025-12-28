import { camelToKebabCase, CreateTheme } from 'zss-engine';

const createTheme = <const T extends CreateTheme>(rule: T) => {
  const styles: Record<
    string,
    Record<string, string | number | Record<string, string | number>>
  > = {};
  for (const key in rule) {
    const varKey = `--${camelToKebabCase(key)}`;

    const themeMap = rule[key];
    for (const themeKey in themeMap) {
      const value = themeMap[themeKey];

      const isQuery =
        themeKey.startsWith('@media') || themeKey.startsWith('@container');

      const selector =
        isQuery || themeKey === 'default'
          ? ':root'
          : `:root[data-theme="${themeKey}"]`;

      const target = (styles[selector] ||= {});

      if (isQuery) {
        const queryObj = (target[themeKey] ||= {}) as Record<
          string,
          string | number
        >;
        queryObj[varKey] = value;
      } else {
        target[varKey] = value;
      }
    }
  }

  return styles;
};

export { createTheme };
