module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  roots: ['<rootDir>/packages/core/__tests__'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['text', 'html'],
  reporters: [['github-actions', { silent: false }], 'summary'],
};
