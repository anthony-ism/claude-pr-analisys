/**
 * pr-utils.test.ts - Unit tests for shared PR utilities
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Comprehensive tests for pr-utils.ts functionality
 */

import {
  TestRunner,
  MockExecutor,
  MockReadline,
  setupTestEnvironment,
  cleanupTestEnvironment,
  assert,
  assertContains,
  assertCommandCalled,
  assertFileExists,
  assertEqual,
  assertTruthy,
  assertFalsy,
  assertThrows,
  createTestFile,
  cleanupTestFiles,
  createTestDependencies,
  setupEnhancedMocks,
} from '../utils/test-utils';

import {
  getTestTicketId,
  getMockPRData,
  getMockJiraData,
  GitHubPRData,
} from '../testing/mocks';

import * as fs from 'fs';
import * as path from 'path';

// Setup test environment
setupTestEnvironment();

// Get test data from shared mock system
const mockPRData = getMockPRData() as GitHubPRData;
const mockJiraData = getMockJiraData() as string;
const testTicketId = getTestTicketId() as string;

// Import utilities to test (using require for compiled JS modules)
const prUtils = require('../../dist/utils/pr-utils');

// Create test runner instance
const testRunner = new TestRunner('PR Utils Test Suite');

// Create mock instances
const mockExecutor = new MockExecutor();
const mockReadline = new MockReadline();

// Helper to setup mocks for each test using dependency injection
function setupMocks(): void {
  // Setup enhanced mocks with better pattern matching
  setupEnhancedMocks(mockExecutor, mockReadline);

  // Inject dependencies into pr-utils
  const testDeps = createTestDependencies(mockExecutor, mockReadline);
  prUtils.setDependencies(testDeps);
}

// Helper to restore original functions
function restoreMocks(): void {
  prUtils.resetDependencies();
}

// Test 1: Console utilities
testRunner.test(
  'Console utilities - colors and printStatus',
  async (): Promise<void> => {
    // Test colors object exists
    assertTruthy(prUtils.colors, 'Colors object should exist');
    assertTruthy(prUtils.colors.red, 'Red color should be defined');
    assertTruthy(prUtils.colors.green, 'Green color should be defined');
    assertTruthy(prUtils.colors.yellow, 'Yellow color should be defined');
    assertTruthy(prUtils.colors.blue, 'Blue color should be defined');
    assertTruthy(prUtils.colors.reset, 'Reset color should be defined');

    // Test printStatus function exists and is callable
    assertTruthy(
      typeof prUtils.printStatus === 'function',
      'printStatus should be a function'
    );

    // Test it doesn't throw (hard to test console output directly)
    prUtils.printStatus('green', 'Test message');
  }
);

// Test 2: PR number validation
testRunner.test('PR number validation', async (): Promise<void> => {
  // Valid PR numbers
  assert(prUtils.validatePRNumber('123'), 'Should validate numeric string');
  assert(prUtils.validatePRNumber('1'), 'Should validate single digit');
  assert(prUtils.validatePRNumber('999999'), 'Should validate large numbers');

  // Invalid PR numbers
  assert(!prUtils.validatePRNumber('abc'), 'Should reject letters');
  assert(!prUtils.validatePRNumber('12a'), 'Should reject mixed alphanumeric');
  assert(!prUtils.validatePRNumber(''), 'Should reject empty string');
  assert(!prUtils.validatePRNumber('-123'), 'Should reject negative numbers');
  assert(!prUtils.validatePRNumber('12.3'), 'Should reject decimals');
});

// Test 3: PR validation with GitHub CLI
testRunner.test('PR validation with GitHub CLI', async (): Promise<void> => {
  setupMocks();

  // Test successful PR validation
  const result = await prUtils.validatePR('393');
  assert(result === true, 'Should return true for valid PR');

  // Check that some form of gh pr view was called (accounting for redirections)
  const calls = mockExecutor.getCalls();
  const foundPRView = calls.some(call => call.includes('gh pr view 393'));
  assert(foundPRView, 'Should call gh pr view command');

  restoreMocks();
});

// Test 4: PR validation failure
testRunner.test('PR validation failure handling', async (): Promise<void> => {
  setupMocks();

  // Clear default patterns and set specific error case
  (mockExecutor as any).regexResponses.clear();
  (mockExecutor as any).responses.clear();
  mockExecutor.setRegexResponse(/gh pr view 999/, new Error('PR not found'));

  const result = await prUtils.validatePR('999');
  assert(result === false, 'Should return false for invalid PR');

  restoreMocks();
});

