import {
  addImport,
  appendToArray,
  appendToConfigList,
  callsName,
  closerOf,
  directProperty,
  importedFrom,
  importsModule,
  moduleKindOf,
  pluginsArrayOf,
  wrapDefaultExport,
} from '../src/source';

describe('closerOf', () => {
  it('matches the bracket that closes the one it is given', () => {
    const source = 'plugins: [a(), b([1, 2])]';
    expect(closerOf(source, source.indexOf('['))).toBe(source.length - 1);
  });

  it('ignores a bracket inside a string', () => {
    const source = "plugins: [test(']')]";
    expect(closerOf(source, source.indexOf('['))).toBe(source.length - 1);
  });

  it('ignores a bracket inside a comment', () => {
    const source = 'plugins: [\n  // ]\n  a(),\n]';
    expect(closerOf(source, source.indexOf('['))).toBe(source.length - 1);
  });

  it('ignores a bracket inside a template hole', () => {
    const source = 'plugins: [`${[1]}]`]';
    expect(closerOf(source, source.indexOf('['))).toBe(source.length - 1);
  });

  it('reports an unbalanced bracket', () => {
    expect(closerOf('plugins: [a()', 9)).toBe(-1);
  });
});

describe('addImport', () => {
  it('lands after the last import', () => {
    const source =
      "import a from 'a';\nimport b from 'b';\n\nexport default {};\n";
    expect(addImport(source, "import c from 'c';")).toBe(
      "import a from 'a';\nimport b from 'b';\nimport c from 'c';\n\nexport default {};\n",
    );
  });

  it('lands after the last require', () => {
    const source = "const a = require('a');\n\nmodule.exports = {};\n";
    expect(addImport(source, "const b = require('b');")).toBe(
      "const a = require('a');\nconst b = require('b');\n\nmodule.exports = {};\n",
    );
  });

  it('lands on top when nothing is imported', () => {
    expect(addImport('export default {};\n', "import a from 'a';")).toBe(
      "import a from 'a';\nexport default {};\n",
    );
  });
});

describe('appendToArray', () => {
  it('stays on one line when the array is on one line', () => {
    expect(
      appendToArray('{ plugins: [react()] }', 'plugins', 'plumeria.vite()'),
    ).toBe('{ plugins: [react(), plumeria.vite()] }');
  });

  it('keeps the indentation when the array spans lines', () => {
    const source = 'export default {\n  plugins: [\n    react(),\n  ],\n};\n';
    expect(appendToArray(source, 'plugins', 'plumeria.vite()')).toBe(
      'export default {\n  plugins: [\n    react(),\n    plumeria.vite(),\n  ],\n};\n',
    );
  });

  it('fills an empty array', () => {
    expect(appendToArray('{ plugins: [] }', 'plugins', 'plumeria.vite()')).toBe(
      '{ plugins: [plumeria.vite()] }',
    );
  });

  it('reports a missing key', () => {
    expect(
      appendToArray('{ integrations: [] }', 'plugins', 'x()'),
    ).toBeUndefined();
  });
});

describe('wrapDefaultExport', () => {
  it('wraps an identifier', () => {
    expect(
      wrapDefaultExport('export default nextConfig;\n', 'withPlumeria'),
    ).toBe('export default withPlumeria(nextConfig);\n');
  });

  it('wraps an object literal', () => {
    const source = 'export default {\n  reactStrictMode: true,\n};\n';
    expect(wrapDefaultExport(source, 'withPlumeria')).toBe(
      'export default withPlumeria({\n  reactStrictMode: true,\n});\n',
    );
  });

  it('wraps a module.exports assignment', () => {
    expect(
      wrapDefaultExport('module.exports = config;\n', 'withPlumeria'),
    ).toBe('module.exports = withPlumeria(config);\n');
  });

  it('carries a second argument', () => {
    expect(
      wrapDefaultExport(
        'export default nextConfig;\n',
        'withPlumeria',
        ', { styleProp: 1 }',
      ),
    ).toBe('export default withPlumeria(nextConfig, { styleProp: 1 });\n');
  });

  it('leaves an already wrapped export alone', () => {
    const source = 'export default withPlumeria(nextConfig);\n';
    expect(wrapDefaultExport(source, 'withPlumeria')).toBe(source);
  });

  it('reports a file with no default export', () => {
    expect(wrapDefaultExport('const a = 1;\n', 'withPlumeria')).toBeUndefined();
  });
});

describe('appendToConfigList', () => {
  it('extends a defineConfig call', () => {
    const source =
      'export default defineConfig(\n  eslint.configs.recommended,\n);\n';
    expect(appendToConfigList(source, ['plumeria.configs.recommended'])).toBe(
      'export default defineConfig(\n  eslint.configs.recommended,\n  plumeria.configs.recommended,\n);\n',
    );
  });

  it('extends an exported array', () => {
    expect(
      appendToConfigList('export default [\n  base,\n];\n', ['extra']),
    ).toBe('export default [\n  base,\n  extra,\n];\n');
  });

  it('indents every line of a multi-line entry', () => {
    const source = 'export default defineConfig(\n  base,\n);\n';
    expect(appendToConfigList(source, ['{\n  rules: {},\n}'])).toBe(
      'export default defineConfig(\n  base,\n  {\n    rules: {},\n  },\n);\n',
    );
  });
});

