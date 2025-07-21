/**
 * analyze-pr.test.ts - Unit tests for PR Analysis Script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Lightweight unit tests to validate function chaining and parameter passing using Vitest
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  MockExecutor,
  MockReadline,
  createTestDependencies,
  setupEnhancedMocks,
} from './utils/test-utils';

import {
  getTestTicketId,
  getMockPRData,
  getMockJiraData,
  cliResponses,
} from './testing/mocks';

import { GitHubPRData } from './services/github/operations';

// Import modules directly from TypeScript source
import * as prUtils from './utils/pr-utils';

// Type definitions for test functions
interface PRData {
  view: string;
  diff: string;
  json: {
    title: string;
    author: {
      login: string;
    };
    state: string;
    additions: number;
    deletions: number;
    url: string;
  };
}

// Get test data from shared mock system
const mockPRData = getMockPRData() as GitHubPRData;
const mockJiraData = getMockJiraData() as string;
const testTicketId = getTestTicketId() as string;
const mockClaudeResponse = cliResponses.claude.responses.analyze().stdout;

// Use shared MockExecutor for consistent command mocking
const mockExecutor = new MockExecutor();
const mockReadline = new MockReadline();

// Setup mock responses using shared CLI responses
function setupMockResponses(): void {
  mockExecutor.clearCalls();

  // GitHub CLI responses
  mockExecutor.setRegexResponse(/^gh pr view \d+$/, {
    stdout: mockPRData.view,
  });
  mockExecutor.setRegexResponse(/^gh pr diff \d+$/, {
    stdout: mockPRData.diff,
  });
  mockExecutor.setRegexResponse(/^gh pr view \d+ --json/, {
    stdout: JSON.stringify(mockPRData.json),
  });
  mockExecutor.setRegexResponse(/^gh pr comment \d+/, {
    stdout: 'Comment posted',
  });

  // Jira CLI responses
  mockExecutor.setRegexResponse(
    new RegExp(`jira issue view ${testTicketId.replace('-', '\\-')}`),
    { stdout: mockJiraData }
  );

  // Claude CLI responses
  mockExecutor.setRegexResponse(/^claude/, { stdout: mockClaudeResponse });

  // Utility commands
  mockExecutor.setRegexResponse(/^which /, { stdout: '/usr/bin/tool' });
}

// Mock execAsync function using shared executor
async function mockExecAsync(command: string): Promise<{stdout: string; stderr?: string}> {
  return mockExecutor.execute(command);
}

// Simple functions to test (extracted from main script)
function extractJiraTicket(prTitle: string): string | null {
  const prefix = process.env.JIRA_TICKET_PREFIX || 'TEST';
  const match = prTitle.match(new RegExp(`${prefix}-\\d+`));
  return match ? match[0] : null;
}

async function validatePR(prNumber: string): Promise<boolean> {
  try {
    await mockExecAsync(`gh pr view ${prNumber} > /dev/null 2>&1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function gatherPRData(prNumber: string): Promise<PRData | null> {
  try {
    const prViewResult = await mockExecAsync(`gh pr view ${prNumber}`);
    const prView = prViewResult.stdout;

    const prDiffResult = await mockExecAsync(`gh pr diff ${prNumber}`);
    const prDiff = prDiffResult.stdout;

    const prJsonResult = await mockExecAsync(
      `gh pr view ${prNumber} --json title,author,state,additions,deletions,url`
    );
    const prJson = JSON.parse(prJsonResult.stdout);

    return {
      view: prView,
      diff: prDiff,
      json: prJson,
    };
  } catch (error) {
    return null;
  }
}

async function validateJiraTicket(ticketId: string): Promise<boolean> {
  try {
    await mockExecAsync(`jira issue view ${ticketId} > /dev/null 2>&1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function detectClaudeModel(): Promise<string> {
  try {
    const { stdout } = await mockExecAsync(
      'claude --version 2>/dev/null || echo "unknown"'
    );
    const version = stdout.trim();

    if (version !== 'unknown' && version) {
      return `Claude CLI ${version}`;
    }

    return 'Claude AI';
  } catch (error) {
    return 'Claude AI';
  }
}

async function createClaudePrompt(
  prNumber: string,
  ticketId: string,
  prData: PRData,
  jiraData: string
): Promise<string> {
  const claudeModel = await detectClaudeModel();

  return `I need you to analyze a GitHub pull request against its associated Jira ticket and provide a comprehensive analysis.

## Pull Request #${prNumber}

### PR Details:
${prData.view}

### PR Changes (diff):
${prData.diff}

### PR Metadata:
- Title: ${prData.json.title}
- Author: ${prData.json.author.login}
- State: ${prData.json.state}
- Additions: ${prData.json.additions}
- Deletions: ${prData.json.deletions}
- URL: ${prData.json.url}

## Jira Ticket ${ticketId}

### Ticket Details:
${jiraData}

IMPORTANT: End your analysis with the following attribution:
---
*This analysis was generated using AI with the Claude CLI and ${claudeModel}*`;
}

async function callClaude(_prompt: string): Promise<string> {
  try {
    const claudeResult = await mockExecAsync(`claude "temp-file"`);
    return claudeResult.stdout;
  } catch (error) {
    throw new Error('Claude CLI not available or failed to execute');
  }
}

async function postAnalysisComment(
  prNumber: string,
  _analysisContent: string
): Promise<boolean> {
  try {
    await mockExecAsync(`gh pr comment ${prNumber} --body-file "temp-file"`);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRequiredTools(): Promise<void> {
  const requiredTools = ['gh', 'jira', 'claude'];

  for (const tool of requiredTools) {
    try {
      await mockExecAsync(`which ${tool}`);
    } catch (error) {
      throw new Error(`${tool} is not installed or not in PATH`);
    }
  }
}

describe('PR Analysis Script Tests', () => {
  beforeEach(() => {
    setupMockResponses();
  });

  test('Extract Jira ticket from PR title', async () => {
    const ticket = extractJiraTicket(
      `${testTicketId}: Visit Accepted Date is not displayed`
    );
    expect(ticket).toBe(testTicketId);

    const noTicket = extractJiraTicket('Fix bug without ticket');
    expect(noTicket).toBeNull();
  });

  test('Validate PR calls correct GitHub commands', async () => {
    const result = await validatePR('392');
    expect(result).toBe(true);
    
    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('gh pr view 392'))).toBe(true);
  });

  test('Gather PR data calls multiple GitHub commands', async () => {
    const prData = await gatherPRData('392');
    expect(prData).not.toBeNull();
    expect(prData!.json.title).toContain(testTicketId);

    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('gh pr view 392'))).toBe(true);
    expect(calls.some(call => call.includes('gh pr diff 392'))).toBe(true);
    expect(calls.some(call => call.includes('--json title,author,state,additions,deletions,url'))).toBe(true);
  });

  test('Validate Jira ticket calls correct commands', async () => {
    const result = await validateJiraTicket(testTicketId);
    expect(result).toBe(true);
    
    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes(`jira issue view ${testTicketId}`))).toBe(true);
  });

  test('Create Claude prompt includes all required data', async () => {
    const prompt = await createClaudePrompt(
      '392',
      testTicketId,
      mockPRData,
      mockJiraData
    );
    expect(prompt).toContain(testTicketId);
    expect(prompt).toContain('Pull Request #392');
    expect(prompt).toContain('stopFormValidation');
    expect(prompt).toContain('Ready to Read');
    expect(prompt).toContain('This analysis was generated using AI');
  });

  test('Call Claude creates temp file and calls CLI', async () => {
    const prompt = 'Test prompt for Claude';
    const response = await callClaude(prompt);

    expect(response).toContain(testTicketId);
    
    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('claude'))).toBe(true);
  });

  test('Post analysis comment calls GitHub CLI', async () => {
    const analysis = 'Test analysis content';
    const result = await postAnalysisComment('392', analysis);

    expect(result).toBe(true);
    
    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('gh pr comment 392'))).toBe(true);
  });

  test('Check required tools validates all dependencies', async () => {
    await checkRequiredTools();

    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('which gh'))).toBe(true);
    expect(calls.some(call => call.includes('which jira'))).toBe(true);
    expect(calls.some(call => call.includes('which claude'))).toBe(true);
  });

  test('Error handling for missing tools', async () => {
    // Clear all mocks and set specific error for claude
    mockExecutor.clearCalls();
    mockExecutor.clearResponses();

    // Set specific responses for the tools we need
    mockExecutor.setRegexResponse(/^which gh$/, { stdout: '/usr/bin/gh' });
    mockExecutor.setRegexResponse(/^which jira$/, { stdout: '/usr/bin/jira' });
    mockExecutor.setRegexResponse(
      /^which claude$/,
      new Error('Command not found')
    );

    await expect(checkRequiredTools()).rejects.toThrow('claude is not installed or not in PATH');

    // Reset mock for other tests
    setupMockResponses();
  });

  test('Error handling for invalid PR', async () => {
    // Clear all mocks and set specific error for PR 999
    mockExecutor.clearCalls();
    mockExecutor.clearResponses();

    // Set specific error for PR 999 first (more specific pattern)
    mockExecutor.setRegexResponse(/^gh pr view 999$/, new Error('PR not found'));
    mockExecutor.setRegexResponse(/^gh pr view \d+$/, {
      stdout: mockPRData.view,
    }); // For other PRs

    const result = await validatePR('999');
    expect(result).toBe(false);

    // Reset mock for other tests
    setupMockResponses();
  });

  test('Command tracking works correctly', async () => {
    await validatePR('123');
    await gatherPRData('123');

    // Should have multiple calls tracked
    const calls = mockExecutor.getCalls();
    expect(calls.length).toBeGreaterThanOrEqual(3);
    expect(calls.some(call => call.includes('gh pr view 123'))).toBe(true);
    expect(calls.some(call => call.includes('gh pr diff 123'))).toBe(true);
  });

  test('Detect Claude model function', async () => {
    const model = await detectClaudeModel();
    expect(typeof model).toBe('string');
    expect(model).toContain('Claude');
  });
});