// Test 5: Gather PR data
testRunner.test('Gather PR data from GitHub', async (): Promise<void> => {
  setupMocks();

  const prData = await prUtils.gatherPRData('393');

  assertTruthy(prData, 'Should return PR data object');
  assertTruthy(prData.view, 'Should include view data');
  assertTruthy(prData.diff, 'Should include diff data');
  assertTruthy(prData.json, 'Should include JSON data');
  assert(
    prData.json.title.includes(testTicketId),
    `Should include correct ticket ID ${testTicketId} in title`
  );

  // Check that all required commands were called (flexible matching)
  const calls = mockExecutor.getCalls();
  const foundBasicView = calls.some(
    call => call.includes('gh pr view 393') && !call.includes('--json')
  );
  const foundDiff = calls.some(call => call.includes('gh pr diff 393'));
  const foundJson = calls.some(call => call.includes('gh pr view 393 --json'));

  assert(foundBasicView, 'Should call basic PR view');
  assert(foundDiff, 'Should call PR diff');
  assert(foundJson, 'Should call JSON PR view');

  restoreMocks();
});

// Test 6: File utilities - temp directory
testRunner.test(
  'File utilities - ensure temp directory',
  async (): Promise<void> => {
    const tempDir = prUtils.ensureTempDir();

    assertTruthy(tempDir, 'Should return temp directory path');
    assert(tempDir.includes('temp'), 'Should contain temp in path');
    assertFileExists(tempDir, 'Temp directory should exist');
  }
);

// Test 7: File utilities - create timestamped file
testRunner.test(
  'File utilities - create timestamped file',
  async (): Promise<void> => {
    const testContent = 'Test content for timestamped file';
    const filePath = prUtils.createTimestampedFile('test', '.txt', testContent);

    assertTruthy(filePath, 'Should return file path');
    assert(filePath.includes('test'), 'Should include prefix in filename');
    assert(filePath.endsWith('.txt'), 'Should have correct extension');
    assertFileExists(filePath, 'File should exist');

    // Verify content
    const content = fs.readFileSync(filePath, 'utf8');
    assertEqual(content, testContent, 'File should contain correct content');

    // Cleanup
    cleanupTestFiles([filePath]);
  }
);

// Test 8: File validation
testRunner.test('File validation', async (): Promise<void> => {
  // Create test file
  const testFile = createTestFile('Test content');

  // Test valid file
  const validResult = await prUtils.validateFile(testFile);
  assert(validResult === true, 'Should validate existing file');

  // Test non-existent file
  const invalidResult = await prUtils.validateFile('/non/existent/file.txt');
  assert(invalidResult === false, 'Should reject non-existent file');

  // Cleanup
  cleanupTestFiles([testFile]);
});

// Test 9: Tool checking
testRunner.test('Tool checking functionality', async (): Promise<void> => {
  setupMocks();

  // Test successful tool check
  await prUtils.checkRequiredTools(['gh', 'jira']);

  const calls = mockExecutor.getCalls();
  const foundGhCheck = calls.some(call => call.includes('which gh'));
  const foundJiraCheck = calls.some(call => call.includes('which jira'));
  assert(foundGhCheck, 'Should check for gh CLI');
  assert(foundJiraCheck, 'Should check for jira CLI');

  restoreMocks();
});

// Test 10: Tool checking failure
testRunner.test('Tool checking failure handling', async (): Promise<void> => {
  setupMocks();

  // Mock missing tool
  mockExecutor.setResponse(
    'which missing-tool',
    new Error('Command not found')
  );

  await assertThrows(
    () => prUtils.checkRequiredTools(['missing-tool']),
    'Should throw error for missing tool'
  );

  restoreMocks();
});

// Test 11: Jira ticket extraction
testRunner.test(
  'Jira ticket extraction from PR titles',
  async (): Promise<void> => {
    // Test valid ticket extraction
    const ticket1 = prUtils.extractJiraTicket(
      `${testTicketId}: Unable to set forms to Ready to Read`
    );
    assertEqual(ticket1, testTicketId, 'Should extract ticket ID');

    const ticket2 = prUtils.extractJiraTicket(
      `Fix: ${testTicketId.replace('-2055', '-1234')} - Update validation logic`
    );
    assertEqual(
      ticket2,
      testTicketId.replace('-2055', '-1234'),
      'Should extract ticket from middle of title'
    );

    // Test no ticket found
    const noTicket = prUtils.extractJiraTicket(
      'Fix bug without ticket reference'
    );
    assertEqual(noTicket, null, 'Should return null for no ticket');
  }
);

// Test 12: Jira ticket validation
testRunner.test('Jira ticket validation', async (): Promise<void> => {
  setupMocks();

  const result = await prUtils.validateJiraTicket(testTicketId);
  assert(result === true, 'Should return true for valid ticket');

  const calls = mockExecutor.getCalls();
  const foundJiraCall = calls.some(call =>
    call.includes(`jira issue view ${testTicketId}`)
  );
  assert(foundJiraCall, 'Should call jira CLI');

  restoreMocks();
});

