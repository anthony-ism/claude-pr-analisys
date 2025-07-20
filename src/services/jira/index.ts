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

// Mock responses (legacy support)
const {
  jiraCLIResponses,
  jiraErrorResponses,
  jiraCommandPatterns,
  getJiraMockResponse,
  getJiraTestPatterns,
  isValidJiraCommand,
} = require('./mock-responses');

export const mockResponses = {
  cliResponses: jiraCLIResponses,
  errorResponses: jiraErrorResponses,
  commandPatterns: jiraCommandPatterns,
  getMockResponse: getJiraMockResponse,
  getTestPatterns: getJiraTestPatterns,
  isValidCommand: isValidJiraCommand,
};

// Legacy exports for backward compatibility
export const cliResponses = jiraCLIResponses;
export const errorResponses = jiraErrorResponses;
export const commandPatterns = jiraCommandPatterns;
export const getMockResponse = getJiraMockResponse;
export const getTestPatterns = getJiraTestPatterns;
export const isValidCommand = isValidJiraCommand;
