module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests/js'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        declaration: true,
        outDir: './lib',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        isolatedModules: true,
      },
    }],
  },
  moduleNameMapper: {
    '^./css/base\\.css$': '<rootDir>/src/utils/css/base.css.ts',
    '^./css/theme\\.css$': '<rootDir>/src/utils/css/theme.css.ts',
    '^./js/navigation\\.js$': '<rootDir>/src/utils/js/navigation.js.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/utils/metadata.ts',
    'src/utils/slideMapper.ts',
    'src/utils/htmlBuilder.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
