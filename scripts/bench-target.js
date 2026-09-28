const fs = require('node:fs');
const path = require('node:path');

function loadTarget(target) {
  const native = path.join(target, 'packages/compiler/index.js');
  if (fs.existsSync(native)) {
    const compiler = require(native);
    return {
      implementation: 'compiler',
      scanAll: compiler.scanAll,
      transformSource: compiler.transformSource,
      DEFAULT_STYLE_PROP: compiler.DEFAULT_STYLE_PROP,
      countParses: null,
    };
  }

  const utils = path.join(target, 'packages/utils');
  const swc = require(require.resolve('@swc/core', { paths: [utils] }));
  const countParses = async (fn) => {
    const parseSync = swc.parseSync;
    let seen = 0;
    swc.parseSync = (...args) => {
      seen++;
      return parseSync(...args);
    };
    try {
      await fn();
    } finally {
      swc.parseSync = parseSync;
    }
    return seen;
  };

  return {
    implementation: 'utils',
    scanAll: require(path.join(utils, 'dist/parser.js')).scanAll,
    transformSource: require(path.join(utils, 'dist/transform.js'))
      .transformSource,
    DEFAULT_STYLE_PROP: require(path.join(utils, 'dist/constants.js'))
      .DEFAULT_STYLE_PROP,
    countParses,
  };
}

const IMPLEMENTATIONS = {
  compiler: '`@plumeria/compiler` (Rust)',
  utils: '`@plumeria/utils` (TypeScript)',
};

function describeImplementations(base, head) {
  return base === head
    ? `Both sides run ${IMPLEMENTATIONS[head]}.`
    : `Base runs ${IMPLEMENTATIONS[base]}; PR runs ${IMPLEMENTATIONS[head]}.`;
}

module.exports = { loadTarget, describeImplementations };