// Test 13: Jira data gathering
testRunner.test('Jira data gathering', async (): Promise<void> => {
  setupMocks();

  const jiraData = await prUtils.gatherJiraData(testTicketId);
  assertTruthy(jiraData, 'Should return Jira data');
  assert(jiraData.includes(testTicketId), 'Should contain ticket ID');

  restoreMocks();
});

// Test 14: Claude model detection
testRunner.test('Claude model detection', async (): Promise<void> => {
  setupMocks();

  const model = await prUtils.detectClaudeModel();
  assertTruthy(model, 'Should return model string');
  assert(model.includes('Claude'), 'Should contain Claude in model string');

  restoreMocks();
});

// Test 15: PR comment posting
testRunner.test('PR comment posting', async (): Promise<void> => {
  setupMocks();

  // Create test file for comment
  const testFile = createTestFile('Test comment content');

  const result = await prUtils.postPRComment('393', testFile);
  assert(result === true, 'Should return true for successful comment posting');

  const calls = mockExecutor.getCalls();
  const foundCommentCall = calls.some(call =>
    call.includes('gh pr comment 393')
  );
  assert(foundCommentCall, 'Should call gh pr comment');

  // Cleanup
  cleanupTestFiles([testFile]);
  restoreMocks();
});

// Test 16: Error handling in PR data gathering
testRunner.test(
  'Error handling in PR data gathering',
  async (): Promise<void> => {
    setupMocks();

    // Clear default patterns and set specific error case
    (mockExecutor as any).regexResponses.clear();
    (mockExecutor as any).responses.clear();
    mockExecutor.setRegexResponse(/gh pr view 999/, new Error('API error'));

    const result = await prUtils.gatherPRData('999');
    assertEqual(result, null, 'Should return null on error');

    restoreMocks();
  }
);

// Test 17: Error handling in Jira data gathering
testRunner.test(
  'Error handling in Jira data gathering',
  async (): Promise<void> => {
    setupMocks();

    // Mock error in Jira view
    mockExecutor.setResponse(
      'jira issue view INVALID',
      new Error('Ticket not found')
    );

    const result = await prUtils.gatherJiraData('INVALID');
    assertEqual(result, null, 'Should return null on error');

    restoreMocks();
  }
);

// Test 18: Empty file validation
testRunner.test('Empty file validation', async (): Promise<void> => {
  // Create empty test file
  const emptyFile = createTestFile('');

  const result = await prUtils.validateFile(emptyFile);
  assert(result === false, 'Should reject empty file');

  // Cleanup
  cleanupTestFiles([emptyFile]);
});

// Test 19: Large file creation
testRunner.test(
  'Large file creation and validation',
  async (): Promise<void> => {
    const largeContent = 'x'.repeat(1000);
    const largeFile = prUtils.createTimestampedFile(
      'large-test',
      '.txt',
      largeContent
    );

    assertFileExists(largeFile, 'Large file should be created');

    const content = fs.readFileSync(largeFile, 'utf8');
    assertEqual(content.length, 1000, 'Large file should have correct size');

    // Cleanup
    cleanupTestFiles([largeFile]);
  }
);

// Test 20: Integration test - full workflow simulation
testRunner.test(
  'Integration test - full workflow simulation',
  async (): Promise<void> => {
    setupMocks();

    // Simulate analyze-pr workflow
    const prValid = await prUtils.validatePR('393');
    assert(prValid, 'PR should be valid');

    const prData = await prUtils.gatherPRData('393');
    assertTruthy(prData, 'Should gather PR data');

    const jiraTicket = prUtils.extractJiraTicket(prData.json.title);
    assertTruthy(jiraTicket, 'Should extract Jira ticket');

    const jiraValid = await prUtils.validateJiraTicket(jiraTicket);
    assert(jiraValid, 'Jira ticket should be valid');

    const jiraData = await prUtils.gatherJiraData(jiraTicket);
    assertTruthy(jiraData, 'Should gather Jira data');

    // Simulate comment-pr workflow
    const commentFile = createTestFile('Test analysis comment');
    const commentResult = await prUtils.postPRComment('393', commentFile);
    assert(commentResult, 'Should post comment successfully');

    // Verify all expected CLI calls were made
    const calls = mockExecutor.getCalls();
    assert(calls.length >= 6, 'Should make multiple CLI calls');

    // Cleanup
    cleanupTestFiles([commentFile]);
    restoreMocks();
  }
);

/**
 * Export test runner and run function
 */
async function runTests(): Promise<boolean> {
  return await testRunner.run();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testRunner, runTests };
