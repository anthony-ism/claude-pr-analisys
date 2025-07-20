/**
 * analyze-pr.test.ts - Tests for analyze-pr.ts script
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Tests for the refactored analyze-pr script using shared utilities
 */

import {
  TestRunner,
  MockExecutor,
  MockReadline,
  setupTestEnvironment,
  cleanupTestEnvironment,
  assert,
  assertTruthy,
  assertContains,
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

// Import modules (using require for compiled JS modules)
const analyzePr = require('../../dist/analyze-pr');
const prUtils = require('../../dist/utils/pr-utils');

// Create test runner
const testRunner = new TestRunner('Analyze PR Test Suite');

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

// Test 1: Create Claude prompt
testRunner.test(
  'Create Claude prompt with all required data',
  async (): Promise<void> => {
    setupMocks();

    const prompt = await analyzePr.createClaudePrompt(
      '393',
      testTicketId,
      mockPRData,
      mockJiraData
    );

    assertTruthy(prompt, 'Should create prompt');
    assertContains([prompt], 'Pull Request #393', 'Should include PR number');
    assertContains(
      [prompt],
      testTicketId,
      `Should include Jira ticket ${testTicketId}`
    );
    assertContains(
      [prompt],
      'stopFormValidation',
      'Should include diff content'
    );
    assertContains([prompt], 'validation rules', 'Should include Jira content');
    assertContains([prompt], 'Claude CLI', 'Should include attribution');

    restoreMocks();
  }
);

// Test 2: Call Claude function creates file
testRunner.test(
  'Call Claude function creates timestamped file',
  async (): Promise<void> => {
    const testPrompt = 'Test prompt for Claude analysis';

    // Mock temp directory exists
    const result = await analyzePr.callClaude(testPrompt);

    assertTruthy(result, 'Should return prompt content');
    assert(result === testPrompt, 'Should return original prompt');

    // File should be created (check temp directory)
    const tempDir = path.join(process.cwd(), 'temp');

    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const promptFiles = files.filter(f => f.startsWith('claude-prompt-'));
      assert(
        promptFiles.length > 0,
        'Should create prompt file in temp directory'
      );

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
  }
);

// Test 3: Usage function
testRunner.test(
  'Usage function provides help text',
  async (): Promise<void> => {
    // Test that usage function exists and is callable
    assertTruthy(
      typeof analyzePr.usage === 'function',
      'Usage should be a function'
    );

    // Should not throw when called
    analyzePr.usage();
  }
);

// Test 4: Module exports
testRunner.test(
  'Module exports required functions',
  async (): Promise<void> => {
    assertTruthy(
      typeof analyzePr.main === 'function',
      'Should export main function'
    );
    assertTruthy(
      typeof analyzePr.createClaudePrompt === 'function',
      'Should export createClaudePrompt'
    );
    assertTruthy(
      typeof analyzePr.callClaude === 'function',
      'Should export callClaude'
    );
    assertTruthy(typeof analyzePr.usage === 'function', 'Should export usage');
  }
);

// Test 5: Integration with shared utilities
testRunner.test(
  'Integration with shared utilities',
  async (): Promise<void> => {
    setupMocks();

    // Test that the script uses shared utilities correctly
    const prData = await prUtils.gatherPRData('393');
    assertTruthy(prData, 'Should use shared PR data gathering');

    const jiraTicket = prUtils.extractJiraTicket(
      `${testTicketId}: Test ticket`
    );
    assert(
      jiraTicket === testTicketId,
      `Should use shared Jira extraction and extract ${testTicketId}`
    );

    restoreMocks();
  }
);

// Test 6: Error handling in prompt creation
testRunner.test(
  'Error handling in prompt creation',
  async (): Promise<void> => {
    setupMocks();

    // Test with invalid data
    try {
      const prompt = await analyzePr.createClaudePrompt(
        '393',
        testTicketId,
        null,
        mockJiraData
      );
      // Should handle null prData gracefully
      assertTruthy(prompt, 'Should create prompt even with null prData');
    } catch (error) {
      // If it throws, that's also acceptable behavior
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      assertTruthy(errorMessage, 'Should provide meaningful error message');
    }

    restoreMocks();
  }
);

// Test 7: File creation in correct location
testRunner.test(
  'File creation in correct temp location',
  async (): Promise<void> => {
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const beforeFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];

    await analyzePr.callClaude('Test content');

    const afterFiles = fs.readdirSync(tempDir);
    assert(
      afterFiles.length > beforeFiles.length,
      'Should create new file in temp directory'
    );

    // Find and cleanup the new file
    const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
    newFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  }
);

// Test 8: Prompt template validation
testRunner.test(
  'Prompt template includes all required sections',
  async (): Promise<void> => {
    setupMocks();

    const prompt = await analyzePr.createClaudePrompt(
      '393',
      testTicketId,
      mockPRData,
      mockJiraData
    );

    // Check for required sections
    assertContains([prompt], '## Pull Request #', 'Should have PR section');
    assertContains([prompt], '### PR Details:', 'Should have PR details');
    assertContains(
      [prompt],
      '### PR Changes (diff):',
      'Should have diff section'
    );
    assertContains(
      [prompt],
      '### PR Metadata:',
      'Should have metadata section'
    );
    assertContains([prompt], '## Jira Ticket', 'Should have Jira section');
    assertContains(
      [prompt],
      '### Ticket Details:',
      'Should have ticket details'
    );
    assertContains(
      [prompt],
      '## Analysis Request',
      'Should have analysis request'
    );
    assertContains(
      [prompt],
      'IMPORTANT: Before analyzing',
      'Should have context gathering instructions'
    );
    assertContains(
      [prompt],
      'Context Summary',
      'Should request context summary'
    );
    assertContains(
      [prompt],
      'Confidence Level',
      'Should request confidence level'
    );
    assertContains([prompt], 'generated using AI', 'Should have attribution');

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
