import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing in a Node.js environment
    environment: 'jsdom',
    // Enable global test functions (describe, it, expect, etc.)
    globals: true,
    // Setup files to run before tests
    setupFiles: ['./test/setup.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
    // Include patterns for test files
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
    ],
  },
  resolve: {
    alias: {
      // Configure path alias @/ to point to project root
      '@': path.resolve(__dirname, './'),
    },
  },
});
