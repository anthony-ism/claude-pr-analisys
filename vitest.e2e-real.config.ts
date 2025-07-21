import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test file patterns - only real E2E tests
    include: [
      'src/tests/e2e-real.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist'
    ],

    // Environment setup - use real environment variables if available
    env: {
      GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || 'anthony-ism/claude-pr-analisys',
      JIRA_TICKET_PREFIX: process.env.JIRA_TICKET_PREFIX || 'TEST',
    },

    // Test environment
    environment: 'node',

    // Reporter configuration
    reporter: ['verbose'],

    // Timeout configuration - long timeouts for real API calls
    testTimeout: 60000, // 60 seconds
    
    // Allow tests to run in sequence to avoid API rate limits
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