/**
 * Jira service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Configuration and types
export {
  JiraConfig,
  loadJiraConfig,
  validateJiraEnvironment,
  getJiraSetupInstructions,
} from './config';

// Operations
export {
  JiraError,
  JiraErrorType,
  JiraOperationOptions,
  checkJiraCLI,
  extractJiraTicket,
  validateJiraTicket,
  gatherJiraData,
  getJiraConfig,
  setDependencies as setJiraDependencies,
  resetDependencies as resetJiraDependencies,
  isJiraError,
} from './operations';

// Mock responses (optional - only available in development builds)
let mockResponses: Record<string, unknown> | null = null;
let cliResponses: Record<string, string> | null = null;
let errorResponses: Record<string, string> | null = null;
let commandPatterns: Record<string, RegExp> | null = null;
let getMockResponse: ((command: string) => string | null) | null = null;
let getTestPatterns: (() => Record<string, RegExp>) | null = null;
let isValidCommand: ((command: string) => boolean) | null = null;

try {
  const mockModule = require('./mock-responses');
  cliResponses = mockModule.jiraCLIResponses;
  errorResponses = mockModule.jiraErrorResponses;
  commandPatterns = mockModule.jiraCommandPatterns;
  getMockResponse = mockModule.getJiraMockResponse;
  getTestPatterns = mockModule.getJiraTestPatterns;
  isValidCommand = mockModule.isValidJiraCommand;

  mockResponses = {
    cliResponses,
    errorResponses,
    commandPatterns,
    getMockResponse,
    getTestPatterns,
    isValidCommand,
  };
} catch (err) {
  // Mock responses not available in production build
}

export {
  mockResponses,
  cliResponses,
  errorResponses,
  commandPatterns,
  getMockResponse,
  getTestPatterns,
  isValidCommand,
};
