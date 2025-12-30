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
    '<rootDir>/packages/next-plugin/__tests__',
    '<rootDir>/packages/utils/__tests__',
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    [process.env.CI ? 'github-actions' : 'default', { silent: false }],
    'summary',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/packages/core/dist/',
    '<rootDir>/packages/eslint-plugin/dist/',
    '<rootDir>/packages/next-plugin/dist/',
    '<rootDir>/packages/utils/dist/',
  ],
};
