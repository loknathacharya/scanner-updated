module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    'axios': 'axios/dist/node/axios.cjs'
  },
  transform: {
    '^.+\\.(js|jsx|ts,tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/BacktestControls.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/BacktestResults.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'clover'
  ],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/'
  ],
  testTimeout: 30000,
  maxWorkers: '50%',
  verbose: true,
  testURL: 'http://localhost:3000',
  moduleDirectories: ['node_modules', 'src'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results' }]
  ],
  testResultsProcessor: 'jest-junit',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      babelConfig: '.babelrc'
    }
  },
  transformIgnorePatterns: [
    'node_modules/(?!react-native|@react-native|@react-navigation|@unimodules)'
  ]
};