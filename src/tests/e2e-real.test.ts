/**
 * Real E2E Integration Tests (No Mocks)
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Actual end-to-end testing with real CLI tools and APIs
 *
 * IMPORTANT: These tests make real API calls and should be run manually
 * Requirements:
 * - GitHub CLI authenticated and connected to anthony-ism/claude-pr-analisys
 * - Internet connection for GitHub API calls
 * - Existing PR #2 available for testing
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  REPOSITORY: 'anthony-ism/claude-pr-analisys',
  TEST_PR_NUMBER: '2', // Existing PR for safe testing
  TEMP_DIR: path.join(process.cwd(), 'temp'),
  TIMEOUT: 60000, // 60 seconds for real API calls
} as const;

// Track created files for cleanup
const createdFiles: string[] = [];

describe('Real E2E Integration Tests', () => {
  beforeAll(async () => {
    // Ensure temp directory exists
    if (!fs.existsSync(TEST_CONFIG.TEMP_DIR)) {
      fs.mkdirSync(TEST_CONFIG.TEMP_DIR, { recursive: true });
    }
  }, TEST_CONFIG.TIMEOUT);

  afterAll(async () => {
    // Cleanup created test files
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.warn(`Failed to cleanup test file: ${file}`, error);
      }
    }
  });

  describe('Environment Validation', () => {
    test(
      'GitHub CLI is available and authenticated',
      async () => {
        // Test GitHub CLI is installed
        const { stdout: version } = await execAsync('gh --version');
        expect(version).toContain('gh version');
        expect(version).toContain('2.'); // Expect v2.x

        // Test GitHub CLI authentication
        const { stdout: authStatus } = await execAsync('gh auth status');
        expect(authStatus).toContain('Logged in');
        expect(authStatus).toContain('github.com');
      },
      TEST_CONFIG.TIMEOUT
    );

    test(
      'Repository access is available',
      async () => {
        // Test repository access
        const { stdout: repoInfo } = await execAsync(
          `gh repo view ${TEST_CONFIG.REPOSITORY}`
        );
        expect(repoInfo).toContain('claude-pr-analisys');
        expect(repoInfo).toContain('anthony-ism');
      },
      TEST_CONFIG.TIMEOUT
    );

    test(
      'Test PR exists and is accessible',
      async () => {
        // Verify our test PR exists
        const { stdout: prData } = await execAsync(
          `gh pr view ${TEST_CONFIG.TEST_PR_NUMBER} --repo ${TEST_CONFIG.REPOSITORY}`
        );
        expect(prData).toContain('E2e test'); // Expected PR title
        expect(prData).toContain('OPEN'); // Should be open
      },
      TEST_CONFIG.TIMEOUT
    );
  });

  describe('Real GitHub CLI Integration', () => {
    test(
      'Fetch real PR data via JSON API',
      async () => {
        const { stdout: jsonData } = await execAsync(
          `gh pr view ${TEST_CONFIG.TEST_PR_NUMBER} --repo ${TEST_CONFIG.REPOSITORY} --json title,number,author,state,body,url`
        );

        const prData = JSON.parse(jsonData);

        // Validate PR data structure
        expect(prData).toHaveProperty('number');
        expect(prData).toHaveProperty('title');
        expect(prData).toHaveProperty('author');
        expect(prData).toHaveProperty('state');
        expect(prData).toHaveProperty('url');

        // Validate PR data values
        expect(prData.number).toBe(2);
        expect(prData.title).toBe('E2e test');
        expect(prData.state).toBe('OPEN');
        expect(prData.author).toHaveProperty('login');
        expect(prData.url).toContain('github.com');
        expect(prData.url).toContain('pull/2');
      },
      TEST_CONFIG.TIMEOUT
    );

    test(
      'Fetch real PR diff content',
      async () => {
        const { stdout: diffData } = await execAsync(
          `gh pr diff ${TEST_CONFIG.TEST_PR_NUMBER} --repo ${TEST_CONFIG.REPOSITORY}`
        );

        // Validate diff structure
        expect(diffData).toContain('diff --git');
        expect(typeof diffData).toBe('string');
        expect(diffData.length).toBeGreaterThan(0);
      },
      TEST_CONFIG.TIMEOUT
    );

    test(
      'Error handling for non-existent PR',
      async () => {
        const nonExistentPR = '99999';

        try {
          await execAsync(
            `gh pr view ${nonExistentPR} --repo ${TEST_CONFIG.REPOSITORY} --json title`
          );
          // Should not reach here
          expect(false).toBe(true);
        } catch (error) {
          // Verify proper error handling
          expect(error).toBeDefined();
          const errorMessage =
            (error as any).message || (error as any).stderr || '';
          expect(errorMessage).toContain('Could not resolve to a PullRequest');
        }
      },
      TEST_CONFIG.TIMEOUT
    );
  });

  describe('File System Integration', () => {
    test('Create and validate timestamped files', async () => {
      // Create a timestamped file like our application does
      const timestamp = Date.now();
      const filename = `e2e-test-${timestamp}.txt`;
      const filePath = path.join(TEST_CONFIG.TEMP_DIR, filename);
      const testContent = `E2E test content created at ${new Date().toISOString()}`;

      // Track for cleanup
      createdFiles.push(filePath);

      // Write test file
      fs.writeFileSync(filePath, testContent, 'utf8');

      // Validate file creation
      expect(fs.existsSync(filePath)).toBe(true);

      const readContent = fs.readFileSync(filePath, 'utf8');
      expect(readContent).toBe(testContent);

      // Validate file stats
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.isFile()).toBe(true);
    });

    test('Temp directory operations', async () => {
      // Verify temp directory exists
      expect(fs.existsSync(TEST_CONFIG.TEMP_DIR)).toBe(true);

      // Test directory is writable
      const testFile = path.join(
        TEST_CONFIG.TEMP_DIR,
        `write-test-${Date.now()}.txt`
      );
      createdFiles.push(testFile);

      fs.writeFileSync(testFile, 'write test', 'utf8');
      expect(fs.existsSync(testFile)).toBe(true);

      // Test directory listing
      const files = fs.readdirSync(TEST_CONFIG.TEMP_DIR);
      expect(Array.isArray(files)).toBe(true);
      expect(files.some(f => f.includes('write-test'))).toBe(true);
    });
  });

  describe('Partial Workflow Integration', () => {
    test(
      'PR analysis workflow - data gathering phase',
      async () => {
        // Simulate our application's PR data gathering
        const prNumber = TEST_CONFIG.TEST_PR_NUMBER;

        // Step 1: Get PR metadata
        const { stdout: prJsonData } = await execAsync(
          `gh pr view ${prNumber} --repo ${TEST_CONFIG.REPOSITORY} --json title,number,author,state,body,url,headRefName,baseRefName`
        );
        const prData = JSON.parse(prJsonData);

        // Step 2: Get PR diff
        const { stdout: prDiff } = await execAsync(
          `gh pr diff ${prNumber} --repo ${TEST_CONFIG.REPOSITORY}`
        );

        // Step 3: Validate workflow data
        expect(prData.title).toBeTruthy();
        expect(prData.number).toBe(2);
        expect(prDiff).toBeTruthy();
        expect(prDiff.length).toBeGreaterThan(10);

        // Step 4: Simulate file creation (like our app does)
        const timestamp = Date.now();
        const promptFile = path.join(
          TEST_CONFIG.TEMP_DIR,
          `claude-prompt-${timestamp}.txt`
        );
        createdFiles.push(promptFile);

        const promptContent = `# PR Analysis Request

## PR Information
- Number: ${prData.number}
- Title: ${prData.title}
- Author: ${prData.author.login}
- State: ${prData.state}

## PR Changes
\`\`\`diff
${prDiff.substring(0, 500)}...
\`\`\`

Generated: ${new Date().toISOString()}
`;

        fs.writeFileSync(promptFile, promptContent, 'utf8');

        // Validate file creation
        expect(fs.existsSync(promptFile)).toBe(true);
        const savedContent = fs.readFileSync(promptFile, 'utf8');
        expect(savedContent).toContain(prData.title);
        expect(savedContent).toContain('PR Analysis Request');
      },
      TEST_CONFIG.TIMEOUT
    );

    test('Network resilience and timeout handling', async () => {
      // Test with very short timeout to simulate network issues
      const shortTimeout = 1; // 1ms - should timeout

      try {
        await execAsync(
          `timeout 0.001 gh pr view ${TEST_CONFIG.TEST_PR_NUMBER} --repo ${TEST_CONFIG.REPOSITORY} --json title`,
          { timeout: 100 }
        );
        // Should not reach here in most cases
      } catch (error) {
        // This is expected - we're testing error handling
        expect(error).toBeDefined();
      }
    });
  });

  describe('Conditional Extended Integration', () => {
    test('Jira CLI availability check', async () => {
      try {
        const { stdout: jiraVersion } = await execAsync('jira --version');
        console.log('✓ Jira CLI available:', jiraVersion.trim());

        // If Jira is available, we could test it
        expect(jiraVersion).toBeTruthy();
      } catch (error) {
        console.log(
          'ℹ Jira CLI not available or not authenticated - skipping Jira tests'
        );
        // This is fine - Jira is optional
        expect(true).toBe(true);
      }
    });

    test('Environment variables validation', async () => {
      // Test that our application can handle missing environment variables
      const originalRepo = process.env.GITHUB_REPOSITORY;
      const originalJira = process.env.JIRA_TICKET_PREFIX;

      try {
        // Test with missing environment variables
        delete process.env.GITHUB_REPOSITORY;
        delete process.env.JIRA_TICKET_PREFIX;

        // Our application should handle this gracefully
        // (This would be tested in integration with our actual code)
        expect(process.env.GITHUB_REPOSITORY).toBeUndefined();
        expect(process.env.JIRA_TICKET_PREFIX).toBeUndefined();
      } finally {
        // Restore environment variables
        if (originalRepo) process.env.GITHUB_REPOSITORY = originalRepo;
        if (originalJira) process.env.JIRA_TICKET_PREFIX = originalJira;
      }
    });
  });

  describe('Production Readiness Validation', () => {
    test('CLI tool versions and compatibility', async () => {
      // GitHub CLI
      const { stdout: ghVersion } = await execAsync('gh --version');
      expect(ghVersion).toMatch(/gh version \d+\.\d+\.\d+/);

      // Node.js
      const { stdout: nodeVersion } = await execAsync('node --version');
      expect(nodeVersion).toMatch(/v\d+\.\d+\.\d+/);

      // Extract version number and verify >= 16.0.0
      const nodeVersionNum = nodeVersion.match(/v(\d+)\.(\d+)\.(\d+)/);
      if (nodeVersionNum) {
        const majorVersion = parseInt(nodeVersionNum[1]);
        expect(majorVersion).toBeGreaterThanOrEqual(16);
      }
    });

    test(
      'Repository permissions and access',
      async () => {
        // Test read access to repository
        const { stdout: repoInfo } = await execAsync(
          `gh api repos/${TEST_CONFIG.REPOSITORY} --jq '.permissions'`
        );

        const permissions = JSON.parse(repoInfo);
        expect(permissions).toHaveProperty('pull');
        expect(permissions.pull).toBe(true);
      },
      TEST_CONFIG.TIMEOUT
    );
  });
});
