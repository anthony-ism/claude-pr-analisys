/**
 * test-utils.ts - Shared testing utilities and framework
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: Common testing functionality for PR automation script tests
 */

import * as fs from 'fs';
import * as path from 'path';

// Import shared test utilities and mock data
import * as testHelpers from '../testing/utils/test-helpers';
import { mockData, cliResponses, testScenarios } from '../testing/mocks';

const { getTestTicketId, validateTestEnvironment } = testHelpers;
const sharedSetupEnvironment = testHelpers.setupTestEnvironment;
const sharedCleanupEnvironment = testHelpers.cleanupTestEnvironment;

// Type definitions
export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error: string | null;
}

export interface TestSummary {
  name: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

export interface MockResponse {
  stdout: string;
  stderr?: string;
}

export interface TestEnvironmentConfig {
  JIRA_TICKET_PREFIX?: string;
  GITHUB_REPOSITORY?: string;
  [key: string]: string | undefined;
}

/**
 * Setup test environment with required environment variables
 * MUST be called before running any tests that use Jira functionality
 * Uses shared test environment setup with TEST prefix
 */
export function setupTestEnvironment(): void {
  sharedSetupEnvironment({
    JIRA_TICKET_PREFIX: 'TEST',
    GITHUB_REPOSITORY: 'test-org/test-repo',
  });
}

/**
 * Cleanup test environment variables
 * Uses shared cleanup function
 */
export function cleanupTestEnvironment(): void {
  sharedCleanupEnvironment();
}

/**
 * Enhanced test runner with reporting capabilities
 */
export class TestRunner {
  private readonly name: string;
  private readonly tests: Array<{
    name: string;
    fn: () => Promise<void> | void;
  }>;
  private passed: number;
  private failed: number;
  private startTime: number | null;
  private endTime: number | null;
  private readonly results: TestResult[];

  constructor(name: string = 'Test Suite') {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.startTime = null;
    this.endTime = null;
    this.results = [];
  }

  /**
   * Add a test to the suite
   */
  test(name: string, fn: () => Promise<void> | void): void {
    this.tests.push({ name, fn });
  }