describe('importsModule', () => {
  it('sees an import and a require of the same specifier', () => {
    expect(
      importsModule(
        "import p from '@plumeria/unplugin';",
        '@plumeria/unplugin',
      ),
    ).toBe(true);
    expect(
      importsModule("require('@plumeria/unplugin')", '@plumeria/unplugin'),
    ).toBe(true);
    expect(
      importsModule("import p from '@plumeria/core';", '@plumeria/unplugin'),
    ).toBe(false);
  });
});

describe('moduleKindOf', () => {
  it('reads the extension first', () => {
    expect(moduleKindOf('a.cjs', 'import a from "a";')).toBe('cjs');
    expect(moduleKindOf('a.mts', "const a = require('a');")).toBe('esm');
  });

  it('reads the source when the extension says nothing', () => {
    expect(
      moduleKindOf('a.js', "const a = require('a');\nmodule.exports = {};"),
    ).toBe('cjs');
    expect(moduleKindOf('a.js', "import a from 'a';")).toBe('esm');
    expect(moduleKindOf('a.js', 'const a = 1;')).toBe('esm');
  });
});

describe('pluginsArrayOf', () => {
  const at = (source: string): string | undefined => {
    const found = pluginsArrayOf(source);
    if (found === undefined) return undefined;
    return source.slice(found, source.indexOf(']', found) + 1);
  };

  it('takes the array the config owns, not one a nested key owns', () => {
    const source = `export default defineConfig({
  test: {
    plugins: [],
  },
  plugins: [react()],
});
`;
    expect(at(source)).toBe('[react()]');
  });

  it('takes nothing when only a nested key has one', () => {
    const source = `export default defineConfig({
  test: {
    plugins: [],
  },
});
`;
    expect(pluginsArrayOf(source)).toBeUndefined();
  });

  it('reads through an object the config exports directly', () => {
    const source = `export default {
  module: { rules: [{ test: /\\.css$/ }] },
  plugins: [new HtmlWebpackPlugin()],
};
`;
    expect(at(source)).toBe('[new HtmlWebpackPlugin()]');
  });

  it('reads through module.exports', () => {
    const source = `module.exports = {\n  plugins: [one()],\n};\n`;
    expect(at(source)).toBe('[one()]');
  });

  it('reads the vite block of an Astro config', () => {
    const source = `export default defineConfig({
  vite: {
    plugins: [],
  },
  integrations: [react()],
});
`;
    expect(at(source)).toBe('[]');
  });

  it('reads the object a build script passes to a call', () => {
    const source = `await Bun.build({\n  outdir: './dist',\n  plugins: [],\n});\n`;
    expect(at(source)).toBe('[]');
  });
});

describe('directProperty', () => {
  const source = `{
  a: 1,
  nested: { b: 2 },
  list: [{ b: 3 }],
  b: 4,
}`;

  it('finds a key the object owns', () => {
    expect(source.slice(directProperty(source, 0, 'b'))).toMatch(/^4/);
  });

  it('does not find a key only a nested value owns', () => {
    expect(directProperty(source, 0, 'c')).toBeUndefined();
  });

  it('does not mistake a key that ends with the name', () => {
    expect(directProperty('{ myPlugins: [] }', 0, 'plugins')).toBeUndefined();
  });
});

describe('importedFrom', () => {
  it('names a default import and drops its line from the rest', () => {
    const source = `import plumeria from '@plumeria/unplugin';\n\nplugins: [plumeria.vite()];\n`;
    const { names, rest } = importedFrom(source, '@plumeria/unplugin');
    expect(names).toEqual(['plumeria']);
    expect(rest).not.toContain('import');
    expect(callsName(rest, 'plumeria')).toBe(true);
  });

  it('names a renamed binding', () => {
    const { names } = importedFrom(
      `import { withPlumeria as wrap } from '@plumeria/next-plugin';`,
      '@plumeria/next-plugin',
    );
    expect(names).toEqual(['wrap']);
  });

  it('names a require binding', () => {
    const { names } = importedFrom(
      `const plumeria = require('@plumeria/unplugin').default;`,
      '@plumeria/unplugin',
    );
    expect(names).toEqual(['plumeria']);
  });

  it('reports an import nothing calls', () => {
    const source = `import plumeria from '@plumeria/unplugin';\n\nexport default { plugins: [react()] };\n`;
    const { names, rest } = importedFrom(source, '@plumeria/unplugin');
    expect(names).toEqual(['plumeria']);
    expect(callsName(rest, 'plumeria')).toBe(false);
  });

  it('finds nothing when the module is absent', () => {
    const { names } = importedFrom(
      `import react from 'react';`,
      '@plumeria/unplugin',
    );
    expect(names).toEqual([]);
  });
});
