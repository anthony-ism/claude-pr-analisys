import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test file patterns - temporarily only run simple test
    include: [
      'src/tests/simple-analyze-pr.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'temp'
    ],

    // Environment setup
    env: {
      JIRA_TICKET_PREFIX: 'TEST',
      GITHUB_REPOSITORY: 'test-org/test-repo',
    },

    // Global setup and teardown
    globalSetup: './src/testing/vitest-setup.ts',

    // Test environment
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.js',
        'src/testing/**',
        'src/**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },

    // Reporter configuration
    reporter: ['verbose'],

    // Timeout configuration
    testTimeout: 10000,
    
    // Allow tests to run in sequence to avoid conflicts
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@testing': path.resolve(__dirname, './src/testing'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },

  // Define configuration for Node.js to handle mixed module types
  define: {
    global: 'globalThis',
  },

  // Optimize deps to handle CommonJS modules
  optimizeDeps: {
    include: []
  }
});