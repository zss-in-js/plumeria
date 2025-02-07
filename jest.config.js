module.exports = {
  transform: {
    '^.+\\.ts?$': '@swc/jest',
  },
  roots: ['<rootDir>/packages/core/__tests__'],
  testEnvironment: 'jsdom',
  coverageReporters: ['text', 'html'],
  reporters: [['github-actions', { silent: false }], 'summary'],
};
