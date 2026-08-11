module.exports = {
  transform: {
    '^.+\\.ts$': '@swc/jest',
  },
  moduleNameMapper: {
    '^(\\..+)\\.js$': '$1',
  },
  roots: [
    '<rootDir>/scripts/__tests__',
    '<rootDir>/packages/codemod/__tests__',
    '<rootDir>/packages/eslint-plugin/__tests__',
    '<rootDir>/packages/next-plugin/__tests__',
    '<rootDir>/packages/utils/__tests__',
    '<rootDir>/packages/unplugin/__tests__',
    '<rootDir>/packages/turbopack-loader/__tests__',
    '<rootDir>/packages/compiler/__tests__',
  ],
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    [process.env.CI ? 'github-actions' : 'default', { silent: false }],
    'summary',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/packages/codemod/dist/',
    '<rootDir>/packages/compiler/dist/',
    '<rootDir>/packages/eslint-plugin/dist/',
    '<rootDir>/packages/next-plugin/dist/',
    '<rootDir>/packages/utils/dist/',
    // The bundler test itself is excluded from measurement because it runs via utils
    '<rootDir>/packages/unplugin/src/',
    '<rootDir>/packages/turbopack-loader/src/',
    '<rootDir>/packages/compiler/src/',
  ],
};
