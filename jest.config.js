module.exports = {
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^(\\..+)\\.js$': '$1',
  },
  roots: [
    '<rootDir>/packages/eslint-plugin/__tests__',
    '<rootDir>/packages/next-plugin/__tests__',
    '<rootDir>/packages/utils/__tests__',
    '<rootDir>/packages/unplugin/__tests__',
    '<rootDir>/packages/turbopack-loader/__tests__',
    '<rootDir>/packages/compiler/__tests__',
  ],
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    [process.env.CI ? 'github-actions' : 'default', { silent: false }],
    'summary',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/packages/eslint-plugin/dist/',
    '<rootDir>/packages/next-plugin/dist/',
    '<rootDir>/packages/utils/dist/',
    // The bundler test itself is excluded from measurement because it runs via utils
    '<rootDir>/packages/unplugin/src/',
    '<rootDir>/packages/turbopack-loader/src/',
    '<rootDir>/packages/compiler/src/',
  ],
};