  /**
   * Run all tests in the suite
   * @returns True if all tests passed
   */
  async run(): Promise<boolean> {
    console.log(`🧪 Running ${this.name}\n`);
    this.startTime = Date.now();

    for (const { name, fn } of this.tests) {
      const testStartTime = Date.now();
      try {
        await fn();
        const duration = Date.now() - testStartTime;
        console.log(`✅ ${name} (${duration}ms)`);
        this.passed++;
        this.results.push({ name, status: 'passed', duration, error: null });
      } catch (error) {
        const duration = Date.now() - testStartTime;
        console.log(`❌ ${name} (${duration}ms)`);
        console.log(
          `   Error: ${error instanceof Error ? error.message : String(error)}`
        );
        this.failed++;
        this.results.push({
          name,
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.endTime = Date.now();
    this.generateReport();
    return this.failed === 0;
  }

  /**
   * Generate test report
   */
  private generateReport(): void {
    const totalDuration = (this.endTime || 0) - (this.startTime || 0);
    const total = this.passed + this.failed;

    console.log(`\n📊 ${this.name} Results:`);
    console.log(`   Tests: ${total}`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Duration: ${totalDuration}ms`);
    console.log(
      `   Success Rate: ${total > 0 ? Math.round((this.passed / total) * 100) : 0}%`
    );

    if (this.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }
  }

  /**
   * Get test results for external reporting
   */
  getResults(): TestSummary {
    return {
      name: this.name,
      total: this.passed + this.failed,
      passed: this.passed,
      failed: this.failed,
      duration: (this.endTime || 0) - (this.startTime || 0),
      results: this.results,
    };
  }
}

/**
 * Enhanced mock command executor for testing CLI integrations
 */
export class MockExecutor {
  private calls: string[];
  private readonly responses: Map<string, MockResponse | Error>;
  private readonly regexResponses: Map<RegExp, MockResponse | Error>;
  private readonly defaultResponse: MockResponse;
  private debug: boolean;

  constructor() {
    this.calls = [];
    this.responses = new Map();
    this.regexResponses = new Map();
    this.defaultResponse = { stdout: 'mock response', stderr: '' };
    this.debug = false;
  }

  /**
   * Enable debug logging for troubleshooting
   */
  setDebug(enabled: boolean = true): void {
    this.debug = enabled;
  }

  /**
   * Set response for a specific command pattern
   */
  setResponse(pattern: string, response: MockResponse | Error): void {
    this.responses.set(pattern, response);
  }

  /**
   * Set response for a regex command pattern
   */
  setRegexResponse(regex: RegExp, response: MockResponse | Error): void {
    this.regexResponses.set(regex, response);
  }

  /**
   * Clear all recorded calls
   */
  clearCalls(): void {
    this.calls = [];
  }

  /**
   * Clear all response patterns
   */
  clearResponses(): void {
    this.responses.clear();
    this.regexResponses.clear();
  }

  /**
   * Get all recorded command calls
   */
  getCalls(): string[] {
    return [...this.calls];
  }

  /**
   * Normalize command for better matching (remove redirections, extra spaces)
   */
  private normalizeCommand(command: string): string {
    // Remove common redirections and normalize spaces
    return command
      .replace(/\s*>\s*\/dev\/null\s*2>&1/, '') // Remove > /dev/null 2>&1
      .replace(/\s*2>\/dev\/null/, '') // Remove 2>/dev/null
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Execute a mocked command with enhanced pattern matching
   */
  async execute(command: string): Promise<MockResponse> {
    this.calls.push(command);
    const normalizedCommand = this.normalizeCommand(command);

    if (this.debug) {
      console.log(`MockExecutor: Executing "${command}"`);
      console.log(`MockExecutor: Normalized "${normalizedCommand}"`);
    }

    // Try regex patterns first (more specific)
    for (const [regex, response] of this.regexResponses.entries()) {
      if (regex.test(normalizedCommand)) {
        if (this.debug) {
          console.log(`MockExecutor: Matched regex ${regex.source}`);
        }
        if (response instanceof Error) {
          throw response;
        }
        return response;
      }
    }

    // Try substring patterns
    for (const [pattern, response] of this.responses.entries()) {
      if (normalizedCommand.includes(pattern)) {
        if (this.debug) {
          console.log(`MockExecutor: Matched pattern "${pattern}"`);
        }
        if (response instanceof Error) {
          throw response;
        }
        return response;
      }
    }

    if (this.debug) {
      console.log(`MockExecutor: No match found, using default response`);
    }

    return this.defaultResponse;
  }
}

/**
 * Mock readline interface for testing user interactions
 */
export class MockReadline {
  private responses: string[];
  private currentIndex: number;
  private debug: boolean;

  constructor() {
    this.responses = [];
    this.currentIndex = 0;
    this.debug = false;
  }

  /**
   * Enable debug logging
   */
  setDebug(enabled: boolean = true): void {
    this.debug = enabled;
  }

  /**
   * Set responses for questions in order
   */
  setResponses(responses: string[]): void {
    this.responses = responses;
    this.currentIndex = 0;
  }

  /**
   * Add a single response
   */
  addResponse(response: string): void {
    this.responses.push(response);
  }

  /**
   * Clear all responses
   */
  clearResponses(): void {
    this.responses = [];
    this.currentIndex = 0;
  }

  /**
   * Create a mock readline interface
   */
  createInterface(_options: unknown): {
    question: (
      questionText: string,
      callback: (answer: string) => void
    ) => void;
    close: () => void;
  } {
    return {
      question: (questionText: string, callback: (answer: string) => void) => {
        if (this.debug) {
          console.log(`MockReadline: Question "${questionText}"`);
        }

        // Return next response or default 'y'
        const response =
          this.currentIndex < this.responses.length
            ? this.responses[this.currentIndex]!
            : 'y';

        this.currentIndex++;

        if (this.debug) {
          console.log(`MockReadline: Responding "${response}"`);
        }

        // Simulate async behavior
        setImmediate(() => callback(response));
      },
      close: () => {
        if (this.debug) {
          console.log(`MockReadline: Interface closed`);
        }
      },
    };
  }
}

/**
 * Assert that a condition is true
 */
export function assert(
  condition: boolean,
  message: string = 'Assertion failed'
): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Assert that an array contains an item
 */
export function assertContains<T>(array: T[], item: T, message?: string): void {
  const found = array.some(element => {
    if (typeof element === 'string' && typeof item === 'string') {
      return element.includes(item);
    }
    return element === item;
  });

  if (!found) {
    throw new Error(message || `Expected array to contain item: ${item}`);
  }
}

/**
 * Assert that a command was called
 */
export function assertCommandCalled(
  calls: string[],
  command: string,
  message?: string
): void {
  assertContains(
    calls,
    command,
    message || `Expected command to be called: ${command}`
  );
}

/**
 * Assert that a file exists
 */
export function assertFileExists(filePath: string, message?: string): void {
  try {
    const exists = fs.existsSync(filePath);
    assert(exists, message || `Expected file to exist: ${filePath}`);
  } catch (error) {
    throw new Error(
      message ||
        `Error checking file existence: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Assert that two objects are equal (deep comparison for simple objects)
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message ||
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Assert that a value is truthy
 */
export function assertTruthy(value: unknown, message?: string): void {
  assert(!!value, message || `Expected truthy value, got: ${value}`);
}

/**
 * Assert that a value is falsy
 */
export function assertFalsy(value: unknown, message?: string): void {
  assert(!value, message || `Expected falsy value, got: ${value}`);
}

/**
 * Assert that a function throws an error
 */
export async function assertThrows(
  fn: () => Promise<void> | void,
  message?: string
): Promise<Error> {
  try {
    await fn();
    throw new Error(message || 'Expected function to throw an error');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === (message || 'Expected function to throw an error')
    ) {
      throw error;
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Create a temporary test file
 */
export function createTestFile(
  content: string,
  extension: string = '.txt'
): string {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filePath = path.join(tempDir, `test-${Date.now()}${extension}`);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Clean up test files
 */
export function cleanupTestFiles(filePaths: string[]): void {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(
        `Warning: Could not clean up test file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Get mock PR data using shared mock system
 */
export function getMockPRData(): unknown {
  return mockData.github.pr;
}

/**
 * Get mock Jira data using shared mock system
 */
export function getMockJiraData(): unknown {
  return mockData.jira.data;
}

/**
 * Legacy mock data aliases for backward compatibility
 * @deprecated Use getMockPRData() and getMockJiraData() instead
 */
export const mockPRData = mockData.github.pr;
export const mockJiraData = mockData.jira.data;

/**
 * Create a test dependencies object for injection
 */
export function createTestDependencies(
  mockExecutor: MockExecutor,
  mockReadline: MockReadline
): {
  execAsync: (command: string) => Promise<MockResponse>;
  readline: MockReadline;
} {
  return {
    execAsync: mockExecutor.execute.bind(mockExecutor),
    readline: mockReadline,
  };
}

/**
 * Setup enhanced mocks with better patterns using shared CLI responses
 */
export function setupEnhancedMocks(
  mockExecutor: MockExecutor,
  mockReadline: MockReadline
): void {
  // Clear previous state
  mockExecutor.clearCalls();
  mockReadline.clearResponses();

  // Use shared CLI responses for consistent mocking
  const { github, jira, claude } = cliResponses;

  // GitHub CLI patterns
  mockExecutor.setRegexResponse(
    /^gh pr view \d+$/,
    github.responses.prView(123)
  );
  mockExecutor.setRegexResponse(
    /^gh pr diff \d+$/,
    github.responses.prDiff(123)
  );
  mockExecutor.setRegexResponse(
    /^gh pr view \d+ --json/,
    github.responses.prJSON(123)
  );
  mockExecutor.setRegexResponse(
    /^gh pr comment \d+/,
    github.responses.prComment
  );
  mockExecutor.setRegexResponse(/^gh --version/, github.responses.version);

  // Jira CLI patterns
  const ticketId = getTestTicketId();
  mockExecutor.setRegexResponse(
    new RegExp(`^jira issue view ${ticketId.replace('-', '\\-')}$`),
    jira.responses.issueView(ticketId)
  );
  mockExecutor.setRegexResponse(/^jira issue list/, jira.responses.issueList);
  mockExecutor.setRegexResponse(/^jira version/, jira.responses.version);

  // Claude CLI patterns
  mockExecutor.setRegexResponse(/^claude --version/, claude.responses.version);
  mockExecutor.setRegexResponse(/^claude/, claude.responses.analyze());

  // Utility commands
  mockExecutor.setRegexResponse(/^which \w+$/, { stdout: '/usr/bin/tool' });

  // Setup default readline responses
  mockReadline.setResponses(['y', 'yes', 'y']);
}

// Export additional data for compatibility
export {
  mockData,
  cliResponses,
  testScenarios,
  getTestTicketId,
  validateTestEnvironment,
};
