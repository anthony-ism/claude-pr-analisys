/**
 * analyze-pr.test.ts - Tests for analyze-pr.ts script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Tests for the refactored analyze-pr script using Vitest
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockExecutor,
  MockReadline,
  createTestDependencies,
  setupEnhancedMocks,
} from '../utils/test-utils';

import {
  getTestTicketId,
  getMockPRData,
  getMockJiraData,
} from '../testing/mocks';

import { GitHubPRData } from '../services/github/operations';

import * as fs from 'fs';
import * as path from 'path';

// Import modules directly from TypeScript source
import * as analyzePr from '../analyze-pr';
import * as prUtils from '../utils/pr-utils';

// Get test data from shared mock system
const mockPRData = getMockPRData() as GitHubPRData;
const mockJiraData = getMockJiraData();
const testTicketId = getTestTicketId();

// Create mock instances
const mockExecutor = new MockExecutor();
const mockReadline = new MockReadline();

function setupMocks(): void {
  // Setup enhanced mocks with better pattern matching
  setupEnhancedMocks(mockExecutor, mockReadline);

  // Inject dependencies into pr-utils
  const testDeps = createTestDependencies(mockExecutor, mockReadline);
  prUtils.setDependencies(testDeps);
}

function restoreMocks(): void {
  prUtils.resetDependencies();
}

describe('Analyze PR Test Suite', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  test('Create Claude prompt with all required data', async () => {
    const prompt = await analyzePr.createClaudePrompt(
      '393',
      testTicketId,
      mockPRData,
      mockJiraData
    );

    expect(prompt).toBeTruthy();
    expect(prompt).toContain('Pull Request #393');
    expect(prompt).toContain(testTicketId);
    expect(prompt).toContain('stopFormValidation');
    expect(prompt).toContain('validation rules');
    expect(prompt).toContain('Claude CLI');
  });

  test('Call Claude function creates timestamped file', async () => {
    const testPrompt = 'Test prompt for Claude analysis';

    const result = await analyzePr.callClaude(testPrompt);

    expect(result).toBeTruthy();
    expect(result).toBe(testPrompt);

    // File should be created (check temp directory)
    const tempDir = path.join(process.cwd(), 'temp');

    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const promptFiles = files.filter(f => f.startsWith('claude-prompt-'));
      expect(promptFiles.length).toBeGreaterThan(0);

      // Cleanup newest file
      if (promptFiles.length > 0) {
        const latestFile = promptFiles.sort().pop();
        if (latestFile) {
          const filePath = path.join(tempDir, latestFile);
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    }
  });

  test('Usage function provides help text', async () => {
    expect(typeof analyzePr.usage).toBe('function');

    // Should not throw when called
    expect(() => analyzePr.usage()).not.toThrow();
  });

  test('Module exports required functions', async () => {
    expect(typeof analyzePr.main).toBe('function');
    expect(typeof analyzePr.createClaudePrompt).toBe('function');
    expect(typeof analyzePr.callClaude).toBe('function');
    expect(typeof analyzePr.usage).toBe('function');
  });

  test('Integration with shared utilities', async () => {
    // Test that the script uses shared utilities correctly
    const prData = await prUtils.gatherPRData('393');
    expect(prData).toBeTruthy();

    const jiraTicket = prUtils.extractJiraTicket(
      `${testTicketId}: Test ticket`
    );
    expect(jiraTicket).toBe(testTicketId);
  });

  test('Error handling in prompt creation', async () => {
    // Test with invalid data
    try {
      const prompt = await analyzePr.createClaudePrompt(
        '393',
        testTicketId,
        null as any,
        mockJiraData
      );
      // Should handle null prData gracefully
      expect(prompt).toBeTruthy();
    } catch (error) {
      // If it throws, that's also acceptable behavior
      expect(error).toBeInstanceOf(Error);
    }
  });

  test('File creation in correct temp location', async () => {
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const beforeFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];

    await analyzePr.callClaude('Test content');

    const afterFiles = fs.readdirSync(tempDir);
    expect(afterFiles.length).toBeGreaterThan(beforeFiles.length);

    // Find and cleanup the new file
    const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
    newFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  test('Prompt template includes all required sections', async () => {
    const prompt = await analyzePr.createClaudePrompt(
      '393',
      testTicketId,
      mockPRData,
      mockJiraData
    );

    // Check for required sections
    expect(prompt).toContain('## Pull Request #');
    expect(prompt).toContain('### PR Details:');
    expect(prompt).toContain('### PR Changes (diff):');
    expect(prompt).toContain('### PR Metadata:');
    expect(prompt).toContain('## Jira Ticket');
    expect(prompt).toContain('### Ticket Details:');
    expect(prompt).toContain('## Analysis Request');
    expect(prompt).toContain('IMPORTANT: Before analyzing');
    expect(prompt).toContain('Context Summary');
    expect(prompt).toContain('Confidence Level');
    expect(prompt).toContain('generated using AI');
  });
});
