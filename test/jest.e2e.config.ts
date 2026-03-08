import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironment: 'node',
  testTimeout: 15000,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: 'test/e2e/.*\\.e2e-spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
