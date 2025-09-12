module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\..+)\\.js$': '$1',
  },
  roots: [
    '<rootDir>/packages/core/__tests__',
    '<rootDir>/packages/eslint-plugin/__tests__',
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['text', 'html'],
  reporters: [['github-actions', { silent: false }], 'summary'],
};
