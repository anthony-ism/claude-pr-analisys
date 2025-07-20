/**
 * comment-pr.test.ts - Tests for comment-pr.ts script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Tests for the comment-pr script functionality
 */

import {
  TestRunner,
  MockExecutor,
  MockReadline,
  setupTestEnvironment,
  cleanupTestEnvironment,
  assert,
  assertTruthy,
  assertFalsy,
  assertContains,
  createTestFile,
  cleanupTestFiles,
  createTestDependencies,
  setupEnhancedMocks,
} from '../utils/test-utils';

import { getTestTicketId, getMockPRData, GitHubPRData } from '../testing/mocks';

import * as fs from 'fs';
import * as path from 'path';

// Setup test environment
setupTestEnvironment();

// Get test data from shared mock system
const mockPRData = getMockPRData() as GitHubPRData;
const testTicketId = getTestTicketId() as string;

// Import modules (using require for compiled JS modules)
const commentPr = require('../../dist/comment-pr');
const prUtils = require('../../dist/utils/pr-utils');

// Create test runner
const testRunner = new TestRunner('Comment PR Test Suite');

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

// Test 1: Validate output file - valid file
testRunner.test(
  'Validate output file - valid file',
  async (): Promise<void> => {
    const testFile = createTestFile('Test comment content');

    const result = await commentPr.validateOutputFile(testFile);
    assert(result === true, 'Should validate existing non-empty file');

    cleanupTestFiles([testFile]);
  }
);

// Test 2: Validate output file - non-existent file
testRunner.test(
  'Validate output file - non-existent file',
  async (): Promise<void> => {
    const result = await commentPr.validateOutputFile('/non/existent/file.txt');
    assert(result === false, 'Should reject non-existent file');
  }
);

// Test 3: Validate output file - empty file
testRunner.test(
  'Validate output file - empty file',
  async (): Promise<void> => {
    const emptyFile = createTestFile('');

    const result = await commentPr.validateOutputFile(emptyFile);
    assert(result === false, 'Should reject empty file');

    cleanupTestFiles([emptyFile]);
  }
);

// Test 4: Preview file functionality
testRunner.test('Preview file functionality', async (): Promise<void> => {
  const testContent = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
  const testFile = createTestFile(testContent);

  // Test that preview function exists and doesn't throw
  await commentPr.previewFile(testFile, 3);

  cleanupTestFiles([testFile]);
});

// Test 5: Post comment functionality
testRunner.test('Post comment functionality', async (): Promise<void> => {
  setupMocks();

  const testFile = createTestFile('Test comment for PR');

  const result = await commentPr.postComment('393', testFile);
  assert(result === true, 'Should post comment successfully');

  // Verify GitHub CLI was called
  const calls = mockExecutor.getCalls();
  assertContains(calls, 'gh pr comment 393', 'Should call gh pr comment');

  cleanupTestFiles([testFile]);
  restoreMocks();
});

// Test 6: Post comment with user cancellation
testRunner.test(
  'Post comment with user cancellation',
  async (): Promise<void> => {
    setupMocks();
    // Configure mock readline to respond with 'n' (cancel)
    mockReadline.setResponses(['n']);

    const testFile = createTestFile('Test comment for PR');

    const result = await commentPr.postComment('393', testFile);
    assert(result === false, 'Should return false when user cancels');

    cleanupTestFiles([testFile]);
    restoreMocks();
  }
);

// Test 7: Usage function
testRunner.test(
  'Usage function provides help text',
  async (): Promise<void> => {
    assertTruthy(
      typeof commentPr.usage === 'function',
      'Usage should be a function'
    );

    // Should not throw when called
    commentPr.usage();
  }
);

// Test 8: Module exports
testRunner.test(
  'Module exports required functions',
  async (): Promise<void> => {
    assertTruthy(
      typeof commentPr.main === 'function',
      'Should export main function'
    );
    assertTruthy(
      typeof commentPr.validateOutputFile === 'function',
      'Should export validateOutputFile'
    );
    assertTruthy(
      typeof commentPr.postComment === 'function',
      'Should export postComment'
    );
    assertTruthy(
      typeof commentPr.previewFile === 'function',
      'Should export previewFile'
    );
    assertTruthy(typeof commentPr.usage === 'function', 'Should export usage');
  }
);

// Test 9: Large file validation warning
testRunner.test('Large file validation warning', async (): Promise<void> => {
  // Create a file larger than 64KB
  const largeContent = 'x'.repeat(70000);
  const largeFile = createTestFile(largeContent);

  // Should still validate but might show warning
  const result = await commentPr.validateOutputFile(largeFile);
  assert(result === true, 'Should validate large file');

  cleanupTestFiles([largeFile]);
});

