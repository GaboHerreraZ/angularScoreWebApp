import type { Config } from 'jest';

const config: Config = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/e2e/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};

export default config;
