const noop = () => undefined;

module.exports = new Proxy(
  { __esModule: false },
  {
    get(target, property) {
      if (property === 'default') return module.exports;
      return noop;
    },
  },
);
