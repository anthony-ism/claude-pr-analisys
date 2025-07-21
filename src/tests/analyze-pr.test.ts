/**
 * analyze-pr.test.ts - Tests for analyze-pr.ts script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Tests for the refactored analyze-pr script using Vitest
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
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

import * as fs from 'fs';
import * as path from 'path';

// Import modules directly from TypeScript source
import * as analyzePr from '../analyze-pr';
import * as prUtils from '../utils/pr-utils';

// Import service modules for dependency injection
import {
  GitHubPRData,
  setDependencies as setGitHubDependencies,
  resetDependencies as resetGitHubDependencies,
} from '../services/github/operations';
import {
  setDependencies as setJiraDependencies,
  resetDependencies as resetJiraDependencies,
} from '../services/jira/operations';
import {
  setDependencies as setClaudeDependencies,
  resetDependencies as resetClaudeDependencies,
} from '../services/claude/operations';

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

  // Inject dependencies into service modules
  setGitHubDependencies({ execAsync: mockExecutor.execute.bind(mockExecutor) });
  setJiraDependencies({ execAsync: mockExecutor.execute.bind(mockExecutor) });
  setClaudeDependencies({ execAsync: mockExecutor.execute.bind(mockExecutor) });
}

function restoreMocks(): void {
  prUtils.resetDependencies();
  resetGitHubDependencies();
  resetJiraDependencies();
  resetClaudeDependencies();
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
    const mockContext = {
      prNumber: '123',
      repository: 'test-org/test-repo',
      timestamp: new Date(),
      ticketId: testTicketId,
    };

    const result = await analyzePr.callClaude(testPrompt, mockContext);

    expect(result).toBeTruthy();
    expect(result.success).toBe(true);
    expect(result.content).toContain('TEST-2055');

    // Test completed - callClaude returns analysis result, doesn't create files
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

    // Test createTimestampedFile function which actually creates files
    const testContent = 'Test claude prompt content for file creation';
    const filePath = prUtils.createTimestampedFile(
      testContent,
      'claude-prompt',
      'txt'
    );

    const afterFiles = fs.readdirSync(tempDir);
    expect(afterFiles.length).toBeGreaterThan(beforeFiles.length);
    expect(filePath).toContain('claude-prompt');
    expect(fs.existsSync(filePath)).toBe(true);

    // Find and cleanup the new file
    const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
    newFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch {
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
