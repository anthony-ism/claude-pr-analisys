/**
 * GitHub service exports
 * Author: Anthony Rizzo, Co-pilot: Claude
 */

// Configuration and types
export {
  GitHubConfig,
  loadGitHubConfig,
  validateGitHubEnvironment,
  getGitHubSetupInstructions,
} from './config';

// Operations
export {
  GitHubError,
  GitHubErrorType,
  GitHubPRData,
  GitHubOperationOptions,
  checkGitHubCLI,
  validatePRNumber,
  validatePR,
  gatherPRData,
  postPRComment,
  setDependencies as setGitHubDependencies,
  resetDependencies as resetGitHubDependencies,
  isGitHubError,
} from './operations';

// Mock responses (legacy support)
const {
  githubCLIResponses,
  githubErrorResponses,
  githubCommandPatterns,
  getGitHubMockResponse,
} = require('./mock-responses');

export const mockResponses = {
  cliResponses: githubCLIResponses,
  errorResponses: githubErrorResponses,
  commandPatterns: githubCommandPatterns,
  getMockResponse: getGitHubMockResponse,
};

// Legacy exports for backward compatibility
export const cliResponses = githubCLIResponses;
export const errorResponses = githubErrorResponses;
export const commandPatterns = githubCommandPatterns;
export const getMockResponse = getGitHubMockResponse;