// Test 10: File validation with different content types
testRunner.test(
  'File validation with different content types',
  async (): Promise<void> => {
    // Test markdown content
    const markdownFile = createTestFile(
      '# Test\n\n## Analysis\n\n- Point 1\n- Point 2'
    );
    const markdownResult = await commentPr.validateOutputFile(markdownFile);
    assert(markdownResult === true, 'Should validate markdown file');

    // Test plain text
    const textFile = createTestFile('Plain text analysis content');
    const textResult = await commentPr.validateOutputFile(textFile);
    assert(textResult === true, 'Should validate plain text file');

    cleanupTestFiles([markdownFile, textFile]);
  }
);

// Test 11: Error handling in comment posting
testRunner.test(
  'Error handling in comment posting',
  async (): Promise<void> => {
    // Create isolated mock setup for this error test
    const isolatedMockExecutor = new MockExecutor();
    const isolatedMockReadline = new MockReadline();

    // Setup only what we need for error testing
    isolatedMockExecutor.setRegexResponse(
      /gh pr comment 393/,
      new Error('API error')
    );
    isolatedMockReadline.setResponses(['y']); // User confirms but command fails

    // Use isolated dependencies
    const testDeps = createTestDependencies(
      isolatedMockExecutor,
      isolatedMockReadline
    );
    prUtils.setDependencies(testDeps);

    const testFile = createTestFile('Test comment');

    const result = await commentPr.postComment('393', testFile);
    assert(result === false, 'Should return false on GitHub CLI error');

    cleanupTestFiles([testFile]);
    restoreMocks();
  }
);

// Test 12: Integration with shared utilities
testRunner.test(
  'Integration with shared utilities',
  async (): Promise<void> => {
    setupMocks();

    // Test that script uses shared utilities
    const prValid = await prUtils.validatePR('393');
    assert(prValid === true, 'Should use shared PR validation');

    const testFile = createTestFile('Test content');
    const fileValid = await prUtils.validateFile(testFile);
    assert(fileValid === true, 'Should use shared file validation');

    cleanupTestFiles([testFile]);
    restoreMocks();
  }
);

// Test 13: File preview with long content
testRunner.test('File preview with long content', async (): Promise<void> => {
  const longContent = Array.from(
    { length: 20 },
    (_, i) => `Line ${i + 1}`
  ).join('\n');
  const testFile = createTestFile(longContent);

  // Test preview with limited lines
  await commentPr.previewFile(testFile, 5);

  // Test preview with more lines than available
  await commentPr.previewFile(testFile, 30);

  cleanupTestFiles([testFile]);
});

// Test 14: Absolute vs relative file paths
testRunner.test('Absolute vs relative file paths', async (): Promise<void> => {
  const testFile = createTestFile('Path test content');

  // Test with absolute path
  const absoluteResult = await commentPr.validateOutputFile(testFile);
  assert(absoluteResult === true, 'Should handle absolute path');

  // Test with relative path (if file exists relative to cwd)
  const relativePath = path.relative(process.cwd(), testFile);
  if (relativePath && !relativePath.startsWith('..')) {
    const relativeResult = await commentPr.validateOutputFile(relativePath);
    assert(relativeResult === true, 'Should handle relative path');
  }

  cleanupTestFiles([testFile]);
});

// Test 15: Comment posting workflow simulation
testRunner.test(
  'Comment posting workflow simulation',
  async (): Promise<void> => {
    // Create completely fresh mock instances to ensure total isolation
    const workflowMockExecutor = new MockExecutor();
    const workflowMockReadline = new MockReadline();

    // Setup enhanced mocks for successful workflow
    setupEnhancedMocks(workflowMockExecutor, workflowMockReadline);
    const testDeps = createTestDependencies(
      workflowMockExecutor,
      workflowMockReadline
    );
    prUtils.setDependencies(testDeps);

    // Create realistic analysis content
    const analysisContent = `# PR Analysis: BDEV-2055

## Context Summary
This PR addresses validation rule issues in the BIRC Salesforce application.

## Confidence Level: 85%
High confidence this solution addresses the immediate problem.

## Recommendations
1. Test validation bypass scenarios
2. Monitor production for gaps

---
*This analysis was generated using AI with the Claude CLI*`;

    const analysisFile = createTestFile(analysisContent);

    // Simulate full workflow
    const fileValid = await commentPr.validateOutputFile(analysisFile);
    assert(fileValid, 'Analysis file should be valid');

    const commentResult = await commentPr.postComment('393', analysisFile);
    assert(commentResult, 'Should post analysis comment successfully');

    // Verify GitHub CLI integration using the workflow-specific mock
    const calls = workflowMockExecutor.getCalls();
    assertContains(calls, 'gh pr comment', 'Should call GitHub CLI');

    cleanupTestFiles([analysisFile]);
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
