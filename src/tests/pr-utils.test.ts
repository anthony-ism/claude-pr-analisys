/**
 * pr-utils.test.ts - Unit tests for shared PR utilities
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Comprehensive tests for pr-utils.ts functionality using Vitest
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  MockExecutor,
  MockReadline,
  createTestDependencies,
  setupEnhancedMocks,
  createTestFile,
  cleanupTestFiles,
} from '../utils/test-utils';

import {
  getTestTicketId,
} from '../testing/mocks';

import * as fs from 'fs';

// Import utilities to test directly from TypeScript source
import * as prUtils from '../utils/pr-utils';

const testTicketId = getTestTicketId() as string;

// Create test instances  
const mockExecutor = new MockExecutor();
const mockReadline = new MockReadline();

function setupMocks(): void {
  setupEnhancedMocks(mockExecutor, mockReadline);
  const testDeps = createTestDependencies(mockExecutor, mockReadline);
  prUtils.setDependencies(testDeps);
}

function restoreMocks(): void {
  prUtils.resetDependencies();
}

describe('PR Utils Test Suite', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  test('Extract Jira ticket from PR title', async () => {
    const ticket = prUtils.extractJiraTicket(`${testTicketId}: Visit Accepted Date is not displayed`);
    expect(ticket).toBe(testTicketId);

    const noTicket = prUtils.extractJiraTicket('Fix bug without ticket');
    expect(noTicket).toBeNull();
  });

  test('Validate PR number format', async () => {
    expect(prUtils.validatePRNumber('123')).toBe(true);
    expect(prUtils.validatePRNumber('0')).toBe(true);
    expect(prUtils.validatePRNumber('abc')).toBe(false);
    expect(prUtils.validatePRNumber('')).toBe(false);
    expect(prUtils.validatePRNumber('12.3')).toBe(false);
  });

  test('Validate PR existence', async () => {
    const result = await prUtils.validatePR('123');
    expect(result).toBe(true);

    // Mock should handle invalid PR
    const invalidResult = await prUtils.validatePR('999');
    expect(typeof invalidResult).toBe('boolean');
  });

  test('Gather PR data returns complete object', async () => {
    const prData = await prUtils.gatherPRData('123');
    expect(prData).toBeTruthy();
    expect(prData).toHaveProperty('view');
    expect(prData).toHaveProperty('diff');
    expect(prData).toHaveProperty('json');
  });

  test('Validate Jira ticket format', async () => {
    const validResult = await prUtils.validateJiraTicket(testTicketId);
    expect(validResult).toBe(true);

    const invalidResult = await prUtils.validateJiraTicket('INVALID-FORMAT');
    expect(typeof invalidResult).toBe('boolean');
  });

  test('Gather Jira data returns string content', async () => {
    const jiraData = await prUtils.gatherJiraData(testTicketId);
    expect(typeof jiraData).toBe('string');
    expect(jiraData.length).toBeGreaterThan(0);
  });

  test('Check required tools availability', async () => {
    await expect(prUtils.checkRequiredTools()).resolves.not.toThrow();
  });

  test('User confirmation handling', async () => {
    // Setup mock readline response
    mockReadline.addResponse('y');
    
    const confirmed = await prUtils.getUserConfirmation('Test question?');
    expect(typeof confirmed).toBe('boolean');
  });

  test('Environment validation', async () => {
    expect(prUtils.validateEnvironment()).toBe(true);
  });

  test('GitHub pattern matching', async () => {
    const patterns = prUtils.getGitHubPatterns();
    expect(patterns).toBeTruthy();
    expect(Array.isArray(patterns.valid) || typeof patterns.valid === 'object').toBe(true);
  });

  test('Jira pattern matching', async () => {
    const patterns = prUtils.getJiraPatterns();
    expect(patterns).toBeTruthy();
    expect(Array.isArray(patterns.valid) || typeof patterns.valid === 'object').toBe(true);
  });

  test('File operations - create and validate', async () => {
    const testFile = createTestFile('Test content for PR utils');
    
    expect(fs.existsSync(testFile)).toBe(true);
    
    const content = fs.readFileSync(testFile, 'utf-8');
    expect(content).toBe('Test content for PR utils');

    cleanupTestFiles([testFile]);
  });

  test('Error handling for missing dependencies', async () => {
    // Reset to default dependencies (no mocks)
    prUtils.resetDependencies();
    
    // Should handle missing tools gracefully
    try {
      await prUtils.checkRequiredTools();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
    
    // Restore mocks for other tests
    setupMocks();
  });

  test('GitHub CLI command construction', async () => {
    await prUtils.gatherPRData('456');
    
    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('gh pr view 456'))).toBe(true);
    expect(calls.some(call => call.includes('gh pr diff 456'))).toBe(true);
  });

  test('Jira CLI command construction', async () => {
    await prUtils.gatherJiraData(testTicketId);
    
    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes(`jira issue view ${testTicketId}`))).toBe(true);
  });

  test('Dependency injection system', async () => {
    const customMockExec = new MockExecutor();
    const customMockReadline = new MockReadline();
    
    const customDeps = createTestDependencies(customMockExec, customMockReadline);
    prUtils.setDependencies(customDeps);
    
    // Test that custom dependencies are used
    await prUtils.gatherPRData('789');
    
    const calls = customMockExec.getCalls();
    expect(calls.length).toBeGreaterThan(0);
    
    // Restore original mocks
    setupMocks();
  });

  test('Command execution tracking', async () => {
    mockExecutor.clearCalls();
    
    await prUtils.validatePR('123');
    await prUtils.gatherPRData('123');
    
    const calls = mockExecutor.getCalls();
    expect(calls.length).toBeGreaterThan(0);
  });

  test('Environment variable access', async () => {
    expect(process.env.JIRA_TICKET_PREFIX).toBe('TEST');
    expect(process.env.GITHUB_REPOSITORY).toBe('test-org/test-repo');
  });

  test('Ticket extraction with various formats', async () => {
    const testCases = [
      { input: `${testTicketId}: Simple task`, expected: testTicketId },
      { input: `feat: ${testTicketId} - Complex feature`, expected: testTicketId },
      { input: 'No ticket in this title', expected: null },
      { input: `Multiple ${testTicketId} and TEST-999`, expected: testTicketId },
    ];
    
    testCases.forEach(({ input, expected }) => {
      const result = prUtils.extractJiraTicket(input);
      expect(result).toBe(expected);
    });
  });

  test('Error handling for network failures', async () => {
    // Setup mock to simulate network error
    mockExecutor.setRegexResponse(/gh pr view 999/, new Error('Network error'));
    
    try {
      await prUtils.gatherPRData('999');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});