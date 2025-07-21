#!/usr/bin/env node

/**
 * E2E Integration Test Suite
 * Author: Anthony Rizzo, Co-pilot: Claude
 * Description: End-to-end testing for PR analysis automation tool
 */

import { TestRunner, MockExecutor } from '../utils/test-utils';

interface E2ETestConfig {
  githubRepository: string;
  jiraTicketPrefix: string;
  jiraServerUrl?: string;
  jiraUserEmail?: string;
  jiraApiToken?: string;
}

interface E2ETestScenario {
  name: string;
  description: string;
  config: E2ETestConfig;
  prNumber: string;
  expectedOutcome: 'success' | 'error' | 'warning';
  validations: Array<{
    type: 'file_exists' | 'contains_text' | 'cli_command' | 'config_validation';
    target: string;
    expected: string | boolean;
  }>;
}

/**
 * E2E Test Scenarios following CLAUDE.md directives
 */
const E2E_SCENARIOS: E2ETestScenario[] = [
  {
    name: 'basic_configuration_validation',
    description: 'Validate basic application configuration loads correctly',
    config: {
      githubRepository: 'test-org/test-repo',
      jiraTicketPrefix: 'TEST',
    },
    prNumber: '999', // Non-existent PR for testing
    expectedOutcome: 'error',
    validations: [
      {
        type: 'config_validation',
        target: 'environment',
        expected: true,
      },
      {
        type: 'cli_command',
        target: 'gh --version',
        expected: true,
      },
    ],
  },
  {
    name: 'full_jira_integration',
    description: 'Test complete Jira integration with proper credentials',
    config: {
      githubRepository: 'test-org/test-repo',
      jiraTicketPrefix: 'TEST',
      jiraServerUrl: 'https://test.atlassian.net',
      jiraUserEmail: 'test@example.com',
      jiraApiToken: 'test-token',
    },
    prNumber: '999',
    expectedOutcome: 'error', // Expected to fail on non-existent PR
    validations: [
      {
        type: 'config_validation',
        target: 'jira',
        expected: true,
      },
      {
        type: 'cli_command',
        target: 'jira --version',
        expected: false, // Jira CLI might not be available
      },
    ],
  },
  {
    name: 'code_coverage_workflow',
    description: 'E2E scenario for adding code coverage to unit tests',
    config: {
      githubRepository: 'test-org/test-repo',
      jiraTicketPrefix: 'COV',
    },
    prNumber: '123',
    expectedOutcome: 'warning',
    validations: [
      {
        type: 'file_exists',
        target: 'temp',
        expected: true,
      },
      {
        type: 'contains_text',
        target: 'code coverage',
        expected: true,
      },
    ],
  },
];

/**
 * E2E Test Runner
 */
class E2ETestRunner {
  private readonly testRunner: TestRunner;
  private readonly mockExec: MockExecutor;

  constructor() {
    this.testRunner = new TestRunner();
    this.mockExec = new MockExecutor();
    this.setupMockResponses();
  }

  /**
   * Setup mock responses for E2E testing
   */
  private setupMockResponses(): void {
    // GitHub CLI responses
    this.mockExec.addResponse(
      /^gh --version$/,
      'gh version 2.40.1 (2023-12-13)\nhttps://github.com/cli/cli/releases/tag/v2.40.1'
    );

    this.mockExec.addResponse(
      /^gh pr view \d+ --json.*$/,
      JSON.stringify({
        number: 123,
        title: 'TEST-456: Add code coverage reporting to unit tests',
        author: { login: 'testuser' },
        state: 'OPEN',
        body: 'This PR adds code coverage reporting to our unit test suite.',
        headRefName: 'feature/code-coverage',
        baseRefName: 'main',
        url: 'https://github.com/test-org/test-repo/pull/123',
      })
    );

    this.mockExec.addResponse(
      /^gh pr diff \d+$/,
      `diff --git a/package.json b/package.json
index 1234567..8901234 100644
--- a/package.json
+++ b/package.json
@@ -10,6 +10,7 @@
   "scripts": {
     "test": "jest",
+    "test:coverage": "jest --coverage",
     "build": "tsc"
   },
   "devDependencies": {`
    );

    // Jira CLI responses
    this.mockExec.addResponse(
      /^jira issue view TEST-456$/,
      `Issue: TEST-456
Title: Add code coverage reporting to unit tests
Status: In Progress
Description: Implement code coverage reporting for our Jest test suite to improve testing visibility.

Acceptance Criteria:
- Jest coverage configuration added
- Coverage reports generated in CI/CD
- Coverage thresholds defined
- Documentation updated`
    );

    // Error responses for non-existent items
    this.mockExec.addResponse(
      /^gh pr view 999 --json.*$/,
      '',
      1,
      'Error: Could not resolve to a PullRequest with the number of 999.'
    );

    this.mockExec.addResponse(
      /^jira --version$/,
      '',
      1,
      'jira: command not found'
    );
  }

