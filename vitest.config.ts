import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/api/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',     // Test files
        'src/**/*.native.tsx',  // RN components require real environment
        'src/**/*.remote.tsx',  // DSL definitions, no need to test
        'src/**/index.ts',      // Pure export files
        'src/**/index.*.ts',
        'src/types/**',         // Type definitions
        'src/core/**',          // Core module depends on RN, needs integration tests
      ],
      thresholds: {
        statements: 98,
        branches: 95,
        functions: 100,
        lines: 100,
      },
    },
  },
});
