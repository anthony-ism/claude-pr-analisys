/**
 * Centralized mock data exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Type definitions for mock data structures
export interface MockPRData {
  number: number;
  title: string;
  body: string;
  url: string;
  author: {
    login: string;
  };
  state: string;
  additions: number;
  deletions: number;
}

// Alias for GitHubPRData (used by test files)
export interface GitHubPRData extends MockPRData {}

export interface MockJiraData {
  key: string;
  summary: string;
  description: string;
  status: {
    name: string;
  };
  issuetype: {
    name: string;
  };
  priority: {
    name: string;
  };
}

export interface MockClaudeResponse {
  content: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface MockResponse {
  stdout: string;
  stderr?: string;
}

export interface TestScenario {
  ticketId: string;
  prNumber: number;
  githubData: MockPRData;
  jiraData: MockJiraData;
  claudeAnalysis: MockClaudeResponse;
}

export interface ValidationErrorScenario {
  prTitle: string;
  expectedError: string;
}

export interface CLIOperationScenario {
  command: string;
  response: MockResponse;
}

// Shared test utilities
const {
  getTestTicketId,
  validateTestEnvironment,
  setupTestEnvironment,
  cleanupTestEnvironment,
  getTestTicketPatterns,
} = require('../utils/test-helpers');

// Service mock data
const { getMockPRData, mockGitHubResponses } = require('./github-data');

const {
  getMockJiraData,
  mockJiraResponses,
  getMockJiraPatterns,
} = require('./jira-data');

const {
  getMockClaudePrompt,
  getMockClaudeResponse,
  mockClaudeResponses,
  getMockPromptVariations,
} = require('./claude-data');

// Service CLI mock responses
const {
  githubCLIResponses,
  githubErrorResponses,
  getGitHubMockResponse,
} = require('../../services/github/mock-responses');

const {
  jiraCLIResponses,
  jiraErrorResponses,
  getJiraMockResponse,
} = require('../../services/jira/mock-responses');

const {
  claudeCLIResponses,
  claudeErrorResponses,
  getClaudeMockResponse,
} = require('../../services/claude/mock-responses');

/**
 * Complete mock data sets for testing
 */
export const mockData = {
  github: {
    pr: getMockPRData() as MockPRData,
    responses: mockGitHubResponses,
  },
  jira: {
    data: getMockJiraData() as MockJiraData,
    responses: mockJiraResponses,
    patterns: getMockJiraPatterns(),
  },
  claude: {
    prompt: getMockClaudePrompt() as string,
    response: getMockClaudeResponse() as MockClaudeResponse,
    responses: mockClaudeResponses,
    variations: getMockPromptVariations(),
  },
};

/**
 * Complete CLI response sets for testing
 */
export const cliResponses = {
  github: {
    responses: githubCLIResponses,
    errors: githubErrorResponses,
    getMockResponse: getGitHubMockResponse,
  },
  jira: {
    responses: jiraCLIResponses,
    errors: jiraErrorResponses,
    getMockResponse: getJiraMockResponse,
  },
  claude: {
    responses: claudeCLIResponses,
    errors: claudeErrorResponses,
    getMockResponse: getClaudeMockResponse,
  },
};

/**
 * Test scenarios combining multiple services
 */
export const testScenarios = {
  prAnalysisWorkflow: {
    ticketId: getTestTicketId() as string,
    prNumber: 123,
    githubData: getMockPRData() as MockPRData,
    jiraData: getMockJiraData() as MockJiraData,
    claudeAnalysis: getMockClaudeResponse() as MockClaudeResponse,
  } as TestScenario,

  validationErrors: {
    missingTicket: {
      prTitle: 'Fix validation issue without ticket',
      expectedError: 'No Jira ticket found in PR title',
    } as ValidationErrorScenario,
    invalidTicket: {
      prTitle: 'INVALID-123: Fix something',
      expectedError: 'Ticket format does not match expected pattern',
    } as ValidationErrorScenario,
  },

  cliOperations: {
    githubPRFetch: {
      command: 'gh pr view 123 --json title,body,url',
      response: githubCLIResponses.prJSON(123),
    } as CLIOperationScenario,
    jiraTicketFetch: {
      command: `jira issue view ${getTestTicketId()}`,
      response: jiraCLIResponses.issueView(getTestTicketId()),
    } as CLIOperationScenario,
    claudeAnalysis: {
      command: 'claude < analysis-prompt.txt',
      response: claudeCLIResponses.analyze(),
    } as CLIOperationScenario,
  },
};

// Export shared utilities
export {
  getTestTicketId,
  validateTestEnvironment,
  setupTestEnvironment,
  cleanupTestEnvironment,
  getTestTicketPatterns,
};

// Export direct function exports for convenience
export {
  getMockPRData,
  mockGitHubResponses,
  getMockJiraData,
  mockJiraResponses,
  getMockJiraPatterns,
  getMockClaudePrompt,
  getMockClaudeResponse,
  mockClaudeResponses,
  getMockPromptVariations,
};

// Export CLI response functions
export { getGitHubMockResponse, getJiraMockResponse, getClaudeMockResponse };
