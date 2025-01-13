module.exports = {
  transform: {
    '^.+\\.ts?$': '@swc/jest',
  },
  roots: ['<rootDir>/packages/core/__test__'],
  testEnvironment: 'jsdom',
  coverageReporters: ['text', 'html'],
  reporters: [['github-actions', { silent: false }], 'summary'],
};
