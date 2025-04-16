module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^(\\..+)\\.js$': '$1',
  },
  roots: ['<rootDir>/packages/core/__tests__'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!(zss-utils|@plumeria/core)/)'],
  coverageReporters: ['text', 'html'],
  reporters: [['github-actions', { silent: false }], 'summary'],
};
