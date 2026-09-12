import {
  addImport,
  appendToArray,
  appendToConfigList,
  closerOf,
  importsModule,
  moduleKindOf,
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
