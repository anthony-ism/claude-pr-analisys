/**
 * comment-pr.test.ts - Tests for comment-pr.ts script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Tests for the comment-pr script functionality using Vitest
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  MockExecutor,
  MockReadline,
  createTestFile,
  cleanupTestFiles,
  createTestDependencies,
  setupEnhancedMocks,
} from '../utils/test-utils';

import * as path from 'path';

// Import modules directly from TypeScript source
import * as commentPr from '../comment-pr';
import * as prUtils from '../utils/pr-utils';

// Import service modules for dependency injection
import {
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

describe('Comment PR Test Suite', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  test('Validate output file - valid file', async () => {
    const testFile = createTestFile('Test comment content');

    const result = await commentPr.validateOutputFile(testFile);
    expect(result).toBe(true);

    cleanupTestFiles([testFile]);
  });

  test('Validate output file - non-existent file', async () => {
    const result = await commentPr.validateOutputFile('/non/existent/file.txt');
    expect(result).toBe(false);
  });

  test('Validate output file - empty file', async () => {
    const emptyFile = createTestFile('');

    const result = await commentPr.validateOutputFile(emptyFile);
    expect(result).toBe(false);

    cleanupTestFiles([emptyFile]);
  });

  test('Validate PR number format', async () => {
    expect(await commentPr.validatePR('123')).toBe(true);
    expect(await commentPr.validatePR('0')).toBe(true);
    expect(await commentPr.validatePR('abc')).toBe(false);
    expect(await commentPr.validatePR('')).toBe(false);
    expect(await commentPr.validatePR('12.3')).toBe(false);
  });

  test('Post analysis comment calls GitHub CLI', async () => {
    const testFile = createTestFile('Test analysis content');

    const result = await commentPr.postAnalysisComment('123', testFile);
    expect(result).toBe(true);

    const calls = mockExecutor.getCalls();
    expect(calls.some(call => call.includes('gh pr comment 123'))).toBe(true);

    cleanupTestFiles([testFile]);
  });

  test('Module exports required functions', async () => {
    expect(typeof commentPr.main).toBe('function');
    expect(typeof commentPr.validateOutputFile).toBe('function');
    expect(typeof commentPr.validatePR).toBe('function');
    expect(typeof commentPr.postAnalysisComment).toBe('function');
    expect(typeof commentPr.usage).toBe('function');
  });

  test('Usage function provides help text', async () => {
    expect(typeof commentPr.usage).toBe('function');
    expect(() => commentPr.usage()).not.toThrow();
  });

  test('Integration with shared utilities', async () => {
    setupMocks();

    // Test that the script uses shared utilities correctly
    const prData = await prUtils.gatherPRData('123');
    expect(prData).toBeTruthy();

    const jiraTicket = prUtils.extractJiraTicket('TEST-456: Test ticket');
    expect(jiraTicket).toBe('TEST-456');

    restoreMocks();
  });

  test('Error handling for invalid PR numbers', async () => {
    expect(await commentPr.validatePR('invalid')).toBe(false);
    expect(await commentPr.validatePR('-1')).toBe(false);
    expect(await commentPr.validatePR('1.5')).toBe(false);
  });

  test('Error handling for missing output files', async () => {
    const result = await commentPr.validateOutputFile(
      '/path/that/does/not/exist.txt'
    );
    expect(result).toBe(false);
  });

  test('Successful comment posting workflow', async () => {
    const testFile = createTestFile('Comprehensive analysis content for PR');

    // Validate file first
    const isValid = await commentPr.validateOutputFile(testFile);
    expect(isValid).toBe(true);

    // Post comment
    const posted = await commentPr.postAnalysisComment('456', testFile);
    expect(posted).toBe(true);

    cleanupTestFiles([testFile]);
  });

  test('File validation with whitespace-only content', async () => {
    const whitespaceFile = createTestFile('   \n\t  \n  ');

    // Current implementation considers non-empty files valid, even if whitespace-only
    const result = await commentPr.validateOutputFile(whitespaceFile);
    expect(result).toBe(true);

    cleanupTestFiles([whitespaceFile]);
  });

  test('GitHub CLI command formatting', async () => {
    const testFile = createTestFile('Test comment body');

    await commentPr.postAnalysisComment('789', testFile);

    const calls = mockExecutor.getCalls();
    const commentCall = calls.find(call => call.includes('gh pr comment'));
    expect(commentCall).toContain('789');
    expect(commentCall).toContain('--body-file');

    cleanupTestFiles([testFile]);
  });

  test('Cleanup handles missing files gracefully', async () => {
    const nonExistentFiles = ['/fake/path1.txt', '/fake/path2.txt'];
    expect(() => cleanupTestFiles(nonExistentFiles)).not.toThrow();
  });

  test('Large file content handling', async () => {
    const largeContent = 'A'.repeat(10000); // 10KB of content
    const largeFile = createTestFile(largeContent);

    const isValid = await commentPr.validateOutputFile(largeFile);
    expect(isValid).toBe(true);

    const posted = await commentPr.postAnalysisComment('100', largeFile);
    expect(posted).toBe(true);

    cleanupTestFiles([largeFile]);
  });
});
