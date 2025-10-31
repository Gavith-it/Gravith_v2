/// <reference types="vitest" />
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup-tests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'build', 'coverage', 'e2e'],
    coverage: {
      enabled: true,
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'dist/',
        'build/',
        'coverage/',
        'e2e/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/mockData.ts',
        '**/utils.ts',
        '**/__tests__/**',
        '**/test/**',
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70,
        },
      },
    },
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