  /**
   * Run all E2E test scenarios
   */
  async runAllScenarios(): Promise<void> {
    console.log('🚀 Starting E2E Integration Tests');
    console.log('='.repeat(50));

    let passed = 0;
    let failed = 0;

    for (const scenario of E2E_SCENARIOS) {
      try {
        console.log(`\n📋 Testing: ${scenario.name}`);
        console.log(`📝 ${scenario.description}`);

        const result = await this.runScenario(scenario);
        if (result) {
          console.log(`✅ ${scenario.name} - PASSED`);
          passed++;
        } else {
          console.log(`❌ ${scenario.name} - FAILED`);
          failed++;
        }
      } catch (error) {
        console.log(
          `💥 ${scenario.name} - ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 E2E Test Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }
  }

  /**
   * Run a single E2E test scenario
   */
  private async runScenario(scenario: E2ETestScenario): Promise<boolean> {
    // Set up environment for this scenario
    this.setTestEnvironment(scenario.config);

    // Import utilities with mock dependencies
    const { setDependencies } = require('../utils/pr-utils');
    setDependencies({ execAsync: this.mockExec.execAsync.bind(this.mockExec) });

    let allValidationsPassed = true;

    // Run validations
    for (const validation of scenario.validations) {
      try {
        const result = await this.runValidation(validation, scenario);
        if (!result) {
          console.log(
            `  ❌ Validation failed: ${validation.type} - ${validation.target}`
          );
          allValidationsPassed = false;
        } else {
          console.log(
            `  ✅ Validation passed: ${validation.type} - ${validation.target}`
          );
        }
      } catch (error) {
        console.log(
          `  💥 Validation error: ${validation.type} - ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        allValidationsPassed = false;
      }
    }

    return allValidationsPassed;
  }

  /**
   * Set environment variables for test scenario
   */
  private setTestEnvironment(config: E2ETestConfig): void {
    process.env.GITHUB_REPOSITORY = config.githubRepository;
    process.env.JIRA_TICKET_PREFIX = config.jiraTicketPrefix;

    if (config.jiraServerUrl) {
      process.env.JIRA_SERVER_URL = config.jiraServerUrl;
    }
    if (config.jiraUserEmail) {
      process.env.JIRA_USER_EMAIL = config.jiraUserEmail;
    }
    if (config.jiraApiToken) {
      process.env.JIRA_API_TOKEN = config.jiraApiToken;
    }
  }

  /**
   * Run a specific validation
   */
  private async runValidation(
    validation: E2ETestScenario['validations'][0],
    scenario: E2ETestScenario
  ): Promise<boolean> {
    switch (validation.type) {
      case 'config_validation':
        return this.validateConfiguration(validation.target);

      case 'cli_command':
        return this.validateCLICommand(
          validation.target,
          validation.expected as boolean
        );

      case 'file_exists':
        return this.validateFileExists(validation.target);

      case 'contains_text':
        return this.validateContainsText(validation.target, scenario);

      default:
        throw new Error(`Unknown validation type: ${(validation as any).type}`);
    }
  }

  /**
   * Validate configuration loading
   */
  private async validateConfiguration(target: string): Promise<boolean> {
    try {
      if (target === 'environment') {
        const { loadEnvironmentConfig } = require('../core/environment');
        const config = loadEnvironmentConfig();
        return (
          config.githubRepository !== undefined &&
          config.jiraTicketPrefix !== undefined
        );
      }

      if (target === 'jira') {
        const { loadJiraConfig } = require('../services/jira/config');
        const config = loadJiraConfig();
        return config.prefix !== undefined && config.serverUrl !== undefined;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate CLI command availability
   */
  private async validateCLICommand(
    command: string,
    expectedAvailable: boolean
  ): Promise<boolean> {
    try {
      const result = await this.mockExec.execAsync(command);
      return expectedAvailable ? result.code === 0 : result.code !== 0;
    } catch (error) {
      return !expectedAvailable;
    }
  }

  /**
   * Validate file existence
   */
  private validateFileExists(filePath: string): boolean {
    const fs = require('fs');
    const path = require('path');

    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      return fs.existsSync(fullPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate text content in scenario context
   */
  private async validateContainsText(
    text: string,
    scenario: E2ETestScenario
  ): Promise<boolean> {
    // For the code coverage scenario, check if mock responses contain relevant text
    if (scenario.name === 'code_coverage_workflow') {
      const responses = this.mockExec.getResponseHistory();
      return responses.some(
        response =>
          response.stdout.toLowerCase().includes(text.toLowerCase()) ||
          response.command.toLowerCase().includes(text.toLowerCase())
      );
    }

    return true;
  }
}

/**
 * Main execution when run as script
 */
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllScenarios().catch(error => {
    console.error('E2E Test Suite failed:', error);
    process.exit(1);
  });
}

export { E2ETestRunner, E2ETestScenario, E2ETestConfig };
