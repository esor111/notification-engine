import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: 'test/contracts/.*\\.contract\\.spec\\.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